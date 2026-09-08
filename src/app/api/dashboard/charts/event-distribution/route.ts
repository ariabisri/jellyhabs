import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupBy = searchParams.get("group_by") || "province"

    // 1. Regional Distribution (by Province)
    const provinceQuery = `
      SELECT 
        s.province AS label,
        COUNT(*)::int AS total_events,
        COUNT(*) FILTER (WHERE be.event_type = 'Harmful Algal Blooms')::int AS habs_count,
        COUNT(*) FILTER (WHERE be.event_type = 'Jellyfish Bloom')::int AS jellyfish_count
      FROM bloom_events be
      JOIN monitoring_stations s ON be.station_id = s.id
      GROUP BY s.province
      ORDER BY total_events DESC, s.province ASC
    `
    const provinceRes = await query(provinceQuery)

    // 2. Alert Status Breakdown
    const alertQuery = `
      SELECT 
        be.alert_status AS label,
        COUNT(*)::int AS total_events,
        COUNT(*) FILTER (WHERE be.event_type = 'Harmful Algal Blooms')::int AS habs_count,
        COUNT(*) FILTER (WHERE be.event_type = 'Jellyfish Bloom')::int AS jellyfish_count
      FROM bloom_events be
      GROUP BY be.alert_status
      ORDER BY 
        CASE 
          WHEN be.alert_status = 'Darurat' THEN 1
          WHEN be.alert_status = 'Siaga' THEN 2
          WHEN be.alert_status = 'Waspada' THEN 3
          ELSE 4
        END
    `
    const alertRes = await query(alertQuery)

    // 3. Severity Level Breakdown
    const severityQuery = `
      SELECT 
        be.severity_level AS label,
        COUNT(*)::int AS total_events,
        COUNT(*) FILTER (WHERE be.event_type = 'Harmful Algal Blooms')::int AS habs_count,
        COUNT(*) FILTER (WHERE be.event_type = 'Jellyfish Bloom')::int AS jellyfish_count
      FROM bloom_events be
      GROUP BY be.severity_level
      ORDER BY 
        CASE 
          WHEN be.severity_level = 'kritis' THEN 1
          WHEN be.severity_level = 'tinggi' THEN 2
          WHEN be.severity_level = 'sedang' THEN 3
          ELSE 4
        END
    `
    const severityRes = await query(severityQuery)

    // Prepare province chart xAxis and series data
    const provinceXAxis: string[] = []
    const provinceHabsSeries: number[] = []
    const provinceJellySeries: number[] = []
    const provinceTotalSeries: number[] = []

    provinceRes.rows.forEach((r) => {
      provinceXAxis.push(r.label)
      provinceHabsSeries.push(r.habs_count)
      provinceJellySeries.push(r.jellyfish_count)
      provinceTotalSeries.push(r.total_events)
    })

    return NextResponse.json({
      success: true,
      data: {
        by_province: {
          xAxisData: provinceXAxis,
          habsSeries: provinceHabsSeries,
          jellyfishSeries: provinceJellySeries,
          totalSeries: provinceTotalSeries,
          raw: provinceRes.rows,
        },
        by_alert_status: alertRes.rows,
        by_severity: severityRes.rows,
      },
    })
  } catch (error) {
    console.error("GET /api/dashboard/charts/event-distribution Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data distribusi kejadian" },
      { status: 500 }
    )
  }
}
