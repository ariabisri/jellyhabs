import { NextResponse } from "next/server"
import { pool, query } from "@/lib/db"
import { getSession } from "@/lib/auth"

interface CsvRowParsed {
  record_code: string
  sampling_code: string
  temperature_c?: number | null
  salinity_psu?: number | null
  dissolved_oxygen_mgl?: number | null
  ph?: number | null
  chlorophyll_a_ugl?: number | null
  turbidity_ntu?: number | null
  current_speed_ms?: number | null
  depth_m?: number | null
  notes?: string | null
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
        i++ // skip escaped quote
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
  const cleaned = val.replace(",", ".").trim()
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
    
    // record_code
    if (["record_code", "kode_rekord", "record_id", "id_wq", "id", "kode_wq", "kode"].includes(norm)) {
      if (!("record_code" in map)) map.record_code = idx
    }
    // sampling_code
    else if (["sampling_code", "kode_sampling", "sampling_id", "id_sampling", "sampling", "kode_sampel"].includes(norm)) {
      if (!("sampling_code" in map)) map.sampling_code = idx
    }
    // temperature_c
    else if (["temperature_c", "temperature", "suhu", "temp", "suhu_c", "temp_c", "suhu_air"].includes(norm)) {
      if (!("temperature_c" in map)) map.temperature_c = idx
    }
    // salinity_psu
    else if (["salinity_psu", "salinity", "salinitas", "salinitas_psu", "psu"].includes(norm)) {
      if (!("salinity_psu" in map)) map.salinity_psu = idx
    }
    // dissolved_oxygen_mgl
    else if (["dissolved_oxygen_mgl", "dissolved_oxygen", "do", "do_val", "do_mgl", "oksigen_terlarut", "do_mg_l"].includes(norm)) {
      if (!("dissolved_oxygen_mgl" in map)) map.dissolved_oxygen_mgl = idx
    }
    // ph
    else if (["ph", "nilai_ph"].includes(norm)) {
      if (!("ph" in map)) map.ph = idx
    }
    // chlorophyll_a_ugl
    else if (["chlorophyll_a_ugl", "chlorophyll_a", "chlorophyll", "klorofil_a", "klorofil", "klorofil_ugl", "chl_a", "klorofil_a_ug_l"].includes(norm)) {
      if (!("chlorophyll_a_ugl" in map)) map.chlorophyll_a_ugl = idx
    }
    // turbidity_ntu
    else if (["turbidity_ntu", "turbidity", "kekeruhan", "kekeruhan_ntu", "ntu"].includes(norm)) {
      if (!("turbidity_ntu" in map)) map.turbidity_ntu = idx
    }
    // current_speed_ms
    else if (["current_speed_ms", "current_speed", "kecepatan_arus", "arus_ms", "arus", "speed_ms"].includes(norm)) {
      if (!("current_speed_ms" in map)) map.current_speed_ms = idx
    }
    // depth_m
    else if (["depth_m", "depth", "kedalaman", "kedalaman_m"].includes(norm)) {
      if (!("depth_m" in map)) map.depth_m = idx
    }
    // notes
    else if (["notes", "catatan", "keterangan", "deskripsi", "note"].includes(norm)) {
      if (!("notes" in map)) map.notes = idx
    }
  })

  return map
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Autentikasi diperlukan untuk mengunggah dataset kualitas air",
        },
        { status: 401 }
      )
    }

    let csvContent = ""
    let originalFileName = "water_quality_upload.csv"
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

    // Split lines
    const lines = csvContent
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter((l) => l.trim().length > 0)

    if (lines.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Berkas CSV harus memiliki baris header dan minimal satu baris data",
        },
        { status: 400 }
      )
    }

    // Detect delimiter
    const firstLine = lines[0]
    const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ","
    const headers = parseCsvLine(firstLine, delimiter)
    const headerMap = mapHeaders(headers)

    if (!("record_code" in headerMap) && !("sampling_code" in headerMap)) {
      return NextResponse.json(
        {
          success: false,
          error: "Header CSV harus memuat kolom 'record_code' / 'kode_rekord' dan 'sampling_code' / 'kode_sampling'",
        },
        { status: 400 }
      )
    }

    // Fetch existing sampling events for mapping
    const samplingRes = await query(`SELECT id, sampling_code, station_id FROM sampling_events`)
    const samplingMap = new Map<string, { id: string; station_id: string }>()
    samplingRes.rows.forEach((r) => {
      samplingMap.set(r.sampling_code.toLowerCase().trim(), { id: r.id, station_id: r.station_id })
    })

    const parsedRows: CsvRowParsed[] = []
    const failedRows: { row: number; reason: string; raw: string }[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cols = parseCsvLine(line, delimiter)
      const recordCode = ("record_code" in headerMap ? cols[headerMap.record_code] : "") || `WQ-IMP-${Date.now()}-${i}`
      const samplingCode = "sampling_code" in headerMap ? cols[headerMap.sampling_code] : ""

      if (!samplingCode) {
        failedRows.push({
          row: i + 1,
          reason: "Kode sampling ('sampling_code') kosong",
          raw: line,
        })
        continue
      }

      if (!samplingMap.has(samplingCode.toLowerCase())) {
        failedRows.push({
          row: i + 1,
          reason: `Kode sampling '${samplingCode}' tidak ditemukan di database`,
          raw: line,
        })
        continue
      }

      parsedRows.push({
        record_code: recordCode.trim(),
        sampling_code: samplingCode.trim(),
        temperature_c: "temperature_c" in headerMap ? parseNumeric(cols[headerMap.temperature_c]) : null,
        salinity_psu: "salinity_psu" in headerMap ? parseNumeric(cols[headerMap.salinity_psu]) : null,
        dissolved_oxygen_mgl: "dissolved_oxygen_mgl" in headerMap ? parseNumeric(cols[headerMap.dissolved_oxygen_mgl]) : null,
        ph: "ph" in headerMap ? parseNumeric(cols[headerMap.ph]) : null,
        chlorophyll_a_ugl: "chlorophyll_a_ugl" in headerMap ? parseNumeric(cols[headerMap.chlorophyll_a_ugl]) : null,
        turbidity_ntu: "turbidity_ntu" in headerMap ? parseNumeric(cols[headerMap.turbidity_ntu]) : null,
        current_speed_ms: "current_speed_ms" in headerMap ? parseNumeric(cols[headerMap.current_speed_ms]) : null,
        depth_m: "depth_m" in headerMap ? parseNumeric(cols[headerMap.depth_m]) : null,
        notes: "notes" in headerMap ? (cols[headerMap.notes] || null) : null,
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
        const samplingInfo = samplingMap.get(r.sampling_code.toLowerCase())!

        const upsertSql = `
          INSERT INTO water_quality_records (
            record_code, sampling_event_id, temperature_c, salinity_psu,
            dissolved_oxygen_mgl, ph, chlorophyll_a_ugl, turbidity_ntu,
            current_speed_ms, depth_m, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (record_code) DO UPDATE
          SET 
            sampling_event_id = EXCLUDED.sampling_event_id,
            temperature_c = COALESCE(EXCLUDED.temperature_c, water_quality_records.temperature_c),
            salinity_psu = COALESCE(EXCLUDED.salinity_psu, water_quality_records.salinity_psu),
            dissolved_oxygen_mgl = COALESCE(EXCLUDED.dissolved_oxygen_mgl, water_quality_records.dissolved_oxygen_mgl),
            ph = COALESCE(EXCLUDED.ph, water_quality_records.ph),
            chlorophyll_a_ugl = COALESCE(EXCLUDED.chlorophyll_a_ugl, water_quality_records.chlorophyll_a_ugl),
            turbidity_ntu = COALESCE(EXCLUDED.turbidity_ntu, water_quality_records.turbidity_ntu),
            current_speed_ms = COALESCE(EXCLUDED.current_speed_ms, water_quality_records.current_speed_ms),
            depth_m = COALESCE(EXCLUDED.depth_m, water_quality_records.depth_m),
            notes = COALESCE(EXCLUDED.notes, water_quality_records.notes),
            updated_at = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS is_inserted
        `
        const res = await client.query(upsertSql, [
          r.record_code,
          samplingInfo.id,
          r.temperature_c,
          r.salinity_psu,
          r.dissolved_oxygen_mgl,
          r.ph,
          r.chlorophyll_a_ugl,
          r.turbidity_ntu,
          r.current_speed_ms,
          r.depth_m,
          r.notes,
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
      const generatedFileName = `WQ_UPLOAD_${Date.now()}.csv`
      const datasetRes = await client.query(datasetSql, [
        generatedFileName,
        originalFileName,
        "CSV",
        fileSizeBytes,
        `/uploads/datasets/${generatedFileName}`,
        `Bulk import parameter kualitas air (${parsedRows.length} baris data diproses)`,
        session.id,
      ])

      datasetId = datasetRes.rows[0]?.id || null

      await client.query("COMMIT")

      return NextResponse.json({
        success: true,
        message: `Berhasil memproses ${parsedRows.length} data kualitas air (${insertedCount} baru, ${updatedCount} diperbarui)`,
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
    console.error("POST /api/water-quality/upload Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memproses unggahan berkas CSV kualitas air",
      },
      { status: 500 }
    )
  }
}
