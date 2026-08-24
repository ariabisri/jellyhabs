import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createStationSchema = z.object({
  station_code: z
    .string()
    .min(2, "Kode stasiun minimal 2 karakter")
    .max(20, "Kode stasiun maksimal 20 karakter")
    .trim(),
  name: z
    .string()
    .min(2, "Nama stasiun minimal 2 karakter")
    .max(255, "Nama stasiun maksimal 255 karakter")
    .trim(),
  province: z
    .string()
    .min(2, "Provinsi minimal 2 karakter")
    .max(100, "Provinsi maksimal 100 karakter")
    .trim(),
  city: z
    .string()
    .min(2, "Kabupaten/Kota minimal 2 karakter")
    .max(100, "Kabupaten/Kota maksimal 100 karakter")
    .trim(),
  latitude: z
    .number({ message: "Latitude harus berupa angka numerik" })
    .min(-90, "Latitude minimal -90")
    .max(90, "Latitude maksimal 90"),
  longitude: z
    .number({ message: "Longitude harus berupa angka numerik" })
    .min(-180, "Longitude minimal -180")
    .max(180, "Longitude maksimal 180"),
  description: z.string().optional().default(""),
  status: z.enum(["aktif", "nonaktif"]).default("aktif"),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("q") || ""
    const status = searchParams.get("status") || ""
    const province = searchParams.get("province") || ""
    const city = searchParams.get("city") || ""

    let sql = `
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
          SELECT COUNT(*)::int 
          FROM sampling_events se 
          WHERE se.station_id = s.id
        ) AS sampling_count,
        (
          SELECT COUNT(*)::int 
          FROM water_quality_records wq 
          JOIN sampling_events se ON wq.sampling_event_id = se.id 
          WHERE se.station_id = s.id
        ) AS water_quality_count,
        (
          SELECT COUNT(*)::int 
          FROM plankton_records pr 
          JOIN sampling_events se ON pr.sampling_event_id = se.id 
          WHERE se.station_id = s.id
        ) AS plankton_count,
        (
          SELECT COUNT(*)::int 
          FROM bloom_events be 
          WHERE be.station_id = s.id
        ) AS bloom_events_count
      FROM monitoring_stations s
      WHERE 1=1
    `
    const params: unknown[] = []

    if (searchQuery.trim()) {
      params.push(`%${searchQuery.trim().toLowerCase()}%`)
      sql += ` AND (
        LOWER(s.station_code) LIKE $${params.length} 
        OR LOWER(s.name) LIKE $${params.length} 
        OR LOWER(s.province) LIKE $${params.length} 
        OR LOWER(s.city) LIKE $${params.length}
        OR LOWER(COALESCE(s.description, '')) LIKE $${params.length}
      )`
    }

    if (status.trim()) {
      params.push(status.trim())
      sql += ` AND s.status = $${params.length}`
    }

    if (province.trim()) {
      params.push(`%${province.trim().toLowerCase()}%`)
      sql += ` AND LOWER(s.province) LIKE $${params.length}`
    }

    if (city.trim()) {
      params.push(`%${city.trim().toLowerCase()}%`)
      sql += ` AND LOWER(s.city) LIKE $${params.length}`
    }

    sql += ` ORDER BY s.station_code ASC, s.name ASC`

    const result = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("GET /api/stations Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data stasiun monitoring",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Autentikasi diperlukan untuk menambahkan stasiun monitoring",
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = createStationSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input tidak valid",
        },
        { status: 400 }
      )
    }

    const {
      station_code,
      name,
      province,
      city,
      latitude,
      longitude,
      description,
      status,
    } = result.data

    // Check unique station_code (case-insensitive)
    const existingCode = await query(
      `SELECT id FROM monitoring_stations WHERE LOWER(station_code) = $1 LIMIT 1`,
      [station_code.toLowerCase()]
    )

    if (existingCode.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Kode stasiun '${station_code}' sudah digunakan`,
        },
        { status: 400 }
      )
    }

    const insertSql = `
      INSERT INTO monitoring_stations (
        station_code, name, province, city, latitude, longitude, description, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, station_code, name, province, city, latitude, longitude, description, status, created_at, updated_at
    `
    const insertRes = await query(insertSql, [
      station_code,
      name,
      province,
      city,
      latitude,
      longitude,
      description.trim() || null,
      status,
    ])

    return NextResponse.json(
      {
        success: true,
        message: "Stasiun monitoring berhasil ditambahkan",
        data: insertRes.rows[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/stations Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menambahkan stasiun monitoring baru",
      },
      { status: 500 }
    )
  }
}
