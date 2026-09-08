import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const month = searchParams.get("month")
    const location = searchParams.get("location")

    const conditions: string[] = []
    const params: unknown[] = []

    if (year && year !== "all") {
      params.push(parseInt(year, 10))
      conditions.push(`EXTRACT(YEAR FROM sr.incident_date) = $${params.length}`)
    }

    if (month && month !== "all") {
      params.push(parseInt(month, 10))
      conditions.push(`EXTRACT(MONTH FROM sr.incident_date) = $${params.length}`)
    }

    if (location && location !== "all") {
      params.push(`%${location.trim().toLowerCase()}%`)
      conditions.push(`LOWER(sr.location_name) LIKE $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const sql = `
      SELECT 
        sr.incident_date,
        sr.incident_time,
        sr.location_name,
        sr.latitude,
        sr.longitude,
        sr.victim_count,
        sr.victim_name,
        sr.victim_age,
        sr.victim_gender,
        sr.severity_level,
        sr.treatment_notes,
        ms.name as station_name,
        be.event_code as bloom_event_code
      FROM sting_records sr
      LEFT JOIN monitoring_stations ms ON sr.station_id = ms.id
      LEFT JOIN bloom_events be ON sr.bloom_event_id = be.id
      ${whereClause}
      ORDER BY sr.incident_date DESC, sr.location_name ASC
    `

    const res = await query(sql, params)

    const headers = [
      "Tanggal Kejadian",
      "Jam",
      "Lokasi Pantai",
      "Latitude",
      "Longitude",
      "Jumlah Korban",
      "Nama Korban",
      "Usia",
      "Jenis Kelamin",
      "Tingkat Keparahan",
      "Penanganan / Pertolongan",
      "Stasiun Pemantau",
      "Kode Bloom Event",
    ]

    const csvRows = [headers.join(",")]

    for (const row of res.rows) {
      const escape = (v: any) => {
        if (v === null || v === undefined) return '""'
        const s = String(v).replace(/"/g, '""')
        return `"${s}"`
      }

      csvRows.push(
        [
          escape(row.incident_date ? new Date(row.incident_date).toISOString().split("T")[0] : ""),
          escape(row.incident_time || ""),
          escape(row.location_name),
          escape(row.latitude),
          escape(row.longitude),
          escape(row.victim_count),
          escape(row.victim_name || "-"),
          escape(row.victim_age || "-"),
          escape(row.victim_gender || "-"),
          escape(row.severity_level || "-"),
          escape(row.treatment_notes || "-"),
          escape(row.station_name || "-"),
          escape(row.bloom_event_code || "-"),
        ].join(",")
      )
    }

    const csvData = csvRows.join("\r\n")

    return new Response(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="data_korban_sengatan_${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    console.error("GET /api/stings/export Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor data korban sengatan" },
      { status: 500 }
    )
  }
}
