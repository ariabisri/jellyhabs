import { NextResponse } from "next/server"

/**
 * Self-service password reset has been disabled for security purposes.
 * Password resets must be requested via the System Administrator.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Layanan reset password mandiri telah dinonaktifkan demi keamanan akun dan data riset. Silakan hubungi Administrator sistem untuk mengatur ulang kata sandi Anda.",
    },
    { status: 403 }
  )
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Metode tidak diizinkan. Silakan hubungi Administrator untuk pemulihan akun.",
    },
    { status: 405 }
  )
}
