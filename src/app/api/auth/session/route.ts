import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.id,
        full_name: session.full_name,
        email: session.email,
        role: session.role,
        avatar_url: session.avatar_url,
        status: session.status,
      },
    })
  } catch (error) {
    console.error("Session API Error:", error)
    return NextResponse.json(
      {
        authenticated: false,
        error: "Gagal memeriksa sesi",
      },
      { status: 500 }
    )
  }
}
