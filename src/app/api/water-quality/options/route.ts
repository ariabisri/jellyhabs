import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const stations = await query(`
      SELECT id, station_code, name, city, province 
      FROM monitoring_stations 
      WHERE status = 'aktif'
      ORDER BY station_code ASC, name ASC
    `)

    const samplingEvents = await query(`
      SELECT 
        se.id, 
        se.sampling_code, 
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date,
        TO_CHAR(se.sampling_time, 'HH24:MI') AS sampling_time,
        se.weather_condition,
        s.id AS station_id,
        s.station_code,
        s.name AS station_name,
        s.city,
        s.province
      FROM sampling_events se
      JOIN monitoring_stations s ON se.station_id = s.id
      ORDER BY se.sampling_date DESC, se.created_at DESC
    `)

    return NextResponse.json({
      success: true,
      data: {
        stations: stations.rows,
        sampling_events: samplingEvents.rows,
      },
    })
  } catch (error) {
    console.error("GET /api/water-quality/options Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data opsi form kualitas air",
      },
      { status: 500 }
    )
  }
}
