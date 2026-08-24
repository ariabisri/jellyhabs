import { NextResponse } from "next/server"
import { pool, query } from "@/lib/db"
import { getSession } from "@/lib/auth"

interface CsvRowParsed {
  record_code: string
  sampling_code: string
  species_identifier: string
  density_value: number
  density_unit: string
  toxicity_status: string
  morphological_notes?: string | null
  row_index: number
}

function parseCsvLine(text: string, delimiter: string = ","): string[] {
  const result: string[] = []
  let cur = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"' || char === "'") {
      if (inQuotes && nextChar === char) {
        cur += char
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(cur.trim())
      cur = ""
    } else {
      cur += char
    }
  }
  result.push(cur.trim())
  return result
}

function parseNumeric(val: string | undefined): number | null {
  if (!val) return null
  const cleaned = val.replace(/,/g, "").replace(/\s/g, "").trim()
  if (cleaned === "" || cleaned === "-" || cleaned.toLowerCase() === "null" || cleaned.toLowerCase() === "nan") {
    return null
  }
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "")
}

function mapHeaders(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {}

  headers.forEach((h, idx) => {
    const norm = normalizeHeader(h)

    if (["record_code", "kode_rekord", "record_id", "id_data", "id", "kode_plk", "kode_jel", "kode"].includes(norm)) {
      if (!("record_code" in map)) map.record_code = idx
    } else if (["sampling_code", "kode_sampling", "sampling_id", "id_sampling", "sampling", "kode_sampel"].includes(norm)) {
      if (!("sampling_code" in map)) map.sampling_code = idx
    } else if (["species_code", "scientific_name", "nama_ilmiah", "spesies", "species", "nama_spesies", "kode_spesies"].includes(norm)) {
      if (!("species_identifier" in map)) map.species_identifier = idx
    } else if (["density_value", "density", "kepadatan", "kelimpahan", "densitas", "jumlah", "nilai_kepadatan"].includes(norm)) {
      if (!("density_value" in map)) map.density_value = idx
    } else if (["density_unit", "unit", "satuan", "satuan_kepadatan", "unit_kepadatan"].includes(norm)) {
      if (!("density_unit" in map)) map.density_unit = idx
    } else if (["toxicity_status", "toxicity", "toksisitas", "status_toksisitas", "status_toksik", "toksik"].includes(norm)) {
      if (!("toxicity_status" in map)) map.toxicity_status = idx
    } else if (["morphological_notes", "notes", "catatan", "keterangan", "deskripsi", "morfologi", "note"].includes(norm)) {
      if (!("morphological_notes" in map)) map.morphological_notes = idx
    }
  })

  return map
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk mengunggah dataset plankton & ubur-ubur" },
        { status: 401 }
      )
    }

    let csvContent = ""
    let originalFileName = "plankton_upload.csv"
    let fileSizeBytes = 0

    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null

      if (!file) {
        return NextResponse.json(
          { success: false, error: "File CSV tidak ditemukan dalam permintaan" },
          { status: 400 }
        )
      }

      originalFileName = file.name
      fileSizeBytes = file.size
      csvContent = await file.text()
    } else {
      const body = await request.json()
      csvContent = body.csvText || ""
      if (body.fileName) originalFileName = body.fileName
      fileSizeBytes = Buffer.byteLength(csvContent, "utf8")
    }

    if (!csvContent.trim()) {
      return NextResponse.json(
        { success: false, error: "Isi berkas CSV kosong" },
        { status: 400 }
      )
    }

    const lines = csvContent
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter((l) => l.trim().length > 0)

    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: "Berkas CSV harus memiliki baris header dan minimal satu baris data" },
        { status: 400 }
      )
    }

    const firstLine = lines[0]
    const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ","
    const headers = parseCsvLine(firstLine, delimiter)
    const headerMap = mapHeaders(headers)

    if (!("species_identifier" in headerMap) || !("sampling_code" in headerMap)) {
      return NextResponse.json(
        {
          success: false,
          error: "Header CSV harus memuat kolom 'sampling_code' (kode sampling) dan 'scientific_name' / 'species_code' (spesies)",
        },
        { status: 400 }
      )
    }

    // Fetch existing sampling events & species master
    const samplingRes = await query(`SELECT id, sampling_code, station_id FROM sampling_events`)
    const samplingMap = new Map<string, { id: string; station_id: string }>()
    samplingRes.rows.forEach((r) => {
      samplingMap.set(r.sampling_code.toLowerCase().trim(), { id: r.id, station_id: r.station_id })
    })

    const speciesRes = await query(`SELECT id, species_code, scientific_name, organism_category, is_toxic FROM species_master`)
    const speciesMap = new Map<string, { id: string; scientific_name: string; is_toxic: boolean }>()
    speciesRes.rows.forEach((r) => {
      speciesMap.set(r.species_code.toLowerCase().trim(), { id: r.id, scientific_name: r.scientific_name, is_toxic: r.is_toxic })
      speciesMap.set(r.scientific_name.toLowerCase().trim(), { id: r.id, scientific_name: r.scientific_name, is_toxic: r.is_toxic })
    })

    const parsedRows: CsvRowParsed[] = []
    const failedRows: { row: number; reason: string; raw: string }[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cols = parseCsvLine(line, delimiter)
      const recordCode = ("record_code" in headerMap ? cols[headerMap.record_code] : "") || `PLK-IMP-${Date.now()}-${i}`
      const samplingCode = "sampling_code" in headerMap ? cols[headerMap.sampling_code] : ""
      const speciesIdent = "species_identifier" in headerMap ? cols[headerMap.species_identifier] : ""

      if (!samplingCode) {
        failedRows.push({ row: i + 1, reason: "Kode sampling ('sampling_code') kosong", raw: line })
        continue
      }

      if (!samplingMap.has(samplingCode.toLowerCase().trim())) {
        failedRows.push({ row: i + 1, reason: `Kode sampling '${samplingCode}' tidak ditemukan di database`, raw: line })
        continue
      }

      if (!speciesIdent) {
        failedRows.push({ row: i + 1, reason: "Identifikasi spesies kosong", raw: line })
        continue
      }

      if (!speciesMap.has(speciesIdent.toLowerCase().trim())) {
        failedRows.push({ row: i + 1, reason: `Spesies '${speciesIdent}' tidak ditemukan di master data`, raw: line })
        continue
      }

      const densityVal = "density_value" in headerMap ? parseNumeric(cols[headerMap.density_value]) : null
      if (densityVal === null || densityVal < 0) {
        failedRows.push({ row: i + 1, reason: "Nilai kepadatan ('density_value') tidak valid", raw: line })
        continue
      }

      const defaultUnit = "sel/L"
      const densityUnit = ("density_unit" in headerMap ? cols[headerMap.density_unit] : "") || defaultUnit
      const toxicityStatus = ("toxicity_status" in headerMap ? cols[headerMap.toxicity_status] : "") || (speciesMap.get(speciesIdent.toLowerCase().trim())?.is_toxic ? "Beracun" : "Tidak Beracun")
      const morphNotes = "morphological_notes" in headerMap ? cols[headerMap.morphological_notes] : null

      parsedRows.push({
        record_code: recordCode.trim(),
        sampling_code: samplingCode.trim(),
        species_identifier: speciesIdent.trim(),
        density_value: densityVal,
        density_unit: densityUnit.trim(),
        toxicity_status: toxicityStatus.trim(),
        morphological_notes: morphNotes?.trim() || null,
        row_index: i + 1,
      })
    }

    if (parsedRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Tidak ada baris data valid yang dapat diimpor",
          failed_rows: failedRows,
        },
        { status: 400 }
      )
    }

    // Execute bulk insert/upsert in transaction
    const client = await pool.connect()
    let insertedCount = 0
    let updatedCount = 0
    let datasetId: string | null = null

    try {
      await client.query("BEGIN")

      for (const r of parsedRows) {
        const samplingInfo = samplingMap.get(r.sampling_code.toLowerCase().trim())!
        const speciesInfo = speciesMap.get(r.species_identifier.toLowerCase().trim())!

        const upsertSql = `
          INSERT INTO plankton_records (
            record_code, sampling_event_id, species_id, density_value,
            density_unit, toxicity_status, morphological_notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (record_code) DO UPDATE
          SET 
            sampling_event_id = EXCLUDED.sampling_event_id,
            species_id = EXCLUDED.species_id,
            density_value = EXCLUDED.density_value,
            density_unit = EXCLUDED.density_unit,
            toxicity_status = EXCLUDED.toxicity_status,
            morphological_notes = COALESCE(EXCLUDED.morphological_notes, plankton_records.morphological_notes),
            updated_at = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS is_inserted
        `
        const res = await client.query(upsertSql, [
          r.record_code,
          samplingInfo.id,
          speciesInfo.id,
          r.density_value,
          r.density_unit,
          r.toxicity_status,
          r.morphological_notes,
        ])

        if (res.rows[0]?.is_inserted) {
          insertedCount++
        } else {
          updatedCount++
        }
      }

      // Record entry in datasets table (PRD 4 & 6)
      const datasetSql = `
        INSERT INTO datasets (
          file_name, original_name, file_format, file_size_bytes, storage_path, description, uploaded_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `
      const generatedFileName = `PLK_UPLOAD_${Date.now()}.csv`
      const datasetRes = await client.query(datasetSql, [
        generatedFileName,
        originalFileName,
        "CSV",
        fileSizeBytes,
        `/uploads/datasets/${generatedFileName}`,
        `Bulk import rekaman plankton & ubur-ubur (${parsedRows.length} baris data diproses)`,
        session.id,
      ])

      datasetId = datasetRes.rows[0]?.id || null

      await client.query("COMMIT")

      return NextResponse.json({
        success: true,
        message: `Berhasil memproses ${parsedRows.length} data plankton & ubur-ubur (${insertedCount} baru, ${updatedCount} diperbarui)`,
        data: {
          total_rows_processed: parsedRows.length,
          inserted_count: insertedCount,
          updated_count: updatedCount,
          error_count: failedRows.length,
          failed_rows: failedRows,
          dataset_id: datasetId,
        },
      })
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("POST /api/plankton/upload Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal memproses unggahan berkas CSV plankton" },
      { status: 500 }
    )
  }
}
