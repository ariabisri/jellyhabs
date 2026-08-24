import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const sql = `
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
        s.updated_at,
        (
          SELECT json_agg(
            json_build_object(
              'id', se.id,
              'sampling_code', se.sampling_code,
              'sampling_date', TO_CHAR(se.sampling_date, 'YYYY-MM-DD'),
              'weather_condition', se.weather_condition,
              'image_url', se.image_url
            )
          )
          FROM (
            SELECT se2.* FROM sampling_events se2
            WHERE se2.station_id = s.id
            ORDER BY se2.sampling_date DESC, se2.created_at DESC
            LIMIT 5
          ) se
        ) AS recent_samplings,
        (
          SELECT json_agg(
            json_build_object(
              'id', be.id,
              'event_code', be.event_code,
              'event_type', be.event_type,
              'event_start_date', TO_CHAR(be.event_start_date, 'YYYY-MM-DD'),
              'event_end_date', TO_CHAR(be.event_end_date, 'YYYY-MM-DD'),
              'severity_level', be.severity_level,
              'alert_status', be.alert_status
            )
          )
          FROM (
            SELECT be2.* FROM bloom_events be2
            WHERE be2.station_id = s.id
            ORDER BY be2.event_start_date DESC
            LIMIT 5
          ) be
        ) AS recent_events,
        (
          SELECT json_build_object(
            'chlorophyll_a_ugl', wq.chlorophyll_a_ugl,
            'temperature_c', wq.temperature_c,
            'salinity_psu', wq.salinity_psu,
            'dissolved_oxygen_mgl', wq.dissolved_oxygen_mgl,
            'ph', wq.ph,
            'recorded_date', TO_CHAR(se_latest.sampling_date, 'YYYY-MM-DD')
          )
          FROM water_quality_records wq
          JOIN sampling_events se_latest ON wq.sampling_event_id = se_latest.id
          WHERE se_latest.station_id = s.id
          ORDER BY se_latest.sampling_date DESC, se_latest.created_at DESC
          LIMIT 1
        ) AS latest_water_quality
      FROM monitoring_stations s
      WHERE s.id::text = $1 OR LOWER(s.station_code) = LOWER($1)
      LIMIT 1
    `

    const res = await query(sql, [decodedId])

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Stasiun monitoring tidak ditemukan" },
        { status: 404 }
      )
    }

    const s = res.rows[0]

    const feature = {
      type: "Feature",
      id: s.id,
      geometry: {
        type: "Point",
        coordinates: [parseFloat(s.longitude), parseFloat(s.latitude)],
      },
      properties: {
        id: s.id,
        station_code: s.station_code,
        name: s.name,
        province: s.province,
        city: s.city,
        latitude: parseFloat(s.latitude),
        longitude: parseFloat(s.longitude),
        description: s.description,
        status: s.status,
        recent_samplings: s.recent_samplings || [],
        recent_events: s.recent_events || [],
        latest_water_quality: s.latest_water_quality || null,
      },
    }

    return NextResponse.json({
      success: true,
      data: feature,
    })
  } catch (error) {
    console.error("GET /api/spatial/stations/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data spasial stasiun" },
      { status: 500 }
    )
  }
}
