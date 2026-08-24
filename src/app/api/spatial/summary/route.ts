import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const stationsSummary = await query(`
      SELECT 
        COUNT(*)::int AS total_stations,
        COUNT(*) FILTER (WHERE status = 'aktif')::int AS active_stations,
        COUNT(*) FILTER (WHERE status != 'aktif')::int AS inactive_stations,
        MIN(longitude) AS min_lng,
        MIN(latitude) AS min_lat,
        MAX(longitude) AS max_lng,
        MAX(latitude) AS max_lat
      FROM monitoring_stations
    `)

    const eventsSummary = await query(`
      SELECT 
        COUNT(*)::int AS total_events,
        COUNT(*) FILTER (WHERE event_type = 'Harmful Algal Blooms')::int AS habs_total,
        COUNT(*) FILTER (WHERE event_type = 'Harmful Algal Blooms' AND (event_end_date IS NULL OR event_end_date >= CURRENT_DATE))::int AS habs_active,
        COUNT(*) FILTER (WHERE event_type = 'Jellyfish Bloom')::int AS jellyfish_total,
        COUNT(*) FILTER (WHERE event_type = 'Jellyfish Bloom' AND (event_end_date IS NULL OR event_end_date >= CURRENT_DATE))::int AS jellyfish_active,
        COUNT(*) FILTER (WHERE alert_status = 'Darurat')::int AS alert_darurat,
        COUNT(*) FILTER (WHERE alert_status = 'Siaga')::int AS alert_siaga,
        COUNT(*) FILTER (WHERE alert_status = 'Waspada')::int AS alert_waspada,
        COUNT(*) FILTER (WHERE alert_status = 'Normal')::int AS alert_normal
      FROM bloom_events
    `)

    const provincesList = await query(`
      SELECT DISTINCT province 
      FROM monitoring_stations 
      WHERE province IS NOT NULL 
      ORDER BY province ASC
    `)

    const sRow = stationsSummary.rows[0] || {}
    const eRow = eventsSummary.rows[0] || {}

    return NextResponse.json({
      success: true,
      data: {
        stations: {
          total: sRow.total_stations || 0,
          active: sRow.active_stations || 0,
          inactive: sRow.inactive_stations || 0,
          extent: {
            min_lng: sRow.min_lng ? parseFloat(sRow.min_lng) : 95.0,
            min_lat: sRow.min_lat ? parseFloat(sRow.min_lat) : -11.0,
            max_lng: sRow.max_lng ? parseFloat(sRow.max_lng) : 141.0,
            max_lat: sRow.max_lat ? parseFloat(sRow.max_lat) : 6.0,
          },
        },
        events: {
          total: eRow.total_events || 0,
          habs: {
            total: eRow.habs_total || 0,
            active: eRow.habs_active || 0,
          },
          jellyfish: {
            total: eRow.jellyfish_total || 0,
            active: eRow.jellyfish_active || 0,
          },
          alerts: {
            darurat: eRow.alert_darurat || 0,
            siaga: eRow.alert_siaga || 0,
            waspada: eRow.alert_waspada || 0,
            normal: eRow.alert_normal || 0,
          },
        },
        provinces: provincesList.rows.map((r) => r.province),
      },
    })
  } catch (error) {
    console.error("GET /api/spatial/summary Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil ringkasan data spasial WebGIS" },
      { status: 500 }
    )
  }
}
