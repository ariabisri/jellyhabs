import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import path from "path"
import fs from "fs/promises"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk mengunggah berkas foto" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "sampling"

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Berkas foto tidak ditemukan dalam permintaan" },
        { status: 400 }
      )
    }

    // Validate mime type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format berkas tidak didukung. Harap unggah foto JPG, PNG, atau WEBP" },
        { status: 400 }
      )
    }

    // 5MB max
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Ukuran berkas foto melebihi batas maksimal 5 MB" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const sanitizedExt = path.extname(file.name) || ".jpg"
    const safeName = file.name
      .replace(sanitizedExt, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30)

    const fileName = `${Date.now()}_${safeName}${sanitizedExt}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder)

    await fs.mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, fileName)
    await fs.writeFile(filePath, buffer)

    const publicUrl = `/uploads/${folder}/${fileName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("POST /api/upload Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengunggah berkas foto ke server" },
      { status: 500 }
    )
  }
}
