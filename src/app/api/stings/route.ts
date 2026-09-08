import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveBeachCoordinates } from "@/lib/beach-coordinates"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const offset = (page - 1) * limit

    const year = searchParams.get("year")
    const month = searchParams.get("month")
    const location = searchParams.get("location")
    const gender = searchParams.get("gender")
    const bloomEventId = searchParams.get("bloom_event_id")
    const stationId = searchParams.get("station_id")
    const q = searchParams.get("q")

    const conditions: string[] = []
    const params: unknown[] = []

    if (year && year !== "all") {
      params.push(parseInt(year, 10))
      conditions.push(`EXTRACT(YEAR FROM sr.incident_date) = $${params.length}`)
    }

    if (month && month !== "all") {
      params.push(parseInt(month, 10))
      conditions.push(`EXTRACT(MONTH FROM sr.incident_date) = $${params.length}`)
    }

    if (location && location !== "all") {
      params.push(`%${location.trim().toLowerCase()}%`)
      conditions.push(`LOWER(sr.location_name) LIKE $${params.length}`)
    }

    if (gender && gender !== "all") {
      params.push(gender)
      conditions.push(`sr.victim_gender = $${params.length}`)
    }

    if (bloomEventId) {
      params.push(bloomEventId)
      conditions.push(`sr.bloom_event_id = $${params.length}`)
    }

    if (stationId) {
      params.push(stationId)
      conditions.push(`sr.station_id = $${params.length}`)
    }

    if (q && q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`)
      conditions.push(
        `(LOWER(sr.location_name) LIKE $${params.length} OR LOWER(COALESCE(sr.victim_name, '')) LIKE $${params.length} OR LOWER(COALESCE(sr.severity_level, '')) LIKE $${params.length} OR LOWER(COALESCE(sr.treatment_notes, '')) LIKE $${params.length})`
      )
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Count total rows
    const countSql = `SELECT count(*)::int as total FROM sting_records sr ${whereClause}`
    const countRes = await query<{ total: number }>(countSql, params)
    const total = countRes.rows[0]?.total || 0
    const totalPages = Math.ceil(total / limit)

    // Query data with join to station & bloom event
    const dataSql = `
      SELECT 
        sr.id,
        sr.incident_date,
        sr.incident_time,
        sr.location_name,
        sr.latitude,
        sr.longitude,
        sr.station_id,
        sr.beach_id,
        b.name as beach_master_name,
        b.village as beach_village,
        b.subdistrict as beach_subdistrict,
        b.sar_post_name as beach_sar_post,
        ms.station_code,
        ms.name as station_name,
        sr.bloom_event_id,
        be.event_code as bloom_event_code,
        be.event_type as bloom_event_type,
        sr.victim_count,
        sr.victim_name,
        sr.victim_age,
        sr.victim_gender,
        sr.severity_level,
        sr.treatment_notes,
        sr.reported_by,
        u.full_name as reported_by_name,
        sr.created_at,
        sr.updated_at
      FROM sting_records sr
      LEFT JOIN monitoring_stations ms ON sr.station_id = ms.id
      LEFT JOIN beaches b ON sr.beach_id = b.id
      LEFT JOIN bloom_events be ON sr.bloom_event_id = be.id
      LEFT JOIN users u ON sr.reported_by = u.id
      ${whereClause}
      ORDER BY sr.incident_date DESC, sr.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    const dataRes = await query(dataSql, [...params, limit, offset])

    return NextResponse.json({
      success: true,
      data: dataRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error("GET /api/stings Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data laporan korban sengatan" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk mencatat insiden sengatan" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      incident_date,
      incident_time,
      location_name,
      beach_id,
      latitude,
      longitude,
      station_id,
      bloom_event_id,
      victim_count = 1,
      victim_name,
      victim_age,
      victim_gender,
      severity_level,
      treatment_notes,
    } = body

    let resolvedLocationName = location_name?.trim() || ""
    let resolvedStationId = station_id || null
    let lat = latitude ? parseFloat(latitude) : null
    let lng = longitude ? parseFloat(longitude) : null

    // If beach_id is provided, resolve master beach data
    let resolvedBeachId = beach_id || null
    if (resolvedBeachId) {
      const bRes = await query<{
        id: string
        name: string
        latitude: number
        longitude: number
        station_id: string
      }>("SELECT id, name, latitude, longitude, station_id FROM beaches WHERE id::text = $1", [
        resolvedBeachId,
      ])
      if (bRes.rows.length > 0) {
        const b = bRes.rows[0]
        if (!resolvedLocationName) resolvedLocationName = b.name
        if (!lat) lat = Number(b.latitude)
        if (!lng) lng = Number(b.longitude)
        if (!resolvedStationId) resolvedStationId = b.station_id
      }
    }

    if (!incident_date || !resolvedLocationName) {
      return NextResponse.json(
        { success: false, error: "Tanggal kejadian dan lokasi pantai wajib diisi" },
        { status: 400 }
      )
    }

    // Auto resolve coords if still missing
    if (!lat || !lng) {
      const resolved = resolveBeachCoordinates(resolvedLocationName)
      lat = resolved[0]
      lng = resolved[1]
    }

    // Resolve station ST-03 if not explicitly provided
    if (!resolvedStationId) {
      const stRes = await query<{ id: string }>(
        "SELECT id FROM monitoring_stations WHERE station_code = 'ST-03' LIMIT 1"
      )
      resolvedStationId = stRes.rows[0]?.id || null
    }

    const insertSql = `
      INSERT INTO sting_records (
        incident_date, incident_time, location_name, latitude, longitude,
        station_id, beach_id, bloom_event_id, victim_count, victim_name,
        victim_age, victim_gender, severity_level, treatment_notes, reported_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `

    const result = await query(insertSql, [
      incident_date,
      incident_time || null,
      resolvedLocationName,
      lat,
      lng,
      resolvedStationId,
      resolvedBeachId,
      bloom_event_id || null,
      Math.max(1, parseInt(victim_count, 10) || 1),
      victim_name?.trim() || null,
      victim_age?.trim() || null,
      victim_gender || null,
      severity_level || "Ringan - Iritasi Kulit",
      treatment_notes || null,
      session.id,
    ])

    return NextResponse.json(
      {
        success: true,
        message: "Laporan insiden sengatan ubur-ubur berhasil dicatat",
        data: result.rows[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/stings Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mencatat laporan sengatan ubur-ubur" },
      { status: 500 }
    )
  }
}
