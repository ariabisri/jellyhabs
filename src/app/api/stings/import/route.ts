import { NextResponse } from "next/server"
import { pool, query } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveBeachCoordinates } from "@/lib/beach-coordinates"
import * as XLSX from "xlsx"
import type { PoolClient } from "pg"

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

const DATA_SOURCE_TYPES = ["Hasil Sampling", "Referensi Jurnal", "Berita", "Laporan Instansi"] as const
type DataSourceType = (typeof DATA_SOURCE_TYPES)[number]

/** Normalisasi nama pantai: huruf kecil, tanpa awalan "pantai", spasi dirapikan. */
function normalizeBeachName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^pantai\s+/, "")
    .trim()
}

/**
 * Mencari pantai di stasiun terpilih (cocok persis setelah normalisasi nama,
 * jadi "Baron" = "Pantai Baron" = "pantai  baron").
 * Jika belum ada → otomatis ditambahkan ke daftar pantai stasiun tersebut,
 * lengkap dengan koordinat, kabupaten, dan status aktif.
 * Hasilnya di-cache per request (cache lokal, bukan global, agar aman untuk request bersamaan).
 */
async function resolveOrCreateBeach(
  client: PoolClient,
  cache: Map<string, string>,
  locationName: string,
  stationId: string,
  latitude: number,
  longitude: number
): Promise<{ id: string; created: boolean }> {
  const displayName = locationName.trim().replace(/\s+/g, " ")
  const key = normalizeBeachName(displayName)
  const cacheKey = `${key}|${stationId}`

  const cached = cache.get(cacheKey)
  if (cached) return { id: cached, created: false }

  // 1. Cari pantai yang sudah ada (nama dinormalisasi di sisi SQL & JS yang sama)
  const existing = await client.query<{ id: string }>(
    `SELECT id FROM beaches
     WHERE station_id = $1
       AND TRIM(REGEXP_REPLACE(REGEXP_REPLACE(LOWER(name), '\\s+', ' ', 'g'), '^pantai\\s+', '')) = $2
     LIMIT 1`,
    [stationId, key]
  )
  if (existing.rows[0]) {
    cache.set(cacheKey, existing.rows[0].id)
    return { id: existing.rows[0].id, created: false }
  }

  // 2. Pantai baru → masukkan ke daftar pantai stasiun
  const inserted = await client.query<{ id: string }>(
    `INSERT INTO beaches (station_id, name, regency, latitude, longitude, description, status)
     VALUES ($1, $2, 'Gunungkidul', $3, $4, 'Ditambahkan otomatis dari import data korban sengatan', 'aktif')
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [stationId, displayName.slice(0, 150), latitude, longitude]
  )

  let id = inserted.rows[0]?.id
  let created = !!id
  if (!id) {
    // Konflik unik (nama sama sudah ada, mis. beda penulisan) → pakai yang sudah ada
    const fallback = await client.query<{ id: string }>(
      `SELECT id FROM beaches WHERE station_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
      [stationId, displayName.slice(0, 150)]
    )
    id = fallback.rows[0]?.id
    created = false
  }
  if (!id) throw new Error(`Gagal menambahkan pantai baru "${displayName}" ke daftar pantai stasiun`)

  cache.set(cacheKey, id)
  return { id, created }
}

let sourceColumnsEnsured = false

async function ensureStingSourceColumns() {
  if (sourceColumnsEnsured) return
  await query(`
    ALTER TABLE sting_records
      ADD COLUMN IF NOT EXISTS data_source_type VARCHAR(50) DEFAULT 'Hasil Sampling',
      ADD COLUMN IF NOT EXISTS sampling_event_id UUID REFERENCES sampling_events(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS source_title VARCHAR(500),
      ADD COLUMN IF NOT EXISTS source_url VARCHAR(1024);
  `)
  sourceColumnsEnsured = true
}

type ParsedRecord = {
  incident_date: string
  location_name: string
  latitude: number
  longitude: number
  bloom_event_id: string | null
  victim_count: number
  victim_name: string | null
  victim_age: string | null
  victim_gender: string | null
  severity_level: string
  treatment_notes: string
}

