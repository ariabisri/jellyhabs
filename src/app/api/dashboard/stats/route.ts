import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // 1. Station Statistics
    const stationsStats = await query(`
      SELECT 
        COUNT(*)::int AS total_stations,
        COUNT(*) FILTER (WHERE status = 'aktif')::int AS active_stations,
        COUNT(*) FILTER (WHERE status != 'aktif')::int AS inactive_stations,
        COUNT(DISTINCT province)::int AS total_provinces
      FROM monitoring_stations
    `)

    // 2. Sampling Event Statistics
    const samplingStats = await query(`
      SELECT 
        COUNT(*)::int AS total_samplings,
        COUNT(*) FILTER (WHERE sampling_date >= CURRENT_DATE - INTERVAL '30 days')::int AS recent_samplings_30d,
        COUNT(*) FILTER (WHERE sampling_date >= CURRENT_DATE - INTERVAL '7 days')::int AS recent_samplings_7d
      FROM sampling_events
    `)

    // 3. Water Quality & Plankton Records Count
    const dataRecordsStats = await query(`
      SELECT 
        (SELECT COUNT(*)::int FROM water_quality_records) AS total_water_quality_records,
        (SELECT COUNT(*)::int FROM plankton_records) AS total_plankton_records,
        (SELECT COUNT(*)::int FROM datasets) AS total_datasets
    `)

    // 4. HABs Events Statistics
    const habsStats = await query(`
      SELECT 
        COUNT(*)::int AS total_habs_events,
        COUNT(*) FILTER (WHERE event_end_date IS NULL OR event_end_date >= CURRENT_DATE)::int AS active_habs_events,
        COUNT(*) FILTER (WHERE alert_status = 'Darurat')::int AS habs_darurat,
        COUNT(*) FILTER (WHERE alert_status = 'Siaga')::int AS habs_siaga,
        COUNT(*) FILTER (WHERE alert_status = 'Waspada')::int AS habs_waspada,
        COUNT(*) FILTER (WHERE alert_status = 'Normal')::int AS habs_normal,
        COUNT(*) FILTER (WHERE severity_level = 'kritis')::int AS habs_kritis,
        COUNT(*) FILTER (WHERE severity_level = 'tinggi')::int AS habs_tinggi
      FROM bloom_events
      WHERE event_type = 'Harmful Algal Blooms'
    `)

    // 5. Jellyfish Bloom Events Statistics
    const jellyfishStats = await query(`
      SELECT 
        COUNT(*)::int AS total_jellyfish_events,
        COUNT(*) FILTER (WHERE event_end_date IS NULL OR event_end_date >= CURRENT_DATE)::int AS active_jellyfish_events,
        COUNT(*) FILTER (WHERE alert_status = 'Darurat')::int AS jellyfish_darurat,
        COUNT(*) FILTER (WHERE alert_status = 'Siaga')::int AS jellyfish_siaga,
        COUNT(*) FILTER (WHERE alert_status = 'Waspada')::int AS jellyfish_waspada,
        COUNT(*) FILTER (WHERE alert_status = 'Normal')::int AS jellyfish_normal,
        COUNT(*) FILTER (WHERE severity_level = 'kritis')::int AS jellyfish_kritis,
        COUNT(*) FILTER (WHERE severity_level = 'tinggi')::int AS jellyfish_tinggi
      FROM bloom_events
      WHERE event_type = 'Jellyfish Bloom'
    `)

    // 6. Species Master Statistics
    const speciesStats = await query(`
      SELECT 
        COUNT(*)::int AS total_species,
        COUNT(*) FILTER (WHERE is_toxic = TRUE)::int AS toxic_species,
        COUNT(*) FILTER (WHERE organism_category = 'Fitoplankton')::int AS phytoplankton_species,
        COUNT(*) FILTER (WHERE organism_category = 'Zooplankton')::int AS zooplankton_species,
        COUNT(*) FILTER (WHERE organism_category = 'Ubur-ubur')::int AS jellyfish_species
      FROM species_master
    `)

    // 7. Active / Urgent Alerts Feed (Latest active or critical events)
    const activeAlerts = await query(`
      SELECT 
        be.id,
        be.event_code,
        be.event_type,
        TO_CHAR(be.event_start_date, 'YYYY-MM-DD') AS event_start_date,
        TO_CHAR(be.event_end_date, 'YYYY-MM-DD') AS event_end_date,
        be.severity_level,
        be.alert_status,
        be.description,
        s.id AS station_id,
        s.station_code,
        s.name AS station_name,
        s.city,
        s.province
      FROM bloom_events be
      JOIN monitoring_stations s ON be.station_id = s.id
      WHERE be.event_end_date IS NULL OR be.event_end_date >= CURRENT_DATE OR be.alert_status IN ('Siaga', 'Darurat')
      ORDER BY 
        CASE 
          WHEN be.alert_status = 'Darurat' THEN 1
          WHEN be.alert_status = 'Siaga' THEN 2
          WHEN be.alert_status = 'Waspada' THEN 3
          ELSE 4
        END,
        be.event_start_date DESC
      LIMIT 5
    `)

    return NextResponse.json({
      success: true,
      data: {
        stations: stationsStats.rows[0] || {},
        samplings: samplingStats.rows[0] || {},
        data_records: dataRecordsStats.rows[0] || {},
        habs: habsStats.rows[0] || {},
        jellyfish: jellyfishStats.rows[0] || {},
        species: speciesStats.rows[0] || {},
        active_alerts: activeAlerts.rows || [],
      },
    })
  } catch (error) {
    console.error("GET /api/dashboard/stats Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data statistik ringkasan dashboard" },
      { status: 500 }
    )
  }
}
