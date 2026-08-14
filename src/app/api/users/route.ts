import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { query } from "@/lib/db"

const createUserSchema = z.object({
  full_name: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role_id: z.string().uuid("Role ID tidak valid"),
  status: z.enum(["aktif", "nonaktif", "suspended"]).default("aktif"),
})

interface UserListRow {
  id: string
  full_name: string
  email: string
  status: string
  avatar_url: string | null
  role_id: string
  role_name: string
  last_login_at: string | null
  created_at: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("q") || ""
    const roleId = searchParams.get("role_id") || ""
    const status = searchParams.get("status") || ""

    let sql = `
      SELECT u.id, u.full_name, u.email, u.status, u.avatar_url, u.last_login_at, u.created_at,
             r.id AS role_id, r.name AS role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (searchQuery.trim()) {
      params.push(`%${searchQuery.trim().toLowerCase()}%`)
      sql += ` AND (LOWER(u.full_name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`
    }

    if (roleId.trim()) {
      params.push(roleId.trim())
      sql += ` AND u.role_id = $${params.length}`
    }

    if (status.trim()) {
      params.push(status.trim())
      sql += ` AND u.status = $${params.length}`
    }

    sql += ` ORDER BY u.created_at DESC`

    const result = await query<UserListRow>(sql, params)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("GET /api/users Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data pengguna",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = createUserSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input tidak valid",
        },
        { status: 400 }
      )
    }

    const { full_name, email, password, role_id, status } = result.data

    // Check email uniqueness
    const existingUser = await query(`SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`, [
      email.toLowerCase().trim(),
    ])

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Email sudah digunakan oleh pengguna lain",
        },
        { status: 400 }
      )
    }

    // Verify role exists
    const roleCheck = await query(`SELECT id FROM roles WHERE id = $1 LIMIT 1`, [role_id])
    if (roleCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Role yang dipilih tidak valid",
        },
        { status: 400 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Insert user
    const insertResult = await query<UserListRow>(
      `INSERT INTO users (full_name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, status, avatar_url, created_at`,
      [full_name.trim(), email.toLowerCase().trim(), password_hash, role_id, status]
    )

    const newUser = insertResult.rows[0]

    return NextResponse.json(
      {
        success: true,
        message: "Pengguna berhasil ditambahkan",
        data: newUser,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/users Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menambahkan pengguna baru",
      },
      { status: 500 }
    )
  }
}
