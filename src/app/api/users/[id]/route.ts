import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { query } from "@/lib/db"

const updateUserSchema = z.object({
  full_name: z.string().min(2, "Nama lengkap minimal 2 karakter").optional(),
  email: z.string().email("Format email tidak valid").optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  role_id: z.string().min(1, "Role ID tidak valid").optional(),
  status: z.enum(["aktif", "nonaktif", "suspended"]).optional(),
})

interface UserDetailRow {
  id: string
  full_name: string
  email: string
  status: string
  avatar_url: string | null
  role_id: string
  role_name: string
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await query<UserDetailRow>(
      `SELECT u.id, u.full_name, u.email, u.status, u.avatar_url, u.last_login_at, u.created_at, u.updated_at,
              r.id AS role_id, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1
       LIMIT 1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengguna tidak ditemukan",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error("GET /api/users/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil detail pengguna",
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
    const { id } = await params
    const body = await request.json()
    const result = updateUserSchema.safeParse(body)

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

    // Check user exists
    const existingUser = await query(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [id])
    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengguna tidak ditemukan",
        },
        { status: 404 }
      )
    }

    // Check email uniqueness if email changed
    if (email) {
      const emailCheck = await query(
        `SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2 LIMIT 1`,
        [email.toLowerCase().trim(), id]
      )
      if (emailCheck.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Email sudah digunakan oleh pengguna lain",
          },
          { status: 400 }
        )
      }
    }

    // Dynamic UPDATE query building
    const updates: string[] = []
    const sqlParams: unknown[] = []

    if (full_name) {
      sqlParams.push(full_name.trim())
      updates.push(`full_name = $${sqlParams.length}`)
    }

    if (email) {
      sqlParams.push(email.toLowerCase().trim())
      updates.push(`email = $${sqlParams.length}`)
    }

    if (role_id) {
      sqlParams.push(role_id)
      updates.push(`role_id = $${sqlParams.length}`)
    }

    if (status) {
      sqlParams.push(status)
      updates.push(`status = $${sqlParams.length}`)
    }

    if (password && password.trim().length > 0) {
      const password_hash = await bcrypt.hash(password, 12)
      sqlParams.push(password_hash)
      updates.push(`password_hash = $${sqlParams.length}`)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Tidak ada data yang diperbarui",
        },
        { status: 400 }
      )
    }

    sqlParams.push(id)
    const updateSql = `
      UPDATE users 
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${sqlParams.length}
      RETURNING id, full_name, email, status, avatar_url, updated_at
    `

    const updateResult = await query<UserDetailRow>(updateSql, sqlParams)

    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil diperbarui",
      data: updateResult.rows[0],
    })
  } catch (error) {
    console.error("PUT /api/users/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memperbarui data pengguna",
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
    const { id } = await params

    const existingUser = await query(`SELECT id, full_name FROM users WHERE id = $1 LIMIT 1`, [id])
    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengguna tidak ditemukan",
        },
        { status: 404 }
      )
    }

    await query(`DELETE FROM users WHERE id = $1`, [id])

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil dihapus",
    })
  } catch (error) {
    console.error("DELETE /api/users/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menghapus pengguna. Pengguna mungkin terikat dengan data sampling/event.",
      },
      { status: 500 }
    )
  }
}
