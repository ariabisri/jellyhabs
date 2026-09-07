import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createBeachSchema = z.object({
  station_id: z.string().uuid("ID Stasiun harus berupa UUID valid"),
  name: z.string().min(2, "Nama pantai minimal 2 karakter").max(150),
  village: z.string().max(100).optional().nullable(),
  subdistrict: z.string().max(100).optional().nullable(),
  regency: z.string().max(100).default("Gunungkidul"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  sar_post_name: z.string().max(150).optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["aktif", "nonaktif"]).default("aktif"),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get("station_id")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const conditions: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (stationId && stationId !== "all") {
      // Support matching station UUID or station_code
      conditions.push(`(b.station_id::text = $${paramIndex} OR LOWER(s.station_code) = LOWER($${paramIndex}))`)
      values.push(stationId)
      paramIndex++
    }

    if (status && status !== "all") {
      conditions.push(`b.status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (search) {
      conditions.push(
        `(LOWER(b.name) LIKE $${paramIndex} OR LOWER(COALESCE(b.village, '')) LIKE $${paramIndex} OR LOWER(COALESCE(b.subdistrict, '')) LIKE $${paramIndex})`
      )
      values.push(`%${search.toLowerCase().trim()}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const sql = `
      SELECT 
        b.id,
        b.station_id,
        s.station_code,
        s.name AS station_name,
        b.name,
        b.village,
        b.subdistrict,
        b.regency,
        b.latitude,
        b.longitude,
        b.sar_post_name,
        b.description,
        b.status,
        b.created_at,
        b.updated_at,
        COUNT(sr.id)::int AS incident_count,
        COALESCE(SUM(sr.victim_count), 0)::int AS total_victims
      FROM beaches b
      JOIN monitoring_stations s ON b.station_id = s.id
      LEFT JOIN sting_records sr ON b.id = sr.beach_id
      ${whereClause}
      GROUP BY b.id, s.station_code, s.name
      ORDER BY total_victims DESC, b.name ASC
    `

    const res = await query(sql, values)

    return NextResponse.json({
      success: true,
      data: res.rows,
      count: res.rows.length,
    })
  } catch (err) {
    console.error("Error fetching beaches:", err)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data pantai",
        details: err instanceof Error ? err.message : String(err),
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
        { success: false, error: "Autentikasi diperlukan" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = createBeachSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validasi data gagal",
          details: parsed.error.format(),
        },
        { status: 400 }
      )
    }

    const d = parsed.data

    const insertSql = `
      INSERT INTO beaches (
        station_id, name, village, subdistrict, regency, latitude, longitude, sar_post_name, description, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `

    const res = await query(insertSql, [
      d.station_id,
      d.name,
      d.village || null,
      d.subdistrict || null,
      d.regency,
      d.latitude,
      d.longitude,
      d.sar_post_name || null,
      d.description || null,
      d.status,
    ])

    return NextResponse.json(
      {
        success: true,
        message: "Data pantai berhasil ditambahkan",
        data: res.rows[0],
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error("Error creating beach:", err)
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505") {
      return NextResponse.json(
        { success: false, error: "Pantai dengan nama tersebut sudah terdaftar pada stasiun ini" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menambahkan data pantai",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
