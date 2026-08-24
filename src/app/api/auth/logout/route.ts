import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/auth"

export async function POST() {
  try {
    await clearSessionCookie()
    return NextResponse.json({
      success: true,
      message: "Berhasil keluar dari sistem",
    })
  } catch (error) {
    console.error("Logout API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menghapus sesi",
      },
      { status: 500 }
    )
  }
}
