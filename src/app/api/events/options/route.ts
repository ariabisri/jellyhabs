import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const stations = await query(`
      SELECT id, station_code, name, city, province 
      FROM monitoring_stations 
      WHERE status = 'aktif'
      ORDER BY name ASC
    `)

    const waterQuality = await query(`
      SELECT 
        wq.id, 
        wq.record_code, 
        wq.temperature_c, 
        wq.salinity_psu, 
        wq.dissolved_oxygen_mgl, 
        wq.ph, 
        wq.chlorophyll_a_ugl,
        s.name AS station_name,
        se.sampling_code,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date
      FROM water_quality_records wq
      JOIN sampling_events se ON wq.sampling_event_id = se.id
      JOIN monitoring_stations s ON se.station_id = s.id
      ORDER BY se.sampling_date DESC, wq.created_at DESC
    `)

    const plankton = await query(`
      SELECT 
        pr.id, 
        pr.record_code, 
        sm.scientific_name, 
        sm.organism_category, 
        pr.density_value, 
        pr.density_unit, 
        pr.toxicity_status,
        s.name AS station_name,
        se.sampling_code,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date
      FROM plankton_records pr
      JOIN species_master sm ON pr.species_id = sm.id
      JOIN sampling_events se ON pr.sampling_event_id = se.id
      JOIN monitoring_stations s ON se.station_id = s.id
      ORDER BY se.sampling_date DESC, pr.created_at DESC
    `)

    return NextResponse.json({
      success: true,
      data: {
        stations: stations.rows,
        water_quality: waterQuality.rows,
        plankton: plankton.rows,
      },
    })
  } catch (error) {
    console.error("GET /api/events/options Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data opsi form",
      },
      { status: 500 }
    )
  }
}
