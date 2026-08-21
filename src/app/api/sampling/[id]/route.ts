import { NextResponse } from "next/server"
import { z } from "zod"
import { pool, query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const memberSchema = z.object({
  user_id: z.string().min(1, "User ID peneliti harus valid"),
  role_in_sampling: z.string().min(1, "Peran peneliti harus diisi").max(50),
})

const updateSamplingSchema = z.object({
  sampling_code: z
    .string()
    .min(2, "Kode sampling minimal 2 karakter")
    .max(20, "Kode sampling maksimal 20 karakter")
    .trim(),
  station_id: z.string().min(1, "Stasiun monitoring harus dipilih").trim(),
  sampling_date: z.string().min(1, "Tanggal sampling harus diisi"),
  sampling_time: z.string().optional().nullable(),
  weather_condition: z.string().max(50).optional().nullable(),
  field_notes: z.string().optional().nullable(),
  members: z.array(memberSchema).optional().default([]),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const sql = `
      SELECT 
        se.id,
        se.sampling_code,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date,
        TO_CHAR(se.sampling_time, 'HH24:MI') AS sampling_time,
        se.weather_condition,
        se.field_notes,
        se.created_at,
        se.updated_at,
        s.id AS station_id,
        s.station_code,
        s.name AS station_name,
        s.city,
        s.province,
        s.latitude,
        s.longitude,
        u.id AS recorded_by_id,
        u.full_name AS recorded_by_name,
        u.email AS recorded_by_email,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', sem.id,
                'user_id', sem.user_id,
                'full_name', mu.full_name,
                'email', mu.email,
                'role_in_sampling', sem.role_in_sampling
              )
            )
            FROM sampling_event_members sem
            JOIN users mu ON sem.user_id = mu.id
            WHERE sem.sampling_event_id = se.id
          ),
          '[]'::json
        ) AS members,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', wq.id,
                'record_code', wq.record_code,
                'temperature_c', wq.temperature_c,
                'salinity_psu', wq.salinity_psu,
                'dissolved_oxygen_mgl', wq.dissolved_oxygen_mgl,
                'ph', wq.ph,
                'chlorophyll_a_ugl', wq.chlorophyll_a_ugl,
                'turbidity_ntu', wq.turbidity_ntu,
                'depth_m', wq.depth_m,
                'notes', wq.notes
              )
            )
            FROM water_quality_records wq
            WHERE wq.sampling_event_id = se.id
          ),
          '[]'::json
        ) AS water_quality_records,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pr.id,
                'record_code', pr.record_code,
                'species_id', pr.species_id,
                'species_code', sm.species_code,
                'scientific_name', sm.scientific_name,
                'common_name', sm.common_name,
                'organism_category', sm.organism_category,
                'is_toxic', sm.is_toxic,
                'density_value', pr.density_value,
                'density_unit', pr.density_unit,
                'toxicity_status', pr.toxicity_status,
                'morphological_notes', pr.morphological_notes
              )
            )
            FROM plankton_records pr
            JOIN species_master sm ON pr.species_id = sm.id
            WHERE pr.sampling_event_id = se.id
          ),
          '[]'::json
        ) AS plankton_records
      FROM sampling_events se
      JOIN monitoring_stations s ON se.station_id = s.id
      JOIN users u ON se.recorded_by = u.id
      WHERE se.id::text = $1 OR LOWER(se.sampling_code) = LOWER($1)
      LIMIT 1
    `
    const result = await query(sql, [decodedId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data sampling event tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error("GET /api/sampling/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil detail sampling event" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk mengubah sampling event" },
        { status: 401 }
      )
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const body = await request.json()
    const result = updateSamplingSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input data sampling tidak valid",
        },
        { status: 400 }
      )
    }

    const findEvent = await query(
      `SELECT id FROM sampling_events WHERE id::text = $1 OR LOWER(sampling_code) = LOWER($1) LIMIT 1`,
      [decodedId]
    )

    if (findEvent.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data sampling event tidak ditemukan" },
        { status: 404 }
      )
    }

    const targetId = findEvent.rows[0].id
    const {
      sampling_code,
      station_id,
      sampling_date,
      sampling_time,
      weather_condition,
      field_notes,
      members,
    } = result.data

    // Check code collision
    const codeConflict = await query(
      `SELECT id FROM sampling_events WHERE LOWER(sampling_code) = $1 AND id != $2 LIMIT 1`,
      [sampling_code.toLowerCase(), targetId]
    )

    if (codeConflict.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: `Kode sampling '${sampling_code}' sudah digunakan oleh sampling lain` },
        { status: 400 }
      )
    }

    // Verify station
    const stationCheck = await query(
      `SELECT id FROM monitoring_stations WHERE id::text = $1 OR LOWER(station_code) = LOWER($1) LIMIT 1`,
      [station_id]
    )

    if (stationCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Stasiun monitoring tidak ditemukan" },
        { status: 400 }
      )
    }

    const resolvedStationId = stationCheck.rows[0].id

    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      const updateSql = `
        UPDATE sampling_events
        SET 
          sampling_code = $1,
          station_id = $2,
          sampling_date = $3,
          sampling_time = $4,
          weather_condition = $5,
          field_notes = $6
        WHERE id = $7
        RETURNING *
      `
      const eventRes = await client.query(updateSql, [
        sampling_code,
        resolvedStationId,
        sampling_date,
        sampling_time || null,
        weather_condition || null,
        field_notes || null,
        targetId,
      ])

      // Sync members: delete old members, insert new members
      await client.query(`DELETE FROM sampling_event_members WHERE sampling_event_id = $1`, [targetId])

      if (members && members.length > 0) {
        const uniqueMemberIds = new Set<string>()

        for (const m of members) {
          if (!m.user_id || uniqueMemberIds.has(m.user_id)) continue
          uniqueMemberIds.add(m.user_id)

          const insertMemberSql = `
            INSERT INTO sampling_event_members (
              sampling_event_id, user_id, role_in_sampling
            )
            VALUES ($1, $2, $3)
          `
          await client.query(insertMemberSql, [
            targetId,
            m.user_id,
            m.role_in_sampling || "Anggota Tim Lapangan",
          ])
        }
      }

      await client.query("COMMIT")

      return NextResponse.json({
        success: true,
        message: `Sampling event '${sampling_code}' berhasil diperbarui`,
        data: eventRes.rows[0],
      })
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("PUT /api/sampling/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui sampling event" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk menghapus sampling event" },
        { status: 401 }
      )
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const deleteRes = await query(
      `DELETE FROM sampling_events WHERE id::text = $1 OR LOWER(sampling_code) = LOWER($1) RETURNING id, sampling_code`,
      [decodedId]
    )

    if (deleteRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data sampling event tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Sampling event '${deleteRes.rows[0].sampling_code}' berhasil dihapus`,
    })
  } catch (error) {
    console.error("DELETE /api/sampling/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal menghapus sampling event" },
      { status: 500 }
    )
  }
}
