import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const sql = `
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::interval
        ) AS month_date
      )
      SELECT 
        TO_CHAR(m.month_date, 'Mon YYYY') AS time_label,
        TO_CHAR(m.month_date, 'YYYY-MM') AS month_key,
        COALESCE(s.sampling_count, 0)::int AS sampling_count,
        COALESCE(h.habs_count, 0)::int AS habs_count,
        COALESCE(j.jelly_count, 0)::int AS jelly_count
      FROM months m
      LEFT JOIN (
        SELECT 
          DATE_TRUNC('month', sampling_date) AS m_date,
          COUNT(*)::int AS sampling_count
        FROM sampling_events
        GROUP BY m_date
      ) s ON m.month_date = s.m_date
      LEFT JOIN (
        SELECT 
          DATE_TRUNC('month', event_start_date) AS m_date,
          COUNT(*)::int AS habs_count
        FROM bloom_events
        WHERE event_type = 'Harmful Algal Blooms'
        GROUP BY m_date
      ) h ON m.month_date = h.m_date
      LEFT JOIN (
        SELECT 
          DATE_TRUNC('month', event_start_date) AS m_date,
          COUNT(*)::int AS jelly_count
        FROM bloom_events
        WHERE event_type = 'Jellyfish Bloom'
        GROUP BY m_date
      ) j ON m.month_date = j.m_date
      ORDER BY m.month_date ASC
    `
    const result = await query(sql)

    const xAxisData: string[] = []
    const samplingSeries: number[] = []
    const habsSeries: number[] = []
    const jellySeries: number[] = []

    result.rows.forEach((r) => {
      xAxisData.push(r.time_label)
      samplingSeries.push(r.sampling_count)
      habsSeries.push(r.habs_count)
      jellySeries.push(r.jelly_count)
    })

    return NextResponse.json({
      success: true,
      data: {
        xAxisData,
        samplingSeries,
        habsSeries,
        jellySeries,
        raw: result.rows,
      },
    })
  } catch (error) {
    console.error("GET /api/dashboard/charts/monthly-trends Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data tren bulanan" },
      { status: 500 }
    )
  }
}
