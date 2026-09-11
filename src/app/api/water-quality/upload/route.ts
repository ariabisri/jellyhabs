import { NextResponse } from "next/server"
import { pool, query } from "@/lib/db"
import { getSession } from "@/lib/auth"
import * as XLSX from "xlsx"

interface WaterQualityRecordToSave {
  record_code: string
  sampling_event_id?: string | null
  data_source_type?: string
  source_title?: string | null
  source_url?: string | null
  temperature_c?: number | null
  salinity_psu?: number | null
  dissolved_oxygen_mgl?: number | null
  ph?: number | null
  chlorophyll_a_ugl?: number | null
  turbidity_ntu?: number | null
  current_speed_ms?: number | null
  depth_m?: number | null
  tds_gl?: number | null
  ph_mv?: number | null
  orp_mv?: number | null
  conductivity_ms_cm?: number | null
  sigma_t?: number | null
  nitrate_no3_mgl?: number | null
  nitrite_no2_mgl?: number | null
  phosphorus_p_mgl?: number | null
  phosphate_po4_mgl?: number | null
  notes?: string | null
  row_index: number
}

function parseExcelTime(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null
  if (typeof val === "number") {
    const totalMinutes = Math.round(val * 24 * 60)
    const hours = Math.floor(totalMinutes / 60) % 24
    const mins = totalMinutes % 60
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
  }
  const str = String(val).trim().replace(".", ":")
  if (str.includes(":")) {
    const parts = str.split(":")
    return `${parts[0].padStart(2, "0")}:${(parts[1] || "00").padEnd(2, "0").slice(0, 2)}`
  }
  return str.slice(0, 5)
}

function parseExcelDate(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null
  if (typeof val === "number") {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000))
    return date.toISOString().split("T")[0]
  }
  const str = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  if (str.includes("/")) {
    const parts = str.split("/")
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
      }
    }
  }
  return str
}

