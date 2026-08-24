import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createWaterQualitySchema = z.object({
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

    let sql = `
      SELECT 
        wq.id,
        wq.record_code,
        wq.sampling_event_id,
        se.sampling_code,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date,
        TO_CHAR(se.sampling_time, 'HH24:MI') AS sampling_time,
        se.weather_condition,
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
        (
          SELECT COUNT(*)::int
          FROM bloom_event_water_quality bwq
          WHERE bwq.water_quality_record_id = wq.id
        ) AS linked_bloom_events_count
      FROM water_quality_records wq
      JOIN sampling_events se ON wq.sampling_event_id = se.id
      JOIN monitoring_stations s ON se.station_id = s.id
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

    sql += ` ORDER BY se.sampling_date DESC, wq.created_at DESC`

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

    // Verify sampling event exists (can be UUID id or sampling_code)
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

    const insertSql = `
      INSERT INTO water_quality_records (
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
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id, record_code, sampling_event_id, 
        temperature_c, salinity_psu, dissolved_oxygen_mgl, ph, chlorophyll_a_ugl,
        turbidity_ntu, current_speed_ms, depth_m, notes, created_at, updated_at
    `
    const insertRes = await query(insertSql, [
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
