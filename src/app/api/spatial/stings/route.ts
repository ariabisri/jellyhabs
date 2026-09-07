import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const minVictims = parseInt(searchParams.get("min_victims") || "1", 10)

    const conditions: string[] = []
    const params: unknown[] = []

    if (year && year !== "all") {
      params.push(parseInt(year, 10))
      conditions.push(`EXTRACT(YEAR FROM incident_date) = $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const sql = `
      SELECT
        location_name,
        AVG(latitude)::float AS latitude,
        AVG(longitude)::float AS longitude,
        COUNT(*)::int AS total_incidents,
        SUM(victim_count)::int AS total_victims,
        SUM(CASE WHEN victim_gender = 'Laki-laki' THEN victim_count ELSE 0 END)::int AS male_victims,
        SUM(CASE WHEN victim_gender = 'Perempuan' THEN victim_count ELSE 0 END)::int AS female_victims,
        MAX(incident_date) AS latest_incident_date,
        MIN(incident_date) AS earliest_incident_date,
        ARRAY_AGG(DISTINCT severity_level) FILTER (WHERE severity_level IS NOT NULL) AS severity_levels
      FROM sting_records
      ${whereClause}
      GROUP BY location_name
      HAVING SUM(victim_count) >= ${minVictims}
      ORDER BY total_victims DESC
    `

    const res = await query(sql, params)

    const features = res.rows.map((row) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [row.longitude, row.latitude],
      },
      properties: {
        id: `sting-hotspot-${row.location_name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        location_name: row.location_name,
        total_victims: row.total_victims,
        total_incidents: row.total_incidents,
        male_victims: row.male_victims,
        female_victims: row.female_victims,
        latest_incident_date: row.latest_incident_date ? new Date(row.latest_incident_date).toISOString().split("T")[0] : null,
        earliest_incident_date: row.earliest_incident_date ? new Date(row.earliest_incident_date).toISOString().split("T")[0] : null,
        severity_levels: row.severity_levels || [],
        latitude: row.latitude,
        longitude: row.longitude,
      },
    }))

    return NextResponse.json({
      type: "FeatureCollection",
      features,
    })
  } catch (error) {
    console.error("GET /api/spatial/stings Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal memproses data spasial hotspot korban sengatan" },
      { status: 500 }
    )
  }
}
