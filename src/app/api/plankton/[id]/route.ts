import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updatePlanktonSchema = z.object({
  record_code: z
    .string()
    .min(2, "Kode rekord minimal 2 karakter")
    .max(20, "Kode rekord maksimal 20 karakter")
    .trim(),
  sampling_event_id: z
    .string()
    .min(1, "Sampling event harus dipilih")
    .trim(),
  species_id: z
    .string()
    .min(1, "Spesies harus dipilih")
    .trim(),
  density_value: z.number({ message: "Nilai kepadatan harus berupa angka" }).min(0, "Nilai kepadatan tidak boleh negatif"),
  density_unit: z
    .string()
    .min(1, "Satuan kepadatan harus diisi")
    .max(30, "Satuan kepadatan maksimal 30 karakter")
    .trim(),
  toxicity_status: z
    .string()
    .min(1, "Status toksisitas harus diisi")
    .max(30, "Status toksisitas maksimal 30 karakter")
    .trim(),
  morphological_notes: z.string().optional().default(""),
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
        pr.id,
        pr.record_code,
        pr.sampling_event_id,
        se.sampling_code,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date,
        TO_CHAR(se.sampling_time, 'HH24:MI') AS sampling_time,
        se.weather_condition,
        se.field_notes AS sampling_notes,
        u.full_name AS sampling_recorder_name,
        s.id AS station_id,
        s.station_code,
        s.name AS station_name,
        s.city,
        s.province,
        s.latitude,
        s.longitude,
        pr.species_id,
        sm.species_code,
        sm.scientific_name,
        sm.common_name,
        sm.organism_category,
        sm.kingdom,
        sm.phylum,
        sm.class_name,
        sm.order_name,
        sm.family,
        sm.genus,
        sm.is_toxic,
        sm.description AS species_description,
        sm.image_url AS species_image_url,
        pr.density_value,
        pr.density_unit,
        pr.toxicity_status,
        pr.morphological_notes,
        pr.created_at,
        pr.updated_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', be.id,
                'event_code', be.event_code,
                'event_type', be.event_type,
                'event_start_date', TO_CHAR(be.event_start_date, 'YYYY-MM-DD'),
                'event_end_date', TO_CHAR(be.event_end_date, 'YYYY-MM-DD'),
                'alert_status', be.alert_status,
                'severity_level', be.severity_level,
                'relationship_notes', bep.relationship_notes
              )
            )
            FROM bloom_event_plankton bep
            JOIN bloom_events be ON bep.bloom_event_id = be.id
            WHERE bep.plankton_record_id = pr.id
          ),
          '[]'::json
        ) AS linked_bloom_events
      FROM plankton_records pr
      JOIN species_master sm ON pr.species_id = sm.id
      JOIN sampling_events se ON pr.sampling_event_id = se.id
      LEFT JOIN users u ON se.recorded_by = u.id
      JOIN monitoring_stations s ON se.station_id = s.id
      WHERE pr.id::text = $1 OR LOWER(pr.record_code) = LOWER($1)
      LIMIT 1
    `
    const result = await query(sql, [decodedId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data pemantauan plankton / ubur-ubur tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error("GET /api/plankton/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil detail data plankton & ubur-ubur" },
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
        { success: false, error: "Autentikasi diperlukan untuk mengubah data plankton / ubur-ubur" },
        { status: 401 }
      )
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const body = await request.json()
    const result = updatePlanktonSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input data tidak valid",
        },
        { status: 400 }
      )
    }

    const findRecord = await query(
      `SELECT id FROM plankton_records WHERE id::text = $1 OR LOWER(record_code) = LOWER($1) LIMIT 1`,
      [decodedId]
    )

    if (findRecord.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data pemantauan tidak ditemukan" },
        { status: 404 }
      )
    }

    const targetId = findRecord.rows[0].id
    const {
      record_code,
      sampling_event_id,
      species_id,
      density_value,
      density_unit,
      toxicity_status,
      morphological_notes,
    } = result.data

    // Check code collision
    const codeConflict = await query(
      `SELECT id FROM plankton_records WHERE LOWER(record_code) = $1 AND id != $2 LIMIT 1`,
      [record_code.toLowerCase(), targetId]
    )

    if (codeConflict.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: `Kode rekord '${record_code}' sudah digunakan oleh data lain` },
        { status: 400 }
      )
    }

    // Verify sampling
    const samplingCheck = await query(
      `SELECT id FROM sampling_events WHERE id::text = $1 OR LOWER(sampling_code) = LOWER($1) LIMIT 1`,
      [sampling_event_id]
    )

    if (samplingCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Sampling event tidak ditemukan" },
        { status: 400 }
      )
    }

    // Verify species
    const speciesCheck = await query(
      `SELECT id FROM species_master WHERE id::text = $1 OR LOWER(species_code) = LOWER($1) OR LOWER(scientific_name) = LOWER($1) LIMIT 1`,
      [species_id]
    )

    if (speciesCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Spesies tidak ditemukan di master data" },
        { status: 400 }
      )
    }

    const resolvedSamplingId = samplingCheck.rows[0].id
    const resolvedSpeciesId = speciesCheck.rows[0].id

    const updateSql = `
      UPDATE plankton_records
      SET 
        record_code = $1,
        sampling_event_id = $2,
        species_id = $3,
        density_value = $4,
        density_unit = $5,
        toxicity_status = $6,
        morphological_notes = $7
      WHERE id = $8
      RETURNING *
    `
    const updateRes = await query(updateSql, [
      record_code,
      resolvedSamplingId,
      resolvedSpeciesId,
      density_value,
      density_unit,
      toxicity_status,
      morphological_notes?.trim() || null,
      targetId,
    ])

    return NextResponse.json({
      success: true,
      message: "Data pemantauan plankton / ubur-ubur berhasil diperbarui",
      data: updateRes.rows[0],
    })
  } catch (error) {
    console.error("PUT /api/plankton/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui data plankton / ubur-ubur" },
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
        { success: false, error: "Autentikasi diperlukan untuk menghapus data plankton / ubur-ubur" },
        { status: 401 }
      )
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const deleteRes = await query(
      `DELETE FROM plankton_records WHERE id::text = $1 OR LOWER(record_code) = LOWER($1) RETURNING id, record_code`,
      [decodedId]
    )

    if (deleteRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data pemantauan tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Data pemantauan '${deleteRes.rows[0].record_code}' berhasil dihapus`,
    })
  } catch (error) {
    console.error("DELETE /api/plankton/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal menghapus data plankton / ubur-ubur" },
      { status: 500 }
    )
  }
}
