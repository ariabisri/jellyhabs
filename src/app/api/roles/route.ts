import { NextResponse } from "next/server"
import { query } from "@/lib/db"

interface RoleRow {
  id: string
  name: string
  description: string | null
  permissions: unknown
  created_at: string
}

export async function GET() {
  try {
    const result = await query<RoleRow>(
      `SELECT id, name, description, permissions, created_at
       FROM roles
       ORDER BY name ASC`
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("GET /api/roles Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data role",
      },
      { status: 500 }
    )
  }
}
