import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updateBeachSchema = z.object({
  station_id: z.string().uuid("ID Stasiun harus berupa UUID valid").optional(),
  name: z.string().min(2, "Nama pantai minimal 2 karakter").max(150).optional(),
  village: z.string().max(100).optional().nullable(),
  subdistrict: z.string().max(100).optional().nullable(),
  regency: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  sar_post_name: z.string().max(150).optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["aktif", "nonaktif"]).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      WHERE b.id::text = $1
      GROUP BY b.id, s.station_code, s.name
    `
    const res = await query(sql, [id])
    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Pantai tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: res.rows[0] })
  } catch (err) {
    console.error("Error fetching beach:", err)
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const parsed = updateBeachSchema.safeParse(body)

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
    const fields: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (d.station_id !== undefined) {
      fields.push(`station_id = $${paramIndex++}`)
      values.push(d.station_id)
    }
    if (d.name !== undefined) {
      fields.push(`name = $${paramIndex++}`)
      values.push(d.name)
    }
    if (d.village !== undefined) {
      fields.push(`village = $${paramIndex++}`)
      values.push(d.village)
    }
    if (d.subdistrict !== undefined) {
      fields.push(`subdistrict = $${paramIndex++}`)
      values.push(d.subdistrict)
    }
    if (d.regency !== undefined) {
      fields.push(`regency = $${paramIndex++}`)
      values.push(d.regency)
    }
    if (d.latitude !== undefined) {
      fields.push(`latitude = $${paramIndex++}`)
      values.push(d.latitude)
    }
    if (d.longitude !== undefined) {
      fields.push(`longitude = $${paramIndex++}`)
      values.push(d.longitude)
    }
    if (d.sar_post_name !== undefined) {
      fields.push(`sar_post_name = $${paramIndex++}`)
      values.push(d.sar_post_name)
    }
    if (d.description !== undefined) {
      fields.push(`description = $${paramIndex++}`)
      values.push(d.description)
    }
    if (d.status !== undefined) {
      fields.push(`status = $${paramIndex++}`)
      values.push(d.status)
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada field data yang diubah" },
        { status: 400 }
      )
    }

    values.push(id)
    const sql = `
      UPDATE beaches
      SET ${fields.join(", ")}
      WHERE id::text = $${paramIndex}
      RETURNING *
    `

    const res = await query(sql, values)
    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Pantai tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Data pantai berhasil diperbarui",
      data: res.rows[0],
    })
  } catch (err) {
    console.error("Error updating beach:", err)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memperbarui data pantai",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan" },
        { status: 401 }
      )
    }

    const { id } = await params
    const res = await query(`DELETE FROM beaches WHERE id::text = $1 RETURNING id`, [id])

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Pantai tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Data pantai berhasil dihapus",
    })
  } catch (err) {
    console.error("Error deleting beach:", err)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menghapus data pantai",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
