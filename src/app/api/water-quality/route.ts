import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createWaterQualitySchema = z.object({
  record_code: z
    .string()
    .min(2, "Kode rekord minimal 2 karakter")
    .max(50, "Kode rekord maksimal 50 karakter")
    .trim(),
  sampling_event_id: z.string().nullable().optional(),
  station_id: z.string().nullable().optional(),
  beach_id: z.string().nullable().optional(),
  data_source_type: z.string().optional().default("Hasil Sampling"),
  source_title: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("q") || ""
    const stationId = searchParams.get("station_id") || ""
    const samplingEventId = searchParams.get("sampling_event_id") || ""
    const dateFrom = searchParams.get("date_from") || ""
    const dateTo = searchParams.get("date_to") || ""
    const minChlorophyll = searchParams.get("min_chlorophyll") || ""
    const maxChlorophyll = searchParams.get("max_chlorophyll") || ""
    const year = searchParams.get("year") || ""

    let sql = `
      SELECT 
        wq.id,
        wq.record_code,
        wq.sampling_event_id,
        COALESCE(wq.station_id, se.station_id) AS station_id,
        wq.beach_id,
        b.name AS beach_name,
        wq.data_source_type,
        wq.source_title,
        wq.source_url,
        COALESCE(wq.latitude, b.latitude, s.latitude) AS latitude,
        COALESCE(wq.longitude, b.longitude, s.longitude) AS longitude,
        COALESCE(se.sampling_code, '-') AS sampling_code,
        TO_CHAR(COALESCE(se.sampling_date, wq.created_at::date), 'YYYY-MM-DD') AS sampling_date,
        TO_CHAR(se.sampling_time, 'HH24:MI') AS sampling_time,
        se.weather_condition,
        COALESCE(s.station_code, 'ST-03') AS station_code,
        COALESCE(s.name, 'Stasiun Pengamatan') AS station_name,
        COALESCE(s.city, 'Pesisir') AS city,
        COALESCE(s.province, '-') AS province,
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
        (
          SELECT COUNT(*)::int
          FROM bloom_event_water_quality bwq
          WHERE bwq.water_quality_record_id = wq.id
        ) AS linked_bloom_events_count
      FROM water_quality_records wq
      LEFT JOIN sampling_events se ON wq.sampling_event_id = se.id
      LEFT JOIN monitoring_stations s ON COALESCE(wq.station_id, se.station_id) = s.id
      LEFT JOIN beaches b ON wq.beach_id = b.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (searchQuery.trim()) {
      params.push(`%${searchQuery.trim().toLowerCase()}%`)
      sql += ` AND (
        LOWER(wq.record_code) LIKE $${params.length}
        OR LOWER(se.sampling_code) LIKE $${params.length}
        OR LOWER(s.name) LIKE $${params.length}
        OR LOWER(s.station_code) LIKE $${params.length}
        OR LOWER(COALESCE(b.name, '')) LIKE $${params.length}
        OR LOWER(s.city) LIKE $${params.length}
        OR LOWER(s.province) LIKE $${params.length}
        OR LOWER(COALESCE(wq.notes, '')) LIKE $${params.length}
      )`
    }

    if (stationId.trim()) {
      params.push(stationId.trim())
      sql += ` AND (s.id::text = $${params.length} OR LOWER(s.station_code) = LOWER($${params.length}))`
    }

    if (samplingEventId.trim()) {
      params.push(samplingEventId.trim())
      sql += ` AND (se.id::text = $${params.length} OR LOWER(se.sampling_code) = LOWER($${params.length}))`
    }

    if (dateFrom.trim()) {
      params.push(dateFrom.trim())
      sql += ` AND se.sampling_date >= $${params.length}::date`
    }

    if (dateTo.trim()) {
      params.push(dateTo.trim())
      sql += ` AND se.sampling_date <= $${params.length}::date`
    }

    if (minChlorophyll.trim()) {
      params.push(parseFloat(minChlorophyll.trim()))
      sql += ` AND wq.chlorophyll_a_ugl >= $${params.length}`
    }

    if (maxChlorophyll.trim()) {
      params.push(parseFloat(maxChlorophyll.trim()))
      sql += ` AND wq.chlorophyll_a_ugl <= $${params.length}`
    }

    if (year.trim() && year !== "all") {
      params.push(parseInt(year.trim(), 10))
      sql += ` AND EXTRACT(YEAR FROM COALESCE(se.sampling_date, wq.created_at)) = $${params.length}`
    }

    sql += ` ORDER BY se.sampling_date DESC NULLS LAST, wq.created_at DESC`

    const result = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("GET /api/water-quality Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data parameter kualitas air",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Autentikasi diperlukan untuk menambahkan data kualitas air",
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = createWaterQualitySchema.safeParse(body)

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
      station_id,
      beach_id,
      data_source_type,
      source_title,
      source_url,
      latitude,
      longitude,
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

    // Check unique record_code (case-insensitive)
    const existingCode = await query(
      `SELECT id FROM water_quality_records WHERE LOWER(record_code) = $1 LIMIT 1`,
      [record_code.toLowerCase()]
    )

    if (existingCode.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Kode rekord '${record_code}' sudah digunakan`,
        },
        { status: 400 }
      )
    }

    let resolvedSamplingId = null
    let resolvedStationId = station_id?.trim() || null

    if (sampling_event_id && sampling_event_id.trim() !== "") {
      const samplingCheck = await query<{ id: string; station_id: string }>(
        `SELECT id, station_id FROM sampling_events WHERE id::text = $1 OR LOWER(sampling_code) = LOWER($1) LIMIT 1`,
        [sampling_event_id.trim()]
      )
      if (samplingCheck.rows.length > 0) {
        resolvedSamplingId = samplingCheck.rows[0].id
        if (!resolvedStationId) {
          resolvedStationId = samplingCheck.rows[0].station_id
        }
      }
    }

    const insertSql = `
      INSERT INTO water_quality_records (
        record_code,
        sampling_event_id,
        station_id,
        beach_id,
        data_source_type,
        source_title,
        source_url,
        latitude,
        longitude,
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
        notes
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27
      )
      RETURNING 
        id, record_code, sampling_event_id, station_id, beach_id,
        data_source_type, source_title, source_url, latitude, longitude,
        temperature_c, salinity_psu, dissolved_oxygen_mgl, ph, chlorophyll_a_ugl,
        turbidity_ntu, current_speed_ms, depth_m,
        tds_gl, ph_mv, orp_mv, conductivity_ms_cm, sigma_t,
        nitrate_no3_mgl, nitrite_no2_mgl, phosphorus_p_mgl, phosphate_po4_mgl,
        notes, created_at, updated_at
    `
    const insertRes = await query(insertSql, [
      record_code,
      resolvedSamplingId,
      resolvedStationId,
      beach_id?.trim() || null,
      data_source_type || "Hasil Sampling",
      source_title?.trim() || null,
      source_url?.trim() || null,
      latitude ?? null,
      longitude ?? null,
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
    ])

    return NextResponse.json(
      {
        success: true,
        message: "Data kualitas air berhasil ditambahkan",
        data: insertRes.rows[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/water-quality Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menambahkan data kualitas air baru",
      },
      { status: 500 }
    )
  }
}