const cellStr = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim())
const cellNum = (v: unknown) => {
  const n = parseInt(cellStr(v), 10)
  return isNaN(n) ? 0 : n
}
const emptyToNull = (v: unknown) => {
  const s = cellStr(v)
  return s && s !== "-" ? s : null
}

function parseMonth(v: unknown): number | null {
  const s = cellStr(v).toLowerCase()
  if (!s) return null
  if (MONTH_MAP[s]) return MONTH_MAP[s]
  const n = parseInt(s, 10)
  return n >= 1 && n <= 12 ? n : null
}

function parseDay(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = typeof v === "number" ? v : parseInt(cellStr(v), 10)
  if (isNaN(n)) return null
  if (n >= 1 && n <= 31) return Math.floor(n)
  // Excel date serial (mis. kolom tanggal diformat sebagai tanggal)
  if (n > 31) {
    const d = XLSX.SSF.parse_date_code(n)
    if (d && d.d >= 1 && d.d <= 31) return d.d
  }
  return null
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

    // ---------- Metadata form upload ----------
    const stationIdInput = cellStr(formData.get("station_id"))
    const yearInput = parseInt(cellStr(formData.get("year")), 10)
    const sourceTypeInput = cellStr(formData.get("data_source_type")) as DataSourceType
    const samplingEventIdInput = cellStr(formData.get("sampling_event_id"))
    const sourceTitleInput = cellStr(formData.get("source_title"))
    const sourceUrlInput = cellStr(formData.get("source_url"))

    if (!stationIdInput || stationIdInput === "all") {
      return NextResponse.json({ success: false, error: "Stasiun pengamatan wajib dipilih" }, { status: 400 })
    }
    if (isNaN(yearInput) || yearInput < 1900 || yearInput > 2100) {
      return NextResponse.json({ success: false, error: "Tahun kejadian wajib diisi dengan benar (1900-2100)" }, { status: 400 })
    }
    if (!DATA_SOURCE_TYPES.includes(sourceTypeInput)) {
      return NextResponse.json(
        { success: false, error: `Sumber data wajib dipilih (${DATA_SOURCE_TYPES.join(" / ")})` },
        { status: 400 }
      )
    }

    const stationRes = await query<{ id: string }>(
      `SELECT id FROM monitoring_stations WHERE id::text = $1 OR LOWER(station_code) = LOWER($1) LIMIT 1`,
      [stationIdInput]
    )
    const targetStationId = stationRes.rows[0]?.id
    if (!targetStationId) {
      return NextResponse.json({ success: false, error: "Stasiun pengamatan tidak ditemukan" }, { status: 404 })
    }

    let samplingEventId: string | null = null
    let sourceTitle: string | null = null
    let sourceUrl: string | null = null

    if (sourceTypeInput === "Hasil Sampling") {
      if (!samplingEventIdInput) {
        return NextResponse.json(
          { success: false, error: "Sampling event wajib dipilih untuk sumber data Hasil Sampling" },
          { status: 400 }
        )
      }
      const seRes = await query<{ id: string; sampling_code: string }>(
        `SELECT id, sampling_code FROM sampling_events WHERE id::text = $1 AND station_id = $2 LIMIT 1`,
        [samplingEventIdInput, targetStationId]
      )
      if (seRes.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Sampling event tidak ditemukan pada stasiun pengamatan yang dipilih" },
          { status: 400 }
        )
      }
      samplingEventId = seRes.rows[0].id
      sourceTitle = seRes.rows[0].sampling_code
    } else {
      if (!sourceTitleInput) {
        return NextResponse.json(
          { success: false, error: `Judul / nama sumber wajib diisi untuk sumber data ${sourceTypeInput}` },
          { status: 400 }
        )
      }
      sourceTitle = sourceTitleInput.slice(0, 500)
      sourceUrl = sourceUrlInput ? sourceUrlInput.slice(0, 1024) : null
    }

    // ---------- Baca workbook ----------
    const originalFileName = file.name
    const fileSizeBytes = file.size
    const buffer = Buffer.from(await file.arrayBuffer())

    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(buffer, { type: "buffer" })
    } catch {
      return NextResponse.json(
        { success: false, error: "Format berkas tidak valid atau berkas rusak" },
        { status: 400 }
      )
    }

    const evRes = await query<{ id: string }>(`SELECT id FROM bloom_events WHERE event_code = 'EVT-202607-02' LIMIT 1`)
    const jellyfishEventId = evRes.rows[0]?.id || null

    const parsedRecords: ParsedRecord[] = []
    const skippedRows: string[] = []

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })

      // Cari baris header
      let headerRowIdx = -1
      const col: Record<string, number> = {}

      for (let i = 0; i < Math.min(rawData.length, 15); i++) {
        const row = rawData[i] || []
        const joined = row.map(cellStr).join(" ").toLowerCase()
        if (!joined.includes("lokasi") && !joined.includes("pantai")) continue

        headerRowIdx = i
        row.forEach((cell, idx) => {
          const s = cellStr(cell).toLowerCase()
          if (!s) return
          if (s === "no" || s === "no.") col.no = idx
          else if (s.includes("bulan")) col.month = idx
          else if (s.includes("tanggal") || s.includes("tgl")) col.date = idx
          else if (s.includes("lokasi") || s.includes("pantai")) col.location = idx
          else if (s.includes("nama")) col.name = idx
          else if (s.includes("jumlah")) col.victimCount = idx
          else if (s.includes("umur") || s.includes("usia")) col.age = idx
          else if (s.includes("kelamin") || s.includes("gender")) col.gender = idx
          else if (s.includes("laki")) col.male = idx
          else if (s.includes("perempuan")) col.female = idx
        })

        // Sub-header (format db_korban.xlsx): "Laki-laki" | "Perempuan"
        const subRow = rawData[i + 1] || []
        subRow.forEach((cell, idx) => {
          const s = cellStr(cell).toLowerCase()
          if (s.includes("laki")) col.male = idx
          else if (s.includes("perempuan")) col.female = idx
        })
        break
      }

      if (headerRowIdx === -1 || col.location === undefined) continue

      const hasGenderCountCols = col.male !== undefined || col.female !== undefined

      for (let r = headerRowIdx + 1; r < rawData.length; r++) {
        const row = rawData[r] || []
        const locVal = cellStr(row[col.location])
        if (!locVal || locVal === "-" || locVal === "0") continue

        const lower = locVal.toLowerCase()
        if (lower.startsWith("distribusi") || lower.startsWith("berdasarkan") || lower.startsWith("total")) break

        const month = col.month !== undefined ? parseMonth(row[col.month]) : null
        const day = col.date !== undefined ? parseDay(row[col.date]) : null
        if (!month || !day) {
          skippedRows.push(`Baris ${r + 1} (${sheetName}): bulan/tanggal kejadian tidak valid`)
          continue
        }

        const lastDay = new Date(yearInput, month, 0).getDate()
        const incidentDate = `${yearInput}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`

        const totalCount = col.victimCount !== undefined ? cellNum(row[col.victimCount]) : 0
        const victimName = col.name !== undefined ? emptyToNull(row[col.name]) : null
        const victimAge = col.age !== undefined ? emptyToNull(row[col.age]) : null

        // Tentukan pembagian jenis kelamin
        const groups: { gender: string | null; count: number }[] = []
        if (hasGenderCountCols) {
          const male = col.male !== undefined ? cellNum(row[col.male]) : 0
          const female = col.female !== undefined ? cellNum(row[col.female]) : 0
          if (male > 0 && female > 0) {
            groups.push({ gender: "Laki-laki", count: male }, { gender: "Perempuan", count: female })
          } else if (male > 0) {
            groups.push({ gender: "Laki-laki", count: totalCount || male })
          } else if (female > 0) {
            groups.push({ gender: "Perempuan", count: totalCount || female })
          } else {
            groups.push({ gender: null, count: totalCount || 1 })
          }
        } else {
          let gender: string | null = null
          if (col.gender !== undefined) {
            const g = cellStr(row[col.gender]).toLowerCase()
            if (g.includes("laki") || g === "l") gender = "Laki-laki"
            else if (g.includes("perempuan") || g === "p") gender = "Perempuan"
          }
          groups.push({ gender, count: totalCount || 1 })
        }

        const coords = resolveBeachCoordinates(locVal)
        const bloomId = incidentDate.startsWith("2026-07") ? jellyfishEventId : null
        const ageNum = victimAge ? parseInt(victimAge, 10) : NaN
        const severity = !isNaN(ageNum) && ageNum < 12
          ? "Sedang - Sesak Napas & Kram"
          : "Ringan - Iritasi Kulit & Nyeri Panas"

        for (const g of groups) {
          parsedRecords.push({
            incident_date: incidentDate,
            location_name: locVal,
            latitude: coords[0],
            longitude: coords[1],
            bloom_event_id: bloomId,
            victim_count: Math.max(1, g.count),
            victim_name: victimName,
            victim_age: victimAge,
            victim_gender: g.gender,
            severity_level: severity,
            treatment_notes: "Penanganan pertama oleh Tim SAR Linmas Pantai (kompres cuka asam asetat).",
          })
        }
      }
    }

    if (parsedRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tidak ada baris data valid yang dapat diimpor. Gunakan template resmi dengan kolom 'Bulan Kejadian', 'Tanggal Kejadian', 'Lokasi Pantai', dan 'Jumlah Korban'.",
          skipped: skippedRows.slice(0, 20),
        },
        { status: 400 }
      )
    }

    // ---------- Simpan ke database (transaksi) ----------
    await ensureStingSourceColumns()
    const client = await pool.connect()
    let insertedCount = 0
    let newBeachCount = 0
    const beachCache = new Map<string, string>() // cache per request
    const createdBeachIds = new Set<string>()

    try {
      await client.query("BEGIN")

      const insertSql = `
        INSERT INTO sting_records (
          incident_date, location_name, latitude, longitude,
          station_id, beach_id, bloom_event_id, victim_count, victim_name,
          victim_age, victim_gender, severity_level, treatment_notes, reported_by,
          data_source_type, sampling_event_id, source_title, source_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `

      for (const rec of parsedRecords) {
        const { id: beachId, created } = await resolveOrCreateBeach(
          client,
          beachCache,
          rec.location_name,
          targetStationId,
          rec.latitude,
          rec.longitude
        )
        if (created) createdBeachIds.add(beachId)
        await client.query(insertSql, [
          rec.incident_date,
          rec.location_name.slice(0, 255),
          rec.latitude,
          rec.longitude,
          targetStationId,
          beachId,
          rec.bloom_event_id,
          rec.victim_count,
          rec.victim_name ? rec.victim_name.slice(0, 255) : null,
          rec.victim_age ? rec.victim_age.slice(0, 50) : null,
          rec.victim_gender,
          rec.severity_level.slice(0, 50),
          rec.treatment_notes,
          session.id,
          sourceTypeInput,
          samplingEventId,
          sourceTitle,
          sourceUrl,
        ])
        insertedCount++
      }
      newBeachCount = createdBeachIds.size

      const ext = (originalFileName.split(".").pop()?.toUpperCase() || "XLSX").slice(0, 10)
      const generatedFileName = `STING_IMPORT_${Date.now()}.${ext.toLowerCase()}`
      await client.query(
        `
        INSERT INTO datasets (
          file_name, original_name, file_format, file_size_bytes, storage_path, description, uploaded_by, station_id, sampling_event_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          generatedFileName.slice(0, 255),
          originalFileName.slice(0, 255),
          ext,
          fileSizeBytes,
          `/uploads/datasets/${generatedFileName}`.slice(0, 512),
          `Import data korban sengatan ubur-ubur tahun ${yearInput} (${insertedCount} catatan) — Sumber: ${sourceTypeInput}${sourceTitle ? ` (${sourceTitle})` : ""}`,
          session.id,
          targetStationId,
          samplingEventId,
        ]
      )

      await client.query("COMMIT")

      return NextResponse.json({
        success: true,
        message: `Berhasil mengimpor ${insertedCount} catatan korban sengatan tahun ${yearInput}${
          skippedRows.length ? ` (${skippedRows.length} baris dilewati)` : ""
        }${newBeachCount ? ` — ${newBeachCount} pantai baru ditambahkan` : ""}`,
        data: {
          total_processed: parsedRecords.length,
          inserted_count: insertedCount,
          new_beaches_added: newBeachCount,
          skipped: skippedRows.slice(0, 20),
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
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        success: false,
        error: `Terjadi kesalahan internal saat memproses unggahan file: ${detail}`,
      },
      { status: 500 }
    )
  }
}
