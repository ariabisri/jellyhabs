import { NextResponse } from "next/server"
import { query } from "@/lib/db"

const PARAMETER_CONFIG: Record<
  string,
  { column: string; label: string; unit: string; minRange?: number; maxRange?: number }
> = {
  chlorophyll_a_ugl: { column: "wq.chlorophyll_a_ugl", label: "Klorofil-a", unit: "µg/L" },
  temperature_c: { column: "wq.temperature_c", label: "Suhu Permukaan Laut", unit: "°C" },
  salinity_psu: { column: "wq.salinity_psu", label: "Salinitas", unit: "psu" },
  dissolved_oxygen_mgl: { column: "wq.dissolved_oxygen_mgl", label: "Oksigen Terlarut (DO)", unit: "mg/L" },
  ph: { column: "wq.ph", label: "Derajat Keasaman (pH)", unit: "pH" },
  turbidity_ntu: { column: "wq.turbidity_ntu", label: "Kekeruhan (Turbidity)", unit: "NTU" },
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const paramKey = searchParams.get("parameter") || "chlorophyll_a_ugl"
    const stationId = searchParams.get("station_id") || "all"
    const interval = searchParams.get("interval") || "monthly"

    const config = PARAMETER_CONFIG[paramKey] || PARAMETER_CONFIG.chlorophyll_a_ugl
    const columnExpr = config.column

    let dateTruncUnit = "month"
    let dateFormat = "Mon YYYY"

    if (interval === "weekly") {
      dateTruncUnit = "week"
      dateFormat = "DD Mon YYYY"
    } else if (interval === "daily") {
      dateTruncUnit = "day"
      dateFormat = "DD Mon"
    }

    let sql = `
      SELECT 
        DATE_TRUNC('${dateTruncUnit}', se.sampling_date) AS time_bucket,
        TO_CHAR(DATE_TRUNC('${dateTruncUnit}', se.sampling_date), '${dateFormat}') AS time_label,
        ROUND(AVG(${columnExpr})::numeric, 2) AS avg_value,
        ROUND(MIN(${columnExpr})::numeric, 2) AS min_value,
        ROUND(MAX(${columnExpr})::numeric, 2) AS max_value,
        COUNT(${columnExpr})::int AS record_count
      FROM water_quality_records wq
      JOIN sampling_events se ON wq.sampling_event_id = se.id
      JOIN monitoring_stations s ON se.station_id = s.id
      WHERE ${columnExpr} IS NOT NULL
    `
    const params: unknown[] = []

    if (stationId.trim() && stationId !== "all") {
      params.push(stationId.trim())
      sql += ` AND (s.id::text = $${params.length} OR LOWER(s.station_code) = LOWER($${params.length}))`
    }

    sql += `
      GROUP BY time_bucket, time_label
      ORDER BY time_bucket ASC
      LIMIT 24
    `

    const result = await query(sql, params)

    const xAxisData: string[] = []
    const seriesData: number[] = []
    const minData: number[] = []
    const maxData: number[] = []

    result.rows.forEach((r) => {
      xAxisData.push(r.time_label)
      seriesData.push(parseFloat(r.avg_value) || 0)
      minData.push(parseFloat(r.min_value) || 0)
      maxData.push(parseFloat(r.max_value) || 0)
    })

    return NextResponse.json({
      success: true,
      data: {
        parameter: paramKey,
        label: config.label,
        unit: config.unit,
        xAxisData,
        seriesData,
        minData,
        maxData,
        raw: result.rows,
      },
    })
  } catch (error) {
    console.error("GET /api/dashboard/charts/water-quality-trend Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data tren kualitas air" },
      { status: 500 }
    )
  }
}
