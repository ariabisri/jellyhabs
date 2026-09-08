import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const province = searchParams.get("province") || "all"
    const hasActiveBloom = searchParams.get("has_active_bloom")
    const q = searchParams.get("q") || ""
    const bbox = searchParams.get("bbox") // Format: minLng,minLat,maxLng,maxLat

    let whereClause = "WHERE 1=1"
    const params: unknown[] = []

    if (status !== "all") {
      params.push(status)
      whereClause += ` AND s.status = $${params.length}`
    }

    if (province !== "all") {
      params.push(province)
      whereClause += ` AND LOWER(s.province) = LOWER($${params.length})`
    }

    if (q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`)
      whereClause += ` AND (LOWER(s.name) LIKE $${params.length} OR LOWER(s.station_code) LIKE $${params.length} OR LOWER(s.city) LIKE $${params.length})`
    }

    if (bbox) {
      const parts = bbox.split(",").map((p) => parseFloat(p.trim()))
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        const [minLng, minLat, maxLng, maxLat] = parts
        params.push(minLng, minLat, maxLng, maxLat)
        const idx = params.length - 3
        whereClause += ` AND s.longitude >= $${idx} AND s.latitude >= $${idx + 1} AND s.longitude <= $${idx + 2} AND s.latitude <= $${idx + 3}`
      }
    }

    // Direct SQL building RFC 7946 GeoJSON FeatureCollection
    const sql = `
      WITH station_metrics AS (
        SELECT 
          s.id,
          s.station_code,
          s.name,
          s.province,
          s.city,
          s.latitude,
          s.longitude,
          s.description,
          s.status,
          s.created_at,
          COUNT(DISTINCT se.id)::int AS total_samplings,
          COUNT(DISTINCT be.id)::int AS total_events,
          COUNT(DISTINCT be.id) FILTER (WHERE be.event_end_date IS NULL OR be.event_end_date >= CURRENT_DATE)::int AS active_events_count,
          TO_CHAR(MAX(se.sampling_date), 'YYYY-MM-DD') AS latest_sampling_date,
          (
            SELECT wq.chlorophyll_a_ugl
            FROM water_quality_records wq
            JOIN sampling_events se2 ON wq.sampling_event_id = se2.id
            WHERE se2.station_id = s.id AND wq.chlorophyll_a_ugl IS NOT NULL
            ORDER BY se2.sampling_date DESC, se2.created_at DESC
            LIMIT 1
          ) AS latest_chlorophyll_a,
          (
            SELECT wq.temperature_c
            FROM water_quality_records wq
            JOIN sampling_events se2 ON wq.sampling_event_id = se2.id
            WHERE se2.station_id = s.id AND wq.temperature_c IS NOT NULL
            ORDER BY se2.sampling_date DESC, se2.created_at DESC
            LIMIT 1
          ) AS latest_temperature,
          (
            SELECT wq.dissolved_oxygen_mgl
            FROM water_quality_records wq
            JOIN sampling_events se2 ON wq.sampling_event_id = se2.id
            WHERE se2.station_id = s.id AND wq.dissolved_oxygen_mgl IS NOT NULL
            ORDER BY se2.sampling_date DESC, se2.created_at DESC
            LIMIT 1
          ) AS latest_dissolved_oxygen
        FROM monitoring_stations s
        LEFT JOIN sampling_events se ON s.id = se.station_id
        LEFT JOIN bloom_events be ON s.id = be.station_id
        ${whereClause}
        GROUP BY s.id, s.station_code, s.name, s.province, s.city, s.latitude, s.longitude, s.description, s.status, s.created_at
        ${hasActiveBloom === "true" ? "HAVING COUNT(DISTINCT be.id) FILTER (WHERE be.event_end_date IS NULL OR be.event_end_date >= CURRENT_DATE) > 0" : ""}
      )
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(
          json_agg(
            json_build_object(
              'type', 'Feature',
              'id', sm.id,
              'geometry', json_build_object(
                'type', 'Point',
                'coordinates', json_build_array(sm.longitude, sm.latitude)
              ),
              'properties', json_build_object(
                'id', sm.id,
                'station_code', sm.station_code,
                'name', sm.name,
                'province', sm.province,
                'city', sm.city,
                'latitude', sm.latitude,
                'longitude', sm.longitude,
                'status', sm.status,
                'description', sm.description,
                'total_samplings', sm.total_samplings,
                'total_events', sm.total_events,
                'active_events_count', sm.active_events_count,
                'latest_sampling_date', sm.latest_sampling_date,
                'latest_chlorophyll_a', sm.latest_chlorophyll_a,
                'latest_temperature', sm.latest_temperature,
                'latest_dissolved_oxygen', sm.latest_dissolved_oxygen
              )
            )
          ),
          '[]'::json
        )
      ) AS geojson
      FROM station_metrics sm
    `

    const res = await query(sql, params)
    const geojson = res.rows[0]?.geojson || { type: "FeatureCollection", features: [] }

    return NextResponse.json(geojson)
  } catch (error) {
    console.error("GET /api/spatial/stations Error:", error)
    return NextResponse.json(
      { type: "FeatureCollection", features: [], error: "Gagal mengambil data spasial stasiun" },
      { status: 500 }
    )
  }
}
