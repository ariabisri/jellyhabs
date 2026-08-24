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
    const weatherCondition = searchParams.get("weather_condition") || ""
    const dateFrom = searchParams.get("date_from") || ""
    const dateTo = searchParams.get("date_to") || ""

    let sql = `
      SELECT 
        se.sampling_code,
        s.station_code,
        s.name AS station_name,
        s.city,
        s.province,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date,
        TO_CHAR(se.sampling_time, 'HH24:MI') AS sampling_time,
        se.weather_condition,
        se.field_notes,
        u.full_name AS recorded_by,
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

    const headers = [
      "sampling_code",
      "station_code",
      "station_name",
      "city",
      "province",
      "sampling_date",
      "sampling_time",
      "weather_condition",
      "field_notes",
      "recorded_by",
      "water_quality_count",
      "plankton_count",
    ]

    const csvRows = [headers.join(",")]

    for (const row of result.rows) {
      const line = [
        escapeCsvField(row.sampling_code),
        escapeCsvField(row.station_code),
        escapeCsvField(row.station_name),
        escapeCsvField(row.city),
        escapeCsvField(row.province),
        escapeCsvField(row.sampling_date),
        escapeCsvField(row.sampling_time),
        escapeCsvField(row.weather_condition),
        escapeCsvField(row.field_notes),
        escapeCsvField(row.recorded_by),
        escapeCsvField(row.water_quality_count),
        escapeCsvField(row.plankton_count),
      ]
      csvRows.push(line.join(","))
    }

    const csvOutput = "\uFEFF" + csvRows.join("\r\n")
    const dateStr = new Date().toISOString().split("T")[0]

    return new NextResponse(csvOutput, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sampling_events_${dateStr}.csv"`,
      },
    })
  } catch (error) {
    console.error("GET /api/sampling/export Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor data sampling event" },
      { status: 500 }
    )
  }
}
