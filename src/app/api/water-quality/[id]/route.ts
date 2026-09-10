import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updateWaterQualitySchema = z.object({
  record_code: z
    .string()
    .min(2, "Kode rekord minimal 2 karakter")
    .max(50, "Kode rekord maksimal 50 karakter")
    .trim(),
  sampling_event_id: z.string().nullable().optional(),
  data_source_type: z.string().optional().default("Hasil Sampling"),
  source_title: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  temperature_c: z.number().nullable().optional(),
  salinity_psu: z.number().nullable().optional(),
  dissolved_oxygen_mgl: z.number().nullable().optional(),
  ph: z.number().nullable().optional(),
  chlorophyll_a_ugl: z.number().nullable().optional(),
  turbidity_ntu: z.number().nullable().optional(),
  current_speed_ms: z.number().nullable().optional(),
  depth_m: z.number().nullable().optional(),
  tds_gl: z.number().nullable().optional(),
  ph_mv: z.number().nullable().optional(),
  orp_mv: z.number().nullable().optional(),
  conductivity_ms_cm: z.number().nullable().optional(),
  sigma_t: z.number().nullable().optional(),
  nitrate_no3_mgl: z.number().nullable().optional(),
  nitrite_no2_mgl: z.number().nullable().optional(),
  phosphorus_p_mgl: z.number().nullable().optional(),
  phosphate_po4_mgl: z.number().nullable().optional(),
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
        wq.data_source_type,
        wq.source_title,
        wq.source_url,
        COALESCE(se.sampling_code, '-') AS sampling_code,
        TO_CHAR(COALESCE(se.sampling_date, wq.created_at::date), 'YYYY-MM-DD') AS sampling_date,
        TO_CHAR(se.sampling_time, 'HH24:MI') AS sampling_time,
        se.weather_condition,
        se.field_notes AS sampling_notes,
        u.full_name AS sampling_recorder_name,
        s.id AS station_id,
        COALESCE(s.station_code, 'ST-03') AS station_code,
        COALESCE(s.name, 'Stasiun Pengamatan') AS station_name,
        COALESCE(s.city, 'Pesisir') AS city,
        COALESCE(s.province, '-') AS province,
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
        wq.tds_gl,
        wq.ph_mv,
        wq.orp_mv,
        wq.conductivity_ms_cm,
        wq.sigma_t,
        wq.nitrate_no3_mgl,
        wq.nitrite_no2_mgl,
        wq.phosphorus_p_mgl,
        wq.phosphate_po4_mgl,
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
      LEFT JOIN sampling_events se ON wq.sampling_event_id = se.id
      LEFT JOIN users u ON se.recorded_by = u.id
      LEFT JOIN monitoring_stations s ON se.station_id = s.id
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
      data_source_type,
      source_title,
      source_url,
      temperature_c,
      salinity_psu,
      dissolved_oxygen_mgl,
      ph,
      chlorophyll_a_ugl,
      turbidity_ntu,
      current_speed_ms,
      depth_m,
      tds_gl,
      ph_mv,
      orp_mv,
      conductivity_ms_cm,
      sigma_t,
      nitrate_no3_mgl,
      nitrite_no2_mgl,
      phosphorus_p_mgl,
      phosphate_po4_mgl,
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

    let resolvedSamplingId = null
    if (sampling_event_id && sampling_event_id.trim() !== "") {
      const samplingCheck = await query(
        `SELECT id FROM sampling_events WHERE id::text = $1 OR LOWER(sampling_code) = LOWER($1) LIMIT 1`,
        [sampling_event_id.trim()]
      )
      if (samplingCheck.rows.length > 0) {
        resolvedSamplingId = samplingCheck.rows[0].id
      }
    }

    const updateSql = `
      UPDATE water_quality_records
      SET 
        record_code = $1,
        sampling_event_id = $2,
        data_source_type = $3,
        source_title = $4,
        source_url = $5,
        temperature_c = $6,
        salinity_psu = $7,
        dissolved_oxygen_mgl = $8,
        ph = $9,
        chlorophyll_a_ugl = $10,
        turbidity_ntu = $11,
        current_speed_ms = $12,
        depth_m = $13,
        tds_gl = $14,
        ph_mv = $15,
        orp_mv = $16,
        conductivity_ms_cm = $17,
        sigma_t = $18,
        nitrate_no3_mgl = $19,
        nitrite_no2_mgl = $20,
        phosphorus_p_mgl = $21,
        phosphate_po4_mgl = $22,
        notes = $23,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $24
      RETURNING 
        id, record_code, sampling_event_id, data_source_type, source_title, source_url,
        temperature_c, salinity_psu, dissolved_oxygen_mgl, ph, chlorophyll_a_ugl,
        turbidity_ntu, current_speed_ms, depth_m,
        tds_gl, ph_mv, orp_mv, conductivity_ms_cm, sigma_t,
        nitrate_no3_mgl, nitrite_no2_mgl, phosphorus_p_mgl, phosphate_po4_mgl,
        notes, created_at, updated_at
    `
    const updateRes = await query(updateSql, [
      record_code,
      resolvedSamplingId,
      data_source_type || "Hasil Sampling",
      source_title?.trim() || null,
      source_url?.trim() || null,
      temperature_c ?? null,
      salinity_psu ?? null,
      dissolved_oxygen_mgl ?? null,
      ph ?? null,
      chlorophyll_a_ugl ?? null,
      turbidity_ntu ?? null,
      current_speed_ms ?? null,
      depth_m ?? null,
      tds_gl ?? null,
      ph_mv ?? null,
      orp_mv ?? null,
      conductivity_ms_cm ?? null,
      sigma_t ?? null,
      nitrate_no3_mgl ?? null,
      nitrite_no2_mgl ?? null,
      phosphorus_p_mgl ?? null,
      phosphate_po4_mgl ?? null,
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
