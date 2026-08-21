import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createSpeciesSchema = z.object({
  species_code: z
    .string()
    .min(2, "Kode spesies minimal 2 karakter")
    .max(20, "Kode spesies maksimal 20 karakter")
    .trim(),
  scientific_name: z
    .string()
    .min(2, "Nama ilmiah minimal 2 karakter")
    .max(255, "Nama ilmiah maksimal 255 karakter")
    .trim(),
  common_name: z.string().max(255).optional().nullable(),
  kingdom: z.string().max(100).optional().nullable(),
  phylum: z.string().max(100).optional().nullable(),
  class_name: z.string().max(100).optional().nullable(),
  order_name: z.string().max(100).optional().nullable(),
  family: z.string().max(100).optional().nullable(),
  genus: z.string().max(100).optional().nullable(),
  organism_category: z.enum(["Fitoplankton", "Zooplankton", "Ubur-ubur"], {
    message: "Kategori organisme harus Fitoplankton, Zooplankton, atau Ubur-ubur",
  }),
  is_toxic: z.boolean().optional().default(false),
  description: z.string().optional().nullable(),
  image_url: z.string().max(512).optional().nullable(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("q") || ""
    const category = searchParams.get("category") || ""
    const isToxicParam = searchParams.get("is_toxic")

    let sql = `
      SELECT 
        sm.id,
        sm.species_code,
        sm.scientific_name,
        sm.common_name,
        sm.kingdom,
        sm.phylum,
        sm.class_name,
        sm.order_name,
        sm.family,
        sm.genus,
        sm.organism_category,
        sm.is_toxic,
        sm.description,
        sm.image_url,
        sm.created_at,
        sm.updated_at,
        (
          SELECT COUNT(*)::int
          FROM plankton_records pr
          WHERE pr.species_id = sm.id
        ) AS records_count
      FROM species_master sm
      WHERE 1=1
    `
    const params: unknown[] = []

    if (searchQuery.trim()) {
      params.push(`%${searchQuery.trim().toLowerCase()}%`)
      sql += ` AND (
        LOWER(sm.scientific_name) LIKE $${params.length}
        OR LOWER(COALESCE(sm.common_name, '')) LIKE $${params.length}
        OR LOWER(sm.species_code) LIKE $${params.length}
        OR LOWER(COALESCE(sm.family, '')) LIKE $${params.length}
        OR LOWER(COALESCE(sm.genus, '')) LIKE $${params.length}
      )`
    }

    if (category.trim() && category !== "all") {
      params.push(category.trim())
      sql += ` AND sm.organism_category = $${params.length}`
    }

    if (isToxicParam !== null && isToxicParam !== undefined && isToxicParam !== "all" && isToxicParam !== "") {
      const isToxicBool = isToxicParam === "true" || isToxicParam === "1"
      params.push(isToxicBool)
      sql += ` AND sm.is_toxic = $${params.length}`
    }

    sql += ` ORDER BY sm.organism_category ASC, sm.scientific_name ASC`

    const result = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("GET /api/species Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data master spesies" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk menambahkan data spesies" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = createSpeciesSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input data spesies tidak valid",
        },
        { status: 400 }
      )
    }

    const {
      species_code,
      scientific_name,
      common_name,
      kingdom,
      phylum,
      class_name,
      order_name,
      family,
      genus,
      organism_category,
      is_toxic,
      description,
      image_url,
    } = result.data

    // Check unique species_code
    const existingCode = await query(
      `SELECT id FROM species_master WHERE LOWER(species_code) = $1 LIMIT 1`,
      [species_code.toLowerCase()]
    )

    if (existingCode.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: `Kode spesies '${species_code}' sudah terdaftar` },
        { status: 400 }
      )
    }

    const insertSql = `
      INSERT INTO species_master (
        species_code, scientific_name, common_name, kingdom, phylum,
        class_name, order_name, family, genus, organism_category,
        is_toxic, description, image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `
    const insertRes = await query(insertSql, [
      species_code,
      scientific_name,
      common_name || null,
      kingdom || null,
      phylum || null,
      class_name || null,
      order_name || null,
      family || null,
      genus || null,
      organism_category,
      is_toxic,
      description || null,
      image_url || null,
    ])

    return NextResponse.json(
      {
        success: true,
        message: `Spesies '${scientific_name}' berhasil ditambahkan`,
        data: insertRes.rows[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/species Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan data spesies baru" },
      { status: 500 }
    )
  }
}
