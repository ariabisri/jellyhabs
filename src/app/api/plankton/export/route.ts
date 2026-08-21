import { NextResponse } from "next/server"
import { query } from "@/lib/db"

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return ""
  const str = String(val)
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

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
        pr.record_code,
        se.sampling_code,
        s.station_code,
        s.name AS station_name,
        s.city,
        s.province,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date,
        TO_CHAR(se.sampling_time, 'HH24:MI') AS sampling_time,
        sm.species_code,
        sm.scientific_name,
        sm.common_name,
        sm.organism_category,
        pr.density_value,
        pr.density_unit,
        pr.toxicity_status,
        pr.morphological_notes
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

    sql += ` ORDER BY se.sampling_date DESC, sm.scientific_name ASC`

    const result = await query(sql, params)

    const headers = [
      "record_code",
      "sampling_code",
      "station_code",
      "station_name",
      "city",
      "province",
      "sampling_date",
      "sampling_time",
      "species_code",
      "scientific_name",
      "common_name",
      "organism_category",
      "density_value",
      "density_unit",
      "toxicity_status",
      "morphological_notes",
    ]

    const csvRows = [headers.join(",")]

    for (const row of result.rows) {
      const line = [
        escapeCsvField(row.record_code),
        escapeCsvField(row.sampling_code),
        escapeCsvField(row.station_code),
        escapeCsvField(row.station_name),
        escapeCsvField(row.city),
        escapeCsvField(row.province),
        escapeCsvField(row.sampling_date),
        escapeCsvField(row.sampling_time),
        escapeCsvField(row.species_code),
        escapeCsvField(row.scientific_name),
        escapeCsvField(row.common_name),
        escapeCsvField(row.organism_category),
        escapeCsvField(row.density_value),
        escapeCsvField(row.density_unit),
        escapeCsvField(row.toxicity_status),
        escapeCsvField(row.morphological_notes),
      ]
      csvRows.push(line.join(","))
    }

    const csvOutput = "\uFEFF" + csvRows.join("\r\n")
    const dateStr = new Date().toISOString().split("T")[0]

    return new NextResponse(csvOutput, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="plankton_records_${dateStr}.csv"`,
      },
    })
  } catch (error) {
    console.error("GET /api/plankton/export Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor data plankton & ubur-ubur" },
      { status: 500 }
    )
  }
}
