import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { query } from "@/lib/db"

const resetPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
  currentPassword: z.string().optional(),
})

interface UserDBRow {
  id: string
  password_hash: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = resetPasswordSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input tidak valid",
        },
        { status: 400 }
      )
    }

    const { email, newPassword, currentPassword } = result.data

    // Check if user exists
    const userResult = await query<UserDBRow>(
      `SELECT id, password_hash FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengguna dengan email tersebut tidak ditemukan",
        },
        { status: 404 }
      )
    }

    const user = userResult.rows[0]

    // If currentPassword is provided, verify it first
    if (currentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            error: "Password saat ini tidak sesuai",
          },
          { status: 401 }
        )
      }
    }

    // Hash the new password
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update password_hash in database
    await query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newPasswordHash, user.id]
    )

    return NextResponse.json({
      success: true,
      message: "Password berhasil diperbarui. Silakan login kembali dengan password baru Anda.",
    })
  } catch (error) {
    console.error("Reset Password API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat mengatur ulang password",
      },
      { status: 500 }
    )
  }
}
