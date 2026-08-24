import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get("event_type") || "all"
    const alertStatus = searchParams.get("alert_status") || "all"
    const severityLevel = searchParams.get("severity_level") || "all"
    const isActive = searchParams.get("is_active")
    const q = searchParams.get("q") || ""
    const bbox = searchParams.get("bbox")

    let whereClause = "WHERE 1=1"
    const params: unknown[] = []

    if (eventType !== "all") {
      params.push(eventType)
      whereClause += ` AND be.event_type = $${params.length}`
    }

    if (alertStatus !== "all") {
      params.push(alertStatus)
      whereClause += ` AND be.alert_status = $${params.length}`
    }

    if (severityLevel !== "all") {
      params.push(severityLevel)
      whereClause += ` AND be.severity_level = $${params.length}`
    }

    if (isActive === "true") {
      whereClause += ` AND (be.event_end_date IS NULL OR be.event_end_date >= CURRENT_DATE)`
    } else if (isActive === "false") {
      whereClause += ` AND (be.event_end_date IS NOT NULL AND be.event_end_date < CURRENT_DATE)`
    }

    if (q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`)
      whereClause += ` AND (LOWER(be.event_code) LIKE $${params.length} OR LOWER(s.name) LIKE $${params.length} OR LOWER(s.city) LIKE $${params.length} OR LOWER(be.description) LIKE $${params.length})`
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

    const sql = `
      WITH event_data AS (
        SELECT 
          be.id,
          be.event_code,
          be.event_type,
          TO_CHAR(be.event_start_date, 'YYYY-MM-DD') AS event_start_date,
          TO_CHAR(be.event_end_date, 'YYYY-MM-DD') AS event_end_date,
          (be.event_end_date IS NULL OR be.event_end_date >= CURRENT_DATE) AS is_active,
          be.severity_level,
          be.alert_status,
          be.description,
          be.impact_summary,
          be.mitigation_actions,
          be.station_id,
          s.station_code,
          s.name AS station_name,
          s.city,
          s.province,
          s.latitude,
          s.longitude,
          (
            SELECT json_agg(
              json_build_object(
                'scientific_name', sm.scientific_name,
                'common_name', sm.common_name,
                'organism_category', sm.organism_category,
                'is_toxic', sm.is_toxic,
                'density_value', pr.density_value,
                'density_unit', pr.density_unit
              )
            )
            FROM bloom_event_plankton bep
            JOIN plankton_records pr ON bep.plankton_record_id = pr.id
            JOIN species_master sm ON pr.species_id = sm.id
            WHERE bep.bloom_event_id = be.id
          ) AS associated_species,
          (
            SELECT ROUND(AVG(wq.chlorophyll_a_ugl)::numeric, 2)
            FROM bloom_event_water_quality bewq
            JOIN water_quality_records wq ON bewq.water_quality_record_id = wq.id
            WHERE bewq.bloom_event_id = be.id AND wq.chlorophyll_a_ugl IS NOT NULL
          ) AS avg_chlorophyll_a,
          (
            SELECT ROUND(AVG(wq.temperature_c)::numeric, 2)
            FROM bloom_event_water_quality bewq
            JOIN water_quality_records wq ON bewq.water_quality_record_id = wq.id
            WHERE bewq.bloom_event_id = be.id AND wq.temperature_c IS NOT NULL
          ) AS avg_temperature
        FROM bloom_events be
        JOIN monitoring_stations s ON be.station_id = s.id
        ${whereClause}
        ORDER BY be.event_start_date DESC
      )
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(
          json_agg(
            json_build_object(
              'type', 'Feature',
              'id', ed.id,
              'geometry', json_build_object(
                'type', 'Point',
                'coordinates', json_build_array(ed.longitude, ed.latitude)
              ),
              'properties', json_build_object(
                'id', ed.id,
                'event_code', ed.event_code,
                'event_type', ed.event_type,
                'event_start_date', ed.event_start_date,
                'event_end_date', ed.event_end_date,
                'is_active', ed.is_active,
                'severity_level', ed.severity_level,
                'alert_status', ed.alert_status,
                'description', ed.description,
                'impact_summary', ed.impact_summary,
                'mitigation_actions', ed.mitigation_actions,
                'station_id', ed.station_id,
                'station_code', ed.station_code,
                'station_name', ed.station_name,
                'city', ed.city,
                'province', ed.province,
                'latitude', ed.latitude,
                'longitude', ed.longitude,
                'associated_species', COALESCE(ed.associated_species, '[]'::json),
                'avg_chlorophyll_a', ed.avg_chlorophyll_a,
                'avg_temperature', ed.avg_temperature
              )
            )
          ),
          '[]'::json
        )
      ) AS geojson
      FROM event_data ed
    `

    const res = await query(sql, params)
    const geojson = res.rows[0]?.geojson || { type: "FeatureCollection", features: [] }

    return NextResponse.json(geojson)
  } catch (error) {
    console.error("GET /api/spatial/events Error:", error)
    return NextResponse.json(
      { type: "FeatureCollection", features: [], error: "Gagal mengambil data spasial kejadian blooming" },
      { status: 500 }
    )
  }
}
