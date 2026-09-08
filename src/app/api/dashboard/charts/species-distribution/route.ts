import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || "all"

    let sql = `
      SELECT 
        sm.id AS species_id,
        sm.species_code,
        sm.scientific_name,
        sm.common_name,
        sm.organism_category,
        sm.is_toxic,
        COUNT(pr.id)::int AS records_count,
        COALESCE(ROUND(AVG(pr.density_value)::numeric, 2), 0) AS avg_density,
        COALESCE(MAX(pr.density_value), 0) AS max_density,
        (
          SELECT pr2.density_unit 
          FROM plankton_records pr2 
          WHERE pr2.species_id = sm.id 
          LIMIT 1
        ) AS density_unit
      FROM species_master sm
      LEFT JOIN plankton_records pr ON sm.id = pr.species_id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (category.trim() && category !== "all") {
      params.push(category.trim())
      sql += ` AND sm.organism_category = $${params.length}`
    }

    sql += `
      GROUP BY sm.id, sm.species_code, sm.scientific_name, sm.common_name, sm.organism_category, sm.is_toxic
      ORDER BY records_count DESC, max_density DESC, sm.scientific_name ASC
      LIMIT 10
    `

    const result = await query(sql, params)

    const categoriesSummary = await query(`
      SELECT 
        sm.organism_category AS label,
        COUNT(pr.id)::int AS total_records,
        COUNT(DISTINCT sm.id)::int AS unique_species_count
      FROM species_master sm
      LEFT JOIN plankton_records pr ON sm.id = pr.species_id
      GROUP BY sm.organism_category
      ORDER BY total_records DESC
    `)

    return NextResponse.json({
      success: true,
      data: {
        top_species: result.rows,
        by_category: categoriesSummary.rows,
      },
    })
  } catch (error) {
    console.error("GET /api/dashboard/charts/species-distribution Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data distribusi spesies" },
      { status: 500 }
    )
  }
}
