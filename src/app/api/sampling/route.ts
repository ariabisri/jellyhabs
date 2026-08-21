import { NextResponse } from "next/server"
import { z } from "zod"
import { pool, query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const memberSchema = z.object({
  user_id: z.string().min(1, "User ID peneliti harus valid"),
  role_in_sampling: z.string().min(1, "Peran peneliti harus diisi").max(50),
})

const createSamplingSchema = z.object({
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("q") || ""
    const stationId = searchParams.get("station_id") || ""
    const weatherCondition = searchParams.get("weather_condition") || ""
    const dateFrom = searchParams.get("date_from") || ""
    const dateTo = searchParams.get("date_to") || ""

    let sql = `
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
        (
          SELECT COUNT(*)::int
          FROM water_quality_records wq
          WHERE wq.sampling_event_id = se.id
        ) AS water_quality_count,
        (
          SELECT COUNT(*)::int
          FROM plankton_records pr
          WHERE pr.sampling_event_id = se.id
        ) AS plankton_count
      FROM sampling_events se
      JOIN monitoring_stations s ON se.station_id = s.id
      JOIN users u ON se.recorded_by = u.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (searchQuery.trim()) {
      params.push(`%${searchQuery.trim().toLowerCase()}%`)
      sql += ` AND (
        LOWER(se.sampling_code) LIKE $${params.length}
        OR LOWER(s.name) LIKE $${params.length}
        OR LOWER(s.station_code) LIKE $${params.length}
        OR LOWER(COALESCE(se.weather_condition, '')) LIKE $${params.length}
        OR LOWER(COALESCE(se.field_notes, '')) LIKE $${params.length}
        OR LOWER(u.full_name) LIKE $${params.length}
      )`
    }

    if (stationId.trim() && stationId !== "all") {
      params.push(stationId.trim())
      sql += ` AND (s.id::text = $${params.length} OR LOWER(s.station_code) = LOWER($${params.length}))`
    }

    if (weatherCondition.trim() && weatherCondition !== "all") {
      params.push(`%${weatherCondition.trim().toLowerCase()}%`)
      sql += ` AND LOWER(se.weather_condition) LIKE $${params.length}`
    }

    if (dateFrom.trim()) {
      params.push(dateFrom.trim())
      sql += ` AND se.sampling_date >= $${params.length}::date`
    }

    if (dateTo.trim()) {
      params.push(dateTo.trim())
      sql += ` AND se.sampling_date <= $${params.length}::date`
    }

    sql += ` ORDER BY se.sampling_date DESC, se.created_at DESC`

    const result = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("GET /api/sampling Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar sampling event" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk mencatat sampling event" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = createSamplingSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input data sampling tidak valid",
        },
        { status: 400 }
      )
    }

    const {
      sampling_code,
      station_id,
      sampling_date,
      sampling_time,
      weather_condition,
      field_notes,
      members,
    } = result.data

    // Check unique sampling_code
    const existingCode = await query(
      `SELECT id FROM sampling_events WHERE LOWER(sampling_code) = $1 LIMIT 1`,
      [sampling_code.toLowerCase()]
    )

    if (existingCode.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: `Kode sampling '${sampling_code}' sudah digunakan` },
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

    // Use transaction for sampling event and team members
    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      const insertEventSql = `
        INSERT INTO sampling_events (
          sampling_code, station_id, sampling_date, sampling_time,
          weather_condition, field_notes, recorded_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `
      const eventRes = await client.query(insertEventSql, [
        sampling_code,
        resolvedStationId,
        sampling_date,
        sampling_time || null,
        weather_condition || null,
        field_notes || null,
        session.id,
      ])

      const newEventId = eventRes.rows[0].id

      // Insert members if any
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
            ON CONFLICT (sampling_event_id, user_id) DO UPDATE
            SET role_in_sampling = EXCLUDED.role_in_sampling
          `
          await client.query(insertMemberSql, [
            newEventId,
            m.user_id,
            m.role_in_sampling || "Anggota Tim Lapangan",
          ])
        }
      }

      await client.query("COMMIT")

      return NextResponse.json(
        {
          success: true,
          message: `Sampling event '${sampling_code}' berhasil ditambahkan`,
          data: eventRes.rows[0],
        },
        { status: 201 }
      )
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("POST /api/sampling Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan sampling event" },
      { status: 500 }
    )
  }
}
