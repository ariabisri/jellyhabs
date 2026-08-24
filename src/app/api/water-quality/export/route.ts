import { NextResponse } from "next/server"
import { query } from "@/lib/db"

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return ""
  const str = String(val)
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("q") || ""
    const stationId = searchParams.get("station_id") || ""
    const samplingEventId = searchParams.get("sampling_event_id") || ""
    const dateFrom = searchParams.get("date_from") || ""
    const dateTo = searchParams.get("date_to") || ""

    let sql = `
      SELECT 
        wq.record_code,
        se.sampling_code,
        s.station_code,
        s.name AS station_name,
        s.city,
        s.province,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date,
        TO_CHAR(se.sampling_time, 'HH24:MI') AS sampling_time,
        wq.temperature_c,
        wq.salinity_psu,
        wq.dissolved_oxygen_mgl,
        wq.ph,
        wq.chlorophyll_a_ugl,
        wq.turbidity_ntu,
        wq.current_speed_ms,
        wq.depth_m,
        wq.notes
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

    sql += ` ORDER BY se.sampling_date DESC, wq.record_code ASC`

    const result = await query(sql, params)

    const headers = [
      "record_code",
      "sampling_code",
      "station_code",
      "station_name",
      "city",
      "province",
      "sampling_date",
      "sampling_time",
      "temperature_c",
      "salinity_psu",
      "dissolved_oxygen_mgl",
      "ph",
      "chlorophyll_a_ugl",
      "turbidity_ntu",
      "current_speed_ms",
      "depth_m",
      "notes",
    ]

    const csvRows = [headers.join(",")]

    for (const row of result.rows) {
      const line = [
        escapeCsvField(row.record_code),
        escapeCsvField(row.sampling_code),
        escapeCsvField(row.station_code),
        escapeCsvField(row.station_name),
        escapeCsvField(row.city),
        escapeCsvField(row.province),
        escapeCsvField(row.sampling_date),
        escapeCsvField(row.sampling_time),
        escapeCsvField(row.temperature_c),
        escapeCsvField(row.salinity_psu),
        escapeCsvField(row.dissolved_oxygen_mgl),
        escapeCsvField(row.ph),
        escapeCsvField(row.chlorophyll_a_ugl),
        escapeCsvField(row.turbidity_ntu),
        escapeCsvField(row.current_speed_ms),
        escapeCsvField(row.depth_m),
        escapeCsvField(row.notes),
      ]
      csvRows.push(line.join(","))
    }

    const csvOutput = "\uFEFF" + csvRows.join("\r\n") // UTF-8 BOM for Excel compatibility

    const dateStr = new Date().toISOString().split("T")[0]
    return new NextResponse(csvOutput, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="water_quality_records_${dateStr}.csv"`,
      },
    })
  } catch (error) {
    console.error("GET /api/water-quality/export Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor data kualitas air" },
      { status: 500 }
    )
  }
}
