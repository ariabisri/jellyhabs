import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") // optional filter by year

    const yearCondition = year && year !== "all" ? `WHERE EXTRACT(YEAR FROM incident_date) = ${parseInt(year, 10)}` : ""

    // 1. Overall & Current Year Summary
    const summarySql = `
      SELECT
        COUNT(*)::int AS total_incidents,
        COALESCE(SUM(victim_count), 0)::int AS total_victims,
        COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM incident_date) = 2026 THEN victim_count ELSE 0 END), 0)::int AS victims_2026,
        COALESCE(SUM(CASE WHEN victim_gender = 'Laki-laki' THEN victim_count ELSE 0 END), 0)::int AS male_victims,
        COALESCE(SUM(CASE WHEN victim_gender = 'Perempuan' THEN victim_count ELSE 0 END), 0)::int AS female_victims,
        COALESCE(SUM(CASE WHEN victim_gender IS NULL OR (victim_gender != 'Laki-laki' AND victim_gender != 'Perempuan') THEN victim_count ELSE 0 END), 0)::int AS unspecified_victims
      FROM sting_records
      ${yearCondition}
    `
    const summaryRes = await query(summarySql)
    const summary = summaryRes.rows[0]

    // 2. Yearly breakdown
    const yearlySql = `
      SELECT
        EXTRACT(YEAR FROM incident_date)::int AS year,
        COUNT(*)::int AS incidents,
        COALESCE(SUM(victim_count), 0)::int AS victims
      FROM sting_records
      GROUP BY year
      ORDER BY year ASC
    `
    const yearlyRes = await query(yearlySql)

    // 3. Monthly breakdown (1-12)
    const monthlySql = `
      SELECT
        EXTRACT(MONTH FROM incident_date)::int AS month_num,
        TO_CHAR(incident_date, 'FMMonth') AS month_name,
        COUNT(*)::int AS incidents,
        COALESCE(SUM(victim_count), 0)::int AS victims
      FROM sting_records
      ${yearCondition}
      GROUP BY month_num, month_name
      ORDER BY month_num ASC
    `
    const monthlyRes = await query(monthlySql)

    // 4. Top beaches breakdown
    const beachSql = `
      SELECT
        location_name,
        COUNT(*)::int AS incidents,
        COALESCE(SUM(victim_count), 0)::int AS victims,
        AVG(latitude) AS latitude,
        AVG(longitude) AS longitude
      FROM sting_records
      ${yearCondition}
      GROUP BY location_name
      ORDER BY victims DESC
      LIMIT 10
    `
    const beachRes = await query(beachSql)

    // 5. Gender distribution for charts
    const genderDist = [
      { name: "Laki-laki", value: summary.male_victims },
      { name: "Perempuan", value: summary.female_victims },
    ]
    if (summary.unspecified_victims > 0) {
      genderDist.push({ name: "Tidak Dicatat", value: summary.unspecified_victims })
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          ...summary,
          top_beach: beachRes.rows[0] ? { name: beachRes.rows[0].location_name, victims: beachRes.rows[0].victims } : null,
        },
        yearly: yearlyRes.rows,
        monthly: monthlyRes.rows,
        beaches: beachRes.rows,
        gender_distribution: genderDist,
      },
    })
  } catch (error) {
    console.error("GET /api/stings/stats Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal memproses statistik korban sengatan" },
      { status: 500 }
    )
  }
}
