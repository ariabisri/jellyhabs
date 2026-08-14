import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { query } from "@/lib/db"
import { createJWT, setSessionCookie } from "@/lib/auth"

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong"),
})

interface UserDBRow {
  id: string
  full_name: string
  email: string
  password_hash: string
  status: string
  avatar_url: string | null
  role_name: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input tidak valid",
        },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // Fetch user with role name from PostgreSQL
    const userResult = await query<UserDBRow>(
      `SELECT u.id, u.full_name, u.email, u.password_hash, u.status, u.avatar_url, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1
       LIMIT 1`,
      [email.toLowerCase().trim()]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah",
        },
        { status: 401 }
      )
    }

    const user = userResult.rows[0]

    // Verify account status
    if (user.status !== "aktif") {
      return NextResponse.json(
        {
          success: false,
          error: "Akun Anda saat ini tidak aktif atau ditangguhkan. Silakan hubungi Administrator.",
        },
        { status: 403 }
      )
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah",
        },
        { status: 401 }
      )
    }

    // Update last_login_at timestamp in database
    await query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [user.id])

    // Create session JWT payload
    const sessionPayload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role_name,
      avatar_url: user.avatar_url,
      status: user.status,
    }

    const token = await createJWT(sessionPayload)
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role_name,
        avatar_url: user.avatar_url,
      },
    })
  } catch (error) {
    console.error("Login API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server",
      },
      { status: 500 }
    )
  }
}
