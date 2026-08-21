import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updateSpeciesSchema = z.object({
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const sql = `
      SELECT 
        sm.*,
        (
          SELECT COUNT(*)::int
          FROM plankton_records pr
          WHERE pr.species_id = sm.id
        ) AS records_count
      FROM species_master sm
      WHERE sm.id::text = $1 OR LOWER(sm.species_code) = LOWER($1)
      LIMIT 1
    `
    const result = await query(sql, [decodedId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data spesies tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error("GET /api/species/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil detail data spesies" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk mengubah data spesies" },
        { status: 401 }
      )
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const body = await request.json()
    const result = updateSpeciesSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input data spesies tidak valid",
        },
        { status: 400 }
      )
    }

    const findRecord = await query(
      `SELECT id FROM species_master WHERE id::text = $1 OR LOWER(species_code) = LOWER($1) LIMIT 1`,
      [decodedId]
    )

    if (findRecord.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data spesies tidak ditemukan" },
        { status: 404 }
      )
    }

    const targetId = findRecord.rows[0].id
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

    // Check code collision
    const codeConflict = await query(
      `SELECT id FROM species_master WHERE LOWER(species_code) = $1 AND id != $2 LIMIT 1`,
      [species_code.toLowerCase(), targetId]
    )

    if (codeConflict.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: `Kode spesies '${species_code}' sudah digunakan oleh spesies lain` },
        { status: 400 }
      )
    }

    const updateSql = `
      UPDATE species_master
      SET 
        species_code = $1,
        scientific_name = $2,
        common_name = $3,
        kingdom = $4,
        phylum = $5,
        class_name = $6,
        order_name = $7,
        family = $8,
        genus = $9,
        organism_category = $10,
        is_toxic = $11,
        description = $12,
        image_url = $13
      WHERE id = $14
      RETURNING *
    `
    const updateRes = await query(updateSql, [
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
      targetId,
    ])

    return NextResponse.json({
      success: true,
      message: `Data spesies '${scientific_name}' berhasil diperbarui`,
      data: updateRes.rows[0],
    })
  } catch (error) {
    console.error("PUT /api/species/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui data spesies" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk menghapus data spesies" },
        { status: 401 }
      )
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const findRecord = await query(
      `SELECT id, scientific_name FROM species_master WHERE id::text = $1 OR LOWER(species_code) = LOWER($1) LIMIT 1`,
      [decodedId]
    )

    if (findRecord.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data spesies tidak ditemukan" },
        { status: 404 }
      )
    }

    const targetId = findRecord.rows[0].id
    const speciesName = findRecord.rows[0].scientific_name

    // Check if referenced by plankton_records
    const recordCheck = await query(
      `SELECT COUNT(*)::int as count FROM plankton_records WHERE species_id = $1`,
      [targetId]
    )

    if (recordCheck.rows[0].count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Spesies '${speciesName}' tidak dapat dihapus karena masih memiliki ${recordCheck.rows[0].count} rekaman data pemantauan plankton`,
        },
        { status: 400 }
      )
    }

    await query(`DELETE FROM species_master WHERE id = $1`, [targetId])

    return NextResponse.json({
      success: true,
      message: `Spesies '${speciesName}' berhasil dihapus`,
    })
  } catch (error) {
    console.error("DELETE /api/species/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal menghapus data spesies" },
      { status: 500 }
    )
  }
}
