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

    const users = await query(`
      SELECT u.id, u.full_name, u.email, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.full_name ASC
    `)

    return NextResponse.json({
      success: true,
      data: {
        stations: stations.rows,
        users: users.rows,
      },
    })
  } catch (error) {
    console.error("GET /api/sampling/options Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data opsi sampling" },
      { status: 500 }
    )
  }
}