function parseNumeric(val: unknown): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === "number") return isNaN(val) ? null : val
  const cleaned = String(val).replace(",", ".").trim()
  if (cleaned === "" || cleaned === "-" || cleaned.toLowerCase() === "null" || cleaned.toLowerCase() === "nan") {
    return null
  }
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "")
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

    let fileBuffer: Buffer | null = null
    let originalFileName = "water_quality_upload.xlsx"
    let fileSizeBytes = 0
    let userStationId: string | null = null
    let userSamplingId: string | null = null

    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null

      if (!file) {
        return NextResponse.json(
          { success: false, error: "File spreadsheet (.xlsx, .xls, .csv) tidak ditemukan dalam permintaan" },
          { status: 400 }
        )
      }

      originalFileName = file.name
      fileSizeBytes = file.size
      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
      userStationId = (formData.get("station_id") as string | null) || null
      userSamplingId = (formData.get("sampling_event_id") as string | null) || null
    } else {
      const body = await request.json()
      const csvText = body.csvText || ""
      if (body.fileName) originalFileName = body.fileName
      userStationId = body.station_id || null
      userSamplingId = body.sampling_event_id || null
      fileBuffer = Buffer.from(csvText, "utf-8")
      fileSizeBytes = fileBuffer.length
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Berkas yang diunggah kosong" },
        { status: 400 }
      )
    }

    // Read workbook with SheetJS
    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(fileBuffer, { type: "buffer" })
    } catch {
      return NextResponse.json(
        { success: false, error: "Format berkas tidak valid atau berkas rusak. Gunakan file .xlsx, .xls, atau .csv" },
        { status: 400 }
      )
    }

    // Stations & sampling events lookup
    const stationsRes = await query<{ id: string; station_code: string; name: string }>(
      `SELECT id, station_code, name FROM monitoring_stations`
    )
    const stationsList = stationsRes.rows
    const defaultStation = stationsList.find((s) => s.station_code === "ST-03") || stationsList[0]
    let targetStation = userStationId && userStationId !== "all"
      ? stationsList.find((s) => s.id === userStationId || s.station_code === userStationId) || defaultStation
      : defaultStation

    const samplingEventsRes = await query<{ id: string; sampling_code: string; station_id: string; sampling_date: string }>(
      `SELECT id, sampling_code, station_id, TO_CHAR(sampling_date, 'YYYY-MM-DD') AS sampling_date FROM sampling_events`
    )
    const samplingList = samplingEventsRes.rows
    const samplingMapByCode = new Map<string, { id: string; station_id: string }>()
    samplingList.forEach((s) => samplingMapByCode.set(s.sampling_code.toLowerCase().trim(), s))

    const recordsToSave: WaterQualityRecordToSave[] = []
    const failedRows: { row: number; reason: string; raw?: string }[] = []

    // Detect format across sheets
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      if (!sheet) continue
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" })
      if (rawRows.length === 0) continue

      // Check if it's a Logbook format (multi-row header like Logbook_kualitas_air.xlsx)
      let isLogbook = false
      let logbookHeaderIdx = -1

      for (let r = 0; r < Math.min(rawRows.length, 6); r++) {
        const rowStr = (rawRows[r] || []).map((c) => String(c || "")).join(" ").toLowerCase()
        if (
          (rowStr.includes("lokasi") || rowStr.includes("pantai") || rowStr.includes("koordinat")) &&
          (rowStr.includes("suhu") || rowStr.includes("do") || rowStr.includes("parameter"))
        ) {
          isLogbook = true
          logbookHeaderIdx = r
          break
        }
      }

      if (isLogbook) {
        // PARSE FIELD LOGBOOK FORMAT
        for (let r = logbookHeaderIdx + 3; r < rawRows.length; r++) {
          const row = rawRows[r] as unknown[]
          if (!row || row.length === 0) continue

          const locationName = String(row[4] || "").trim()
          if (!locationName || locationName === "-" || locationName === "0") continue
          if (locationName.toLowerCase().startsWith("distribusi") || locationName.toLowerCase().startsWith("berdasarkan")) break

          const rawDate = row[1]
          const parsedDate = parseExcelDate(rawDate)
          if (!parsedDate) {
            failedRows.push({ row: r + 1, reason: "Tanggal pengukuran tidak valid atau kosong" })
            continue
          }

          // Handle coordinates
          const c1 = parseFloat(String(row[2]).replace(",", "."))
          const c2 = parseFloat(String(row[3]).replace(",", "."))
          let lat: number | null = null
          let lng: number | null = null
          if (!isNaN(c1) && !isNaN(c2)) {
            if (c1 < 0) { lat = c1; lng = c2 }
            else { lat = c2; lng = c1 }
          }

          const timeStr = parseExcelTime(row[5])

          // Find or create sampling event for this station & date
          let resolvedSamplingId = userSamplingId
          if (!resolvedSamplingId) {
            const existingSampling = samplingList.find(
              (s) => s.station_id === targetStation.id && s.sampling_date === parsedDate
            )
            if (existingSampling) {
              resolvedSamplingId = existingSampling.id
            } else {
              // Create sampling event on-the-fly
              const dateCompact = parsedDate.replace(/-/g, "")
              const newSamplingCode = `SMP-${targetStation.station_code}-${dateCompact}`
              const existingByCode = samplingMapByCode.get(newSamplingCode.toLowerCase())
              if (existingByCode) {
                resolvedSamplingId = existingByCode.id
              } else {
                const createSamplingSql = `
                  INSERT INTO sampling_events (
                    sampling_code, station_id, sampling_date, sampling_time, weather_condition, field_notes, recorded_by
                  )
                  VALUES ($1, $2, $3, $4, $5, $6, $7)
                  ON CONFLICT (sampling_code) DO UPDATE
                  SET updated_at = CURRENT_TIMESTAMP
                  RETURNING id, sampling_code
                `
                const insSample = await query<{ id: string; sampling_code: string }>(createSamplingSql, [
                  newSamplingCode,
                  targetStation.id,
                  parsedDate,
                  timeStr ? `${timeStr}:00` : "08:00:00",
                  "Cerah Berawan",
                  `Sampling Kualitas Air Lapangan - ${locationName}`,
                  session.id,
                ])
                resolvedSamplingId = insSample.rows[0].id
                samplingList.push({
                  id: resolvedSamplingId,
                  sampling_code: newSamplingCode,
                  station_id: targetStation.id,
                  sampling_date: parsedDate,
                })
                samplingMapByCode.set(newSamplingCode.toLowerCase(), { id: resolvedSamplingId, station_id: targetStation.id })
              }
            }
          }

          const locSlug = locationName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)
          const recordCode = `WQ-${parsedDate.replace(/-/g, "")}-${locSlug}-${r + 1}`

          const notesArr: string[] = []
          if (locationName) notesArr.push(`Lokasi: ${locationName}`)
          if (timeStr) notesArr.push(`Jam: ${timeStr}`)
          if (lat !== null && lng !== null) notesArr.push(`Koordinat: ${lat}, ${lng}`)

          recordsToSave.push({
            record_code: recordCode,
            sampling_event_id: resolvedSamplingId,
            temperature_c: parseNumeric(row[6]),
            ph: parseNumeric(row[7]),
            dissolved_oxygen_mgl: parseNumeric(row[8]),
            tds_gl: parseNumeric(row[9]),
            salinity_psu: parseNumeric(row[10]),
            turbidity_ntu: parseNumeric(row[11]),
            ph_mv: parseNumeric(row[12]),
            orp_mv: parseNumeric(row[13]),
            conductivity_ms_cm: parseNumeric(row[14]),
            sigma_t: parseNumeric(row[15]),
            nitrate_no3_mgl: parseNumeric(row[16]),
            nitrite_no2_mgl: parseNumeric(row[17]),
            phosphorus_p_mgl: parseNumeric(row[18]),
            phosphate_po4_mgl: parseNumeric(row[19]),
            notes: notesArr.join(" | ") || null,
            row_index: r + 1,
          })
        }
      } else {
        // PARSE STANDARD COLUMNAR FORMAT
        let headerRowIdx = 0
        const headerMap: Record<string, number> = {}

        for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
          const row = (rawRows[r] as unknown[]) || []
          const matches = row.filter((c) => {
            const s = String(c || "").toLowerCase()
            return s.includes("code") || s.includes("sampling") || s.includes("suhu") || s.includes("temp") || s.includes("ph")
          })
          if (matches.length >= 2) {
            headerRowIdx = r
            row.forEach((cell, idx) => {
              const norm = normalizeHeader(String(cell || ""))
              if (["record_code", "kode_rekord", "record_id", "id_wq", "id", "kode_wq", "kode"].includes(norm)) {
                if (!("record_code" in headerMap)) headerMap.record_code = idx
              } else if (["sampling_code", "kode_sampling", "sampling_id", "id_sampling", "sampling", "kode_sampel"].includes(norm)) {
                if (!("sampling_code" in headerMap)) headerMap.sampling_code = idx
              } else if (["temperature_c", "temperature", "suhu", "temp", "suhu_c", "temp_c", "suhu_air"].includes(norm)) {
                if (!("temperature_c" in headerMap)) headerMap.temperature_c = idx
              } else if (["salinity_psu", "salinity", "salinitas", "salinitas_psu", "psu", "sal_ppt", "sal"].includes(norm)) {
                if (!("salinity_psu" in headerMap)) headerMap.salinity_psu = idx
              } else if (["dissolved_oxygen_mgl", "dissolved_oxygen", "do", "do_val", "do_mgl", "oksigen_terlarut", "do_mg_l"].includes(norm)) {
                if (!("dissolved_oxygen_mgl" in headerMap)) headerMap.dissolved_oxygen_mgl = idx
              } else if (["ph", "nilai_ph"].includes(norm)) {
                if (!("ph" in headerMap)) headerMap.ph = idx
              } else if (["chlorophyll_a_ugl", "chlorophyll_a", "chlorophyll", "klorofil_a", "klorofil", "klorofil_ugl", "chl_a"].includes(norm)) {
                if (!("chlorophyll_a_ugl" in headerMap)) headerMap.chlorophyll_a_ugl = idx
              } else if (["turbidity_ntu", "turbidity", "kekeruhan", "kekeruhan_ntu", "ntu"].includes(norm)) {
                if (!("turbidity_ntu" in headerMap)) headerMap.turbidity_ntu = idx
              } else if (["current_speed_ms", "current_speed", "kecepatan_arus", "arus_ms", "arus", "speed_ms"].includes(norm)) {
                if (!("current_speed_ms" in headerMap)) headerMap.current_speed_ms = idx
              } else if (["depth_m", "depth", "kedalaman", "kedalaman_m"].includes(norm)) {
                if (!("depth_m" in headerMap)) headerMap.depth_m = idx
              } else if (["tds_gl", "tds", "tds_g_l"].includes(norm)) {
                if (!("tds_gl" in headerMap)) headerMap.tds_gl = idx
              } else if (["ph_mv", "phmv"].includes(norm)) {
                if (!("ph_mv" in headerMap)) headerMap.ph_mv = idx
              } else if (["orp_mv", "orpmv", "orp"].includes(norm)) {
                if (!("orp_mv" in headerMap)) headerMap.orp_mv = idx
              } else if (["conductivity_ms_cm", "conductivity", "ms_cm", "konduktivitas"].includes(norm)) {
                if (!("conductivity_ms_cm" in headerMap)) headerMap.conductivity_ms_cm = idx
              } else if (["sigma_t", "sigmat", "t", "sigma"].includes(norm)) {
                if (!("sigma_t" in headerMap)) headerMap.sigma_t = idx
              } else if (["nitrate_no3_mgl", "no3", "no3_mgl", "nitrat"].includes(norm)) {
                if (!("nitrate_no3_mgl" in headerMap)) headerMap.nitrate_no3_mgl = idx
              } else if (["nitrite_no2_mgl", "no2", "no2_mgl", "nitrit"].includes(norm)) {
                if (!("nitrite_no2_mgl" in headerMap)) headerMap.nitrite_no2_mgl = idx
              } else if (["phosphorus_p_mgl", "p_mgl", "p", "fosfor"].includes(norm)) {
                if (!("phosphorus_p_mgl" in headerMap)) headerMap.phosphorus_p_mgl = idx
              } else if (["phosphate_po4_mgl", "po4", "po4_mgl", "fosfat"].includes(norm)) {
                if (!("phosphate_po4_mgl" in headerMap)) headerMap.phosphate_po4_mgl = idx
              } else if (["data_source_type", "sumber_data", "tipe_sumber", "jenis_sumber", "source_type"].includes(norm)) {
                if (!("data_source_type" in headerMap)) headerMap.data_source_type = idx
              } else if (["source_title", "judul_jurnal", "judul", "jurnal", "publikasi", "artikel", "sumber_bacaan"].includes(norm)) {
                if (!("source_title" in headerMap)) headerMap.source_title = idx
              } else if (["source_url", "url_jurnal", "url", "doi", "link", "tautan"].includes(norm)) {
                if (!("source_url" in headerMap)) headerMap.source_url = idx
              } else if (["notes", "catatan", "keterangan", "deskripsi", "note"].includes(norm)) {
                if (!("notes" in headerMap)) headerMap.notes = idx
              }
            })
            break
          }
        }

        for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r] as unknown[]
          if (!row || row.length === 0 || row.every((c) => c === "" || c === null)) continue

          const rawSamplingCode = "sampling_code" in headerMap ? String(row[headerMap.sampling_code] || "").trim() : ""
          let targetSamplingId = userSamplingId

          if (!targetSamplingId && rawSamplingCode) {
            const found = samplingMapByCode.get(rawSamplingCode.toLowerCase())
            if (found) targetSamplingId = found.id
          }

          const recCodeRaw = "record_code" in headerMap ? String(row[headerMap.record_code] || "").trim() : ""
          const recordCode = recCodeRaw || `WQ-${Date.now()}-${r + 1}`

          const dataSourceTypeRaw = "data_source_type" in headerMap ? String(row[headerMap.data_source_type] || "").trim() : ""
          const dataSourceType = dataSourceTypeRaw || (targetSamplingId ? "Hasil Sampling" : "Jurnal / Publikasi")

          recordsToSave.push({
            record_code: recordCode,
            sampling_event_id: targetSamplingId || null,
            data_source_type: dataSourceType,
            source_title: "source_title" in headerMap ? String(row[headerMap.source_title] || "").trim() || null : null,
            source_url: "source_url" in headerMap ? String(row[headerMap.source_url] || "").trim() || null : null,
            temperature_c: "temperature_c" in headerMap ? parseNumeric(row[headerMap.temperature_c]) : null,
            salinity_psu: "salinity_psu" in headerMap ? parseNumeric(row[headerMap.salinity_psu]) : null,
            dissolved_oxygen_mgl: "dissolved_oxygen_mgl" in headerMap ? parseNumeric(row[headerMap.dissolved_oxygen_mgl]) : null,
            ph: "ph" in headerMap ? parseNumeric(row[headerMap.ph]) : null,
            chlorophyll_a_ugl: "chlorophyll_a_ugl" in headerMap ? parseNumeric(row[headerMap.chlorophyll_a_ugl]) : null,
            turbidity_ntu: "turbidity_ntu" in headerMap ? parseNumeric(row[headerMap.turbidity_ntu]) : null,
            current_speed_ms: "current_speed_ms" in headerMap ? parseNumeric(row[headerMap.current_speed_ms]) : null,
            depth_m: "depth_m" in headerMap ? parseNumeric(row[headerMap.depth_m]) : null,
            tds_gl: "tds_gl" in headerMap ? parseNumeric(row[headerMap.tds_gl]) : null,
            ph_mv: "ph_mv" in headerMap ? parseNumeric(row[headerMap.ph_mv]) : null,
            orp_mv: "orp_mv" in headerMap ? parseNumeric(row[headerMap.orp_mv]) : null,
            conductivity_ms_cm: "conductivity_ms_cm" in headerMap ? parseNumeric(row[headerMap.conductivity_ms_cm]) : null,
            sigma_t: "sigma_t" in headerMap ? parseNumeric(row[headerMap.sigma_t]) : null,
            nitrate_no3_mgl: "nitrate_no3_mgl" in headerMap ? parseNumeric(row[headerMap.nitrate_no3_mgl]) : null,
            nitrite_no2_mgl: "nitrite_no2_mgl" in headerMap ? parseNumeric(row[headerMap.nitrite_no2_mgl]) : null,
            phosphorus_p_mgl: "phosphorus_p_mgl" in headerMap ? parseNumeric(row[headerMap.phosphorus_p_mgl]) : null,
            phosphate_po4_mgl: "phosphate_po4_mgl" in headerMap ? parseNumeric(row[headerMap.phosphate_po4_mgl]) : null,
            notes: "notes" in headerMap ? String(row[headerMap.notes] || "").trim() || null : null,
            row_index: r + 1,
          })
        }
      }
    }

    if (recordsToSave.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Tidak ada baris data valid yang dapat diimpor dari berkas ini",
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

      for (const r of recordsToSave) {
        const upsertSql = `
          INSERT INTO water_quality_records (
            record_code, sampling_event_id, data_source_type, source_title, source_url,
            temperature_c, salinity_psu, dissolved_oxygen_mgl, ph, chlorophyll_a_ugl, turbidity_ntu,
            current_speed_ms, depth_m, tds_gl, ph_mv, orp_mv, conductivity_ms_cm,
            sigma_t, nitrate_no3_mgl, nitrite_no2_mgl, phosphorus_p_mgl, phosphate_po4_mgl,
            notes
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23
          )
          ON CONFLICT (record_code) DO UPDATE
          SET 
            sampling_event_id = EXCLUDED.sampling_event_id,
            data_source_type = COALESCE(EXCLUDED.data_source_type, water_quality_records.data_source_type),
            source_title = COALESCE(EXCLUDED.source_title, water_quality_records.source_title),
            source_url = COALESCE(EXCLUDED.source_url, water_quality_records.source_url),
            temperature_c = COALESCE(EXCLUDED.temperature_c, water_quality_records.temperature_c),
            salinity_psu = COALESCE(EXCLUDED.salinity_psu, water_quality_records.salinity_psu),
            dissolved_oxygen_mgl = COALESCE(EXCLUDED.dissolved_oxygen_mgl, water_quality_records.dissolved_oxygen_mgl),
            ph = COALESCE(EXCLUDED.ph, water_quality_records.ph),
            chlorophyll_a_ugl = COALESCE(EXCLUDED.chlorophyll_a_ugl, water_quality_records.chlorophyll_a_ugl),
            turbidity_ntu = COALESCE(EXCLUDED.turbidity_ntu, water_quality_records.turbidity_ntu),
            current_speed_ms = COALESCE(EXCLUDED.current_speed_ms, water_quality_records.current_speed_ms),
            depth_m = COALESCE(EXCLUDED.depth_m, water_quality_records.depth_m),
            tds_gl = COALESCE(EXCLUDED.tds_gl, water_quality_records.tds_gl),
            ph_mv = COALESCE(EXCLUDED.ph_mv, water_quality_records.ph_mv),
            orp_mv = COALESCE(EXCLUDED.orp_mv, water_quality_records.orp_mv),
            conductivity_ms_cm = COALESCE(EXCLUDED.conductivity_ms_cm, water_quality_records.conductivity_ms_cm),
            sigma_t = COALESCE(EXCLUDED.sigma_t, water_quality_records.sigma_t),
            nitrate_no3_mgl = COALESCE(EXCLUDED.nitrate_no3_mgl, water_quality_records.nitrate_no3_mgl),
            nitrite_no2_mgl = COALESCE(EXCLUDED.nitrite_no2_mgl, water_quality_records.nitrite_no2_mgl),
            phosphorus_p_mgl = COALESCE(EXCLUDED.phosphorus_p_mgl, water_quality_records.phosphorus_p_mgl),
            phosphate_po4_mgl = COALESCE(EXCLUDED.phosphate_po4_mgl, water_quality_records.phosphate_po4_mgl),
            notes = COALESCE(EXCLUDED.notes, water_quality_records.notes),
            updated_at = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS is_inserted
        `
        const res = await client.query(upsertSql, [
          r.record_code,
          r.sampling_event_id ?? null,
          r.data_source_type || "Hasil Sampling",
          r.source_title ?? null,
          r.source_url ?? null,
          r.temperature_c ?? null,
          r.salinity_psu ?? null,
          r.dissolved_oxygen_mgl ?? null,
          r.ph ?? null,
          r.chlorophyll_a_ugl ?? null,
          r.turbidity_ntu ?? null,
          r.current_speed_ms ?? null,
          r.depth_m ?? null,
          r.tds_gl ?? null,
          r.ph_mv ?? null,
          r.orp_mv ?? null,
          r.conductivity_ms_cm ?? null,
          r.sigma_t ?? null,
          r.nitrate_no3_mgl ?? null,
          r.nitrite_no2_mgl ?? null,
          r.phosphorus_p_mgl ?? null,
          r.phosphate_po4_mgl ?? null,
          r.notes ?? null,
        ])

        if (res.rows[0]?.is_inserted) {
          insertedCount++
        } else {
          updatedCount++
        }
      }

      // Record in datasets table
      const fileExt = originalFileName.endsWith(".csv") ? "CSV" : "XLSX"
      const generatedFileName = `WQ_UPLOAD_${Date.now()}.${fileExt.toLowerCase()}`
      const datasetSql = `
        INSERT INTO datasets (
          file_name, original_name, file_format, file_size_bytes, storage_path, description, uploaded_by, station_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `
      const datasetRes = await client.query(datasetSql, [
        generatedFileName,
        originalFileName,
        fileExt,
        fileSizeBytes,
        `/uploads/datasets/${generatedFileName}`,
        `Impor parameter kualitas air (${recordsToSave.length} baris data diproses)`,
        session.id,
        targetStation.id,
      ])

      datasetId = datasetRes.rows[0]?.id || null

      await client.query("COMMIT")

      return NextResponse.json({
        success: true,
        message: `Berhasil memproses ${recordsToSave.length} data kualitas air (${insertedCount} baru, ${updatedCount} diperbarui)`,
        data: {
          total_rows_processed: recordsToSave.length,
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
        error: "Gagal memproses unggahan berkas spreadsheet kualitas air",
      },
      { status: 500 }
    )
  }
}
