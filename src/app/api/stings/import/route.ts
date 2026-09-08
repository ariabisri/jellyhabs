import { NextResponse } from "next/server"
import { pool, query } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveBeachCoordinates } from "@/lib/beach-coordinates"
import * as XLSX from "xlsx"

const MONTH_MAP: Record<string, number> = {
  januari: 1, jan: 1,
  februari: 2, feb: 2,
  maret: 3, mar: 3,
  april: 4, apr: 4,
  mei: 5, may: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  agustus: 8, agt: 8, aug: 8,
  september: 9, sep: 9,
  oktober: 10, okt: 10, oct: 10,
  november: 11, nov: 11,
  desember: 12, des: 12, dec: 12,
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk mengunggah dan mengimpor data" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File spreadsheet (.xlsx, .xls, .csv) tidak ditemukan" },
        { status: 400 }
      )
    }

    const originalFileName = file.name
    const fileSizeBytes = file.size
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(buffer, { type: "buffer" })
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: "Format berkas tidak valid atau berkas rusak" },
        { status: 400 }
      )
    }

    // Station ID from form or default to ST-03 (Pesisir Selatan Jawa)
    const userStationId = formData.get("station_id") as string | null
    let targetStationId = userStationId && userStationId !== "all" ? userStationId : null
    if (!targetStationId) {
      const stRes = await query<{ id: string }>(`SELECT id FROM monitoring_stations WHERE station_code = 'ST-03' LIMIT 1`)
      targetStationId = stRes.rows[0]?.id || null
    }

    // Bloom event
    const evRes = await query(`SELECT id FROM bloom_events WHERE event_code = 'EVT-202607-02' LIMIT 1`)
    const jellyfishEventId = evRes.rows[0]?.id || null

    const parsedRecords: {
      incident_date: string
      location_name: string
      latitude: number
      longitude: number
      station_id: string | null
      bloom_event_id: string | null
      victim_count: number
      victim_name: string | null
      victim_age: string | null
      victim_gender: string | null
      severity_level: string
      treatment_notes: string
    }[] = []

    const failedRows: { sheet: string; row: number; reason: string }[] = []

    for (const sheetName of workbook.SheetNames) {
      const yearNumber = parseInt(sheetName, 10) || new Date().getFullYear()
      const sheet = workbook.Sheets[sheetName]
      const rawData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 })

      let headerRowIdx = -1
      const colIdxMap: Record<string, number> = {}

      for (let i = 0; i < Math.min(rawData.length, 12); i++) {
        const row = rawData[i] || []
        const joined = row.map((c: any) => String(c || "")).join(" ").toLowerCase()
        if (joined.includes("lokasi") || joined.includes("pantai") || (joined.includes("bulan") && joined.includes("korban"))) {
          headerRowIdx = i
          row.forEach((cell: any, idx: number) => {
            const str = String(cell || "").toLowerCase().trim()
            if (str === "no") colIdxMap.no = idx
            else if (str.includes("bulan")) colIdxMap.month = idx
            else if (str.includes("tanggal") || str.includes("tgl")) colIdxMap.date = idx
            else if (str.includes("lokasi") || str.includes("pantai")) colIdxMap.location = idx
            else if (str.includes("jumlah") || str.includes("korban")) {
              if (!("victimCount" in colIdxMap)) colIdxMap.victimCount = idx
            }
            else if (str.includes("nama")) colIdxMap.name = idx
            else if (str.includes("umur") || str.includes("usia")) colIdxMap.age = idx
            else if (str.includes("kelamin") || str.includes("gender")) colIdxMap.gender = idx
          })
          break
        }
      }

      if (headerRowIdx === -1 || colIdxMap.location === undefined) {
        // Skip sheet if no relevant headers
        continue
      }

      for (let r = headerRowIdx + 1; r < rawData.length; r++) {
        const row = rawData[r] || []
        if (!row || row.length === 0) continue

        const locVal = colIdxMap.location !== undefined ? String(row[colIdxMap.location] || "").trim() : ""
        if (!locVal || locVal === "-" || locVal === "0") continue

        // Ignore summary note rows
        if (locVal.toLowerCase().startsWith("distribusi") || locVal.toLowerCase().startsWith("berdasarkan")) {
          break
        }

        const monthName = colIdxMap.month !== undefined ? String(row[colIdxMap.month] || "").trim() : ""
        const mNum = MONTH_MAP[monthName.toLowerCase()] || 7
        const mm = String(mNum).padStart(2, "0")

        let dateDay = 15
        if (colIdxMap.date !== undefined && row[colIdxMap.date]) {
          const dParsed = parseInt(String(row[colIdxMap.date]), 10)
          if (!isNaN(dParsed) && dParsed >= 1 && dParsed <= 31) {
            dateDay = dParsed
          }
        }
        const dd = String(dateDay).padStart(2, "0")
        const incidentDate = `${yearNumber}-${mm}-${dd}`

        let victimCount = 1
        if (colIdxMap.victimCount !== undefined && row[colIdxMap.victimCount]) {
          const vc = parseInt(String(row[colIdxMap.victimCount]), 10)
          if (!isNaN(vc) && vc > 0) victimCount = vc
        }

        const victimName = colIdxMap.name !== undefined && row[colIdxMap.name] && String(row[colIdxMap.name]).trim() !== "-"
          ? String(row[colIdxMap.name]).trim()
          : null

        const victimAge = colIdxMap.age !== undefined && row[colIdxMap.age] && String(row[colIdxMap.age]).trim() !== "-"
          ? String(row[colIdxMap.age]).trim()
          : null

        let victimGender: string | null = null
        if (colIdxMap.gender !== undefined && row[colIdxMap.gender]) {
          const gStr = String(row[colIdxMap.gender]).toLowerCase().trim()
          if (gStr.includes("laki") || gStr === "l") victimGender = "Laki-laki"
          else if (gStr.includes("perempuan") || gStr === "p") victimGender = "Perempuan"
        }

        const coords = resolveBeachCoordinates(locVal)

        let bloomId: string | null = null
        if (incidentDate.startsWith("2026-07")) {
          bloomId = jellyfishEventId
        }

        const isChild = victimAge && (parseInt(victimAge, 10) < 12 || (victimAge.includes("tahun") && parseInt(victimAge, 10) < 12))
        const severity = isChild ? "Sedang - Sesak Napas & Kram" : "Ringan - Iritasi Kulit & Nyeri Panas"

        parsedRecords.push({
          incident_date: incidentDate,
          location_name: locVal,
          latitude: coords[0],
          longitude: coords[1],
          station_id: targetStationId,
          bloom_event_id: bloomId,
          victim_count: victimCount,
          victim_name: victimName,
          victim_age: victimAge,
          victim_gender: victimGender,
          severity_level: severity,
          treatment_notes: "Penanganan pertama oleh Tim SAR Linmas Pantai (kompres cuka asam asetat).",
        })
      }
    }

    if (parsedRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Tidak ada baris data valid yang dapat diimpor dari file ini. Pastikan kolom memuat 'Bulan', 'Tanggal', 'Lokasi Pantai', dan 'Jumlah Korban'.",
        },
        { status: 400 }
      )
    }

    // Insert records in database transaction
    const client = await pool.connect()
    let insertedCount = 0

    try {
      await client.query("BEGIN")

      const insertSql = `
        INSERT INTO sting_records (
          incident_date, location_name, latitude, longitude,
          station_id, bloom_event_id, victim_count, victim_name,
          victim_age, victim_gender, severity_level, treatment_notes, reported_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `

      for (const rec of parsedRecords) {
        await client.query(insertSql, [
          rec.incident_date,
          rec.location_name,
          rec.latitude,
          rec.longitude,
          rec.station_id,
          rec.bloom_event_id,
          rec.victim_count,
          rec.victim_name,
          rec.victim_age,
          rec.victim_gender,
          rec.severity_level,
          rec.treatment_notes,
          session.id,
        ])
        insertedCount++
      }

      // Record in datasets table
      const ext = originalFileName.split(".").pop()?.toUpperCase() || "XLSX"
      const generatedFileName = `STING_IMPORT_${Date.now()}.${ext.toLowerCase()}`
      await client.query(
        `
        INSERT INTO datasets (
          file_name, original_name, file_format, file_size_bytes, storage_path, description, uploaded_by, station_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          generatedFileName,
          originalFileName,
          ext,
          fileSizeBytes,
          `/uploads/datasets/${generatedFileName}`,
          `Bulk import data korban sengatan ubur-ubur (${insertedCount} baris insiden)`,
          session.id,
          targetStationId,
        ]
      )

      await client.query("COMMIT")

      return NextResponse.json({
        success: true,
        message: `Berhasil mengimpor ${insertedCount} data korban sengatan ubur-ubur`,
        data: {
          total_processed: parsedRecords.length,
          inserted_count: insertedCount,
        },
      })
    } catch (dbErr) {
      await client.query("ROLLBACK")
      throw dbErr
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("POST /api/stings/import Error:", error)
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal saat memproses unggahan file" },
      { status: 500 }
    )
  }
}
