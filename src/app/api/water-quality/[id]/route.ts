import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updateWaterQualitySchema = z.object({
  record_code: z
    .string()
    .min(2, "Kode rekord minimal 2 karakter")
    .max(20, "Kode rekord maksimal 20 karakter")
    .trim(),
  sampling_event_id: z
    .string()
    .min(1, "Sampling event harus dipilih")
    .trim(),
  temperature_c: z.number().nullable().optional(),
  salinity_psu: z.number().nullable().optional(),
  dissolved_oxygen_mgl: z.number().nullable().optional(),
  ph: z.number().nullable().optional(),
  chlorophyll_a_ugl: z.number().nullable().optional(),
  turbidity_ntu: z.number().nullable().optional(),
  current_speed_ms: z.number().nullable().optional(),
  depth_m: z.number().nullable().optional(),
  notes: z.string().optional().default(""),
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
        wq.id,
        wq.record_code,
        wq.sampling_event_id,
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
        wq.temperature_c,
        wq.salinity_psu,
        wq.dissolved_oxygen_mgl,
        wq.ph,
        wq.chlorophyll_a_ugl,
        wq.turbidity_ntu,
        wq.current_speed_ms,
        wq.depth_m,
        wq.notes,
        wq.created_at,
        wq.updated_at,
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
                'relationship_notes', bwq.relationship_notes
              )
            )
            FROM bloom_event_water_quality bwq
            JOIN bloom_events be ON bwq.bloom_event_id = be.id
            WHERE bwq.water_quality_record_id = wq.id
          ),
          '[]'::json
        ) AS linked_bloom_events
      FROM water_quality_records wq
      JOIN sampling_events se ON wq.sampling_event_id = se.id
      LEFT JOIN users u ON se.recorded_by = u.id
      JOIN monitoring_stations s ON se.station_id = s.id
      WHERE wq.id::text = $1 OR LOWER(wq.record_code) = LOWER($1)
      LIMIT 1
    `
    const result = await query(sql, [decodedId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Data kualitas air tidak ditemukan",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error("GET /api/water-quality/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil detail data kualitas air",
      },
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
        {
          success: false,
          error: "Autentikasi diperlukan untuk mengubah data kualitas air",
        },
        { status: 401 }
      )
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const body = await request.json()
    const result = updateWaterQualitySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input data tidak valid",
        },
        { status: 400 }
      )
    }

    const {
      record_code,
      sampling_event_id,
      temperature_c,
      salinity_psu,
      dissolved_oxygen_mgl,
      ph,
      chlorophyll_a_ugl,
      turbidity_ntu,
      current_speed_ms,
      depth_m,
      notes,
    } = result.data

    // Check if record exists
    const findRecord = await query(
      `SELECT id FROM water_quality_records WHERE id::text = $1 OR LOWER(record_code) = LOWER($1) LIMIT 1`,
      [decodedId]
    )

    if (findRecord.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Data kualitas air tidak ditemukan",
        },
        { status: 404 }
      )
    }

    const targetId = findRecord.rows[0].id

    // Check record_code conflict
    const codeConflict = await query(
      `SELECT id FROM water_quality_records WHERE LOWER(record_code) = $1 AND id != $2 LIMIT 1`,
      [record_code.toLowerCase(), targetId]
    )

    if (codeConflict.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Kode rekord '${record_code}' sudah digunakan oleh rekord lain`,
        },
        { status: 400 }
      )
    }

    // Verify sampling event
    const samplingCheck = await query(
      `SELECT id FROM sampling_events WHERE id::text = $1 OR LOWER(sampling_code) = LOWER($1) LIMIT 1`,
      [sampling_event_id]
    )

    if (samplingCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Sampling event yang dipilih tidak ditemukan",
        },
        { status: 400 }
      )
    }

    const resolvedSamplingId = samplingCheck.rows[0].id

    const updateSql = `
      UPDATE water_quality_records
      SET 
        record_code = $1,
        sampling_event_id = $2,
        temperature_c = $3,
        salinity_psu = $4,
        dissolved_oxygen_mgl = $5,
        ph = $6,
        chlorophyll_a_ugl = $7,
        turbidity_ntu = $8,
        current_speed_ms = $9,
        depth_m = $10,
        notes = $11
      WHERE id = $12
      RETURNING 
        id, record_code, sampling_event_id, 
        temperature_c, salinity_psu, dissolved_oxygen_mgl, ph, chlorophyll_a_ugl,
        turbidity_ntu, current_speed_ms, depth_m, notes, created_at, updated_at
    `
    const updateRes = await query(updateSql, [
      record_code,
      resolvedSamplingId,
      temperature_c ?? null,
      salinity_psu ?? null,
      dissolved_oxygen_mgl ?? null,
      ph ?? null,
      chlorophyll_a_ugl ?? null,
      turbidity_ntu ?? null,
      current_speed_ms ?? null,
      depth_m ?? null,
      notes?.trim() || null,
      targetId,
    ])

    return NextResponse.json({
      success: true,
      message: "Data kualitas air berhasil diperbarui",
      data: updateRes.rows[0],
    })
  } catch (error) {
    console.error("PUT /api/water-quality/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memperbarui data kualitas air",
      },
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
        {
          success: false,
          error: "Autentikasi diperlukan untuk menghapus data kualitas air",
        },
        { status: 401 }
      )
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const deleteRes = await query(
      `DELETE FROM water_quality_records WHERE id::text = $1 OR LOWER(record_code) = LOWER($1) RETURNING id, record_code`,
      [decodedId]
    )

    if (deleteRes.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Data kualitas air tidak ditemukan",
        },
        { status: 404 }
      )
    }

    const deletedRecord = deleteRes.rows[0]

    return NextResponse.json({
      success: true,
      message: `Data kualitas air '${deletedRecord.record_code}' berhasil dihapus`,
    })
  } catch (error) {
    console.error("DELETE /api/water-quality/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menghapus data kualitas air",
      },
      { status: 500 }
    )
  }
}
