import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createPlanktonSchema = z.object({
  record_code: z
    .string()
    .min(2, "Kode rekord minimal 2 karakter")
    .max(20, "Kode rekord maksimal 20 karakter")
    .trim(),
  sampling_event_id: z
    .string()
    .min(1, "Sampling event harus dipilih")
    .trim(),
  species_id: z
    .string()
    .min(1, "Spesies harus dipilih")
    .trim(),
  density_value: z.number({ message: "Nilai kepadatan harus berupa angka" }).min(0, "Nilai kepadatan tidak boleh negatif"),
  density_unit: z
    .string()
    .min(1, "Satuan kepadatan harus diisi")
    .max(30, "Satuan kepadatan maksimal 30 karakter")
    .trim(),
  toxicity_status: z
    .string()
    .min(1, "Status toksisitas harus diisi")
    .max(30, "Status toksisitas maksimal 30 karakter")
    .trim(),
  morphological_notes: z.string().optional().default(""),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("q") || ""
    const category = searchParams.get("category") || ""
    const toxicityStatus = searchParams.get("toxicity_status") || ""
    const stationId = searchParams.get("station_id") || ""
    const samplingEventId = searchParams.get("sampling_event_id") || ""
    const speciesId = searchParams.get("species_id") || ""
    const dateFrom = searchParams.get("date_from") || ""
    const dateTo = searchParams.get("date_to") || ""

    let sql = `
      SELECT 
        pr.id,
        pr.record_code,
        pr.sampling_event_id,
        se.sampling_code,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date,
        TO_CHAR(se.sampling_time, 'HH24:MI') AS sampling_time,
        se.weather_condition,
        s.id AS station_id,
        s.station_code,
        s.name AS station_name,
        s.city,
        s.province,
        s.latitude,
        s.longitude,
        pr.species_id,
        sm.species_code,
        sm.scientific_name,
        sm.common_name,
        sm.organism_category,
        sm.is_toxic,
        sm.image_url,
        pr.density_value,
        pr.density_unit,
        pr.toxicity_status,
        pr.morphological_notes,
        pr.created_at,
        pr.updated_at,
        (
          SELECT COUNT(*)::int
          FROM bloom_event_plankton bep
          WHERE bep.plankton_record_id = pr.id
        ) AS linked_bloom_events_count
      FROM plankton_records pr
      JOIN species_master sm ON pr.species_id = sm.id
      JOIN sampling_events se ON pr.sampling_event_id = se.id
      JOIN monitoring_stations s ON se.station_id = s.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (searchQuery.trim()) {
      params.push(`%${searchQuery.trim().toLowerCase()}%`)
      sql += ` AND (
        LOWER(pr.record_code) LIKE $${params.length}
        OR LOWER(sm.scientific_name) LIKE $${params.length}
        OR LOWER(COALESCE(sm.common_name, '')) LIKE $${params.length}
        OR LOWER(se.sampling_code) LIKE $${params.length}
        OR LOWER(s.name) LIKE $${params.length}
        OR LOWER(s.station_code) LIKE $${params.length}
        OR LOWER(COALESCE(pr.morphological_notes, '')) LIKE $${params.length}
      )`
    }

    if (category.trim() && category !== "all") {
      params.push(category.trim())
      sql += ` AND sm.organism_category = $${params.length}`
    }

    if (toxicityStatus.trim() && toxicityStatus !== "all") {
      params.push(`%${toxicityStatus.trim().toLowerCase()}%`)
      sql += ` AND LOWER(pr.toxicity_status) LIKE $${params.length}`
    }

    if (stationId.trim() && stationId !== "all") {
      params.push(stationId.trim())
      sql += ` AND (s.id::text = $${params.length} OR LOWER(s.station_code) = LOWER($${params.length}))`
    }

    if (samplingEventId.trim() && samplingEventId !== "all") {
      params.push(samplingEventId.trim())
      sql += ` AND (se.id::text = $${params.length} OR LOWER(se.sampling_code) = LOWER($${params.length}))`
    }

    if (speciesId.trim() && speciesId !== "all") {
      params.push(speciesId.trim())
      sql += ` AND (sm.id::text = $${params.length} OR LOWER(sm.species_code) = LOWER($${params.length}))`
    }

    if (dateFrom.trim()) {
      params.push(dateFrom.trim())
      sql += ` AND se.sampling_date >= $${params.length}::date`
    }

    if (dateTo.trim()) {
      params.push(dateTo.trim())
      sql += ` AND se.sampling_date <= $${params.length}::date`
    }

    sql += ` ORDER BY se.sampling_date DESC, pr.created_at DESC`

    const result = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("GET /api/plankton Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data pemantauan plankton & ubur-ubur" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk menambahkan data plankton & ubur-ubur" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = createPlanktonSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input data tidak valid",
        },
        { status: 400 }
      )
    }

    const {
      record_code,
      sampling_event_id,
      species_id,
      density_value,
      density_unit,
      toxicity_status,
      morphological_notes,
    } = result.data

    // Check unique record_code
    const existingCode = await query(
      `SELECT id FROM plankton_records WHERE LOWER(record_code) = $1 LIMIT 1`,
      [record_code.toLowerCase()]
    )

    if (existingCode.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: `Kode rekord '${record_code}' sudah terdaftar` },
        { status: 400 }
      )
    }

    // Verify sampling event
    const samplingCheck = await query(
      `SELECT id FROM sampling_events WHERE id::text = $1 OR LOWER(sampling_code) = LOWER($1) LIMIT 1`,
      [sampling_event_id]
    )

    if (samplingCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Sampling event yang dipilih tidak ditemukan" },
        { status: 400 }
      )
    }

    // Verify species
    const speciesCheck = await query(
      `SELECT id FROM species_master WHERE id::text = $1 OR LOWER(species_code) = LOWER($1) OR LOWER(scientific_name) = LOWER($1) LIMIT 1`,
      [species_id]
    )

    if (speciesCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Spesies yang dipilih tidak ditemukan di master data" },
        { status: 400 }
      )
    }

    const resolvedSamplingId = samplingCheck.rows[0].id
    const resolvedSpeciesId = speciesCheck.rows[0].id

    const insertSql = `
      INSERT INTO plankton_records (
        record_code,
        sampling_event_id,
        species_id,
        density_value,
        density_unit,
        toxicity_status,
        morphological_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    const insertRes = await query(insertSql, [
      record_code,
      resolvedSamplingId,
      resolvedSpeciesId,
      density_value,
      density_unit,
      toxicity_status,
      morphological_notes?.trim() || null,
    ])

    return NextResponse.json(
      {
        success: true,
        message: "Data pemantauan plankton / ubur-ubur berhasil ditambahkan",
        data: insertRes.rows[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/plankton Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan data pemantauan plankton & ubur-ubur" },
      { status: 500 }
    )
  }
}
