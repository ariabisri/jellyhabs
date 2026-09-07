import { query } from "../src/lib/db"
import * as XLSX from "xlsx"
import * as path from "path"

const BEACH_COORDINATES: Record<string, [number, number]> = {
  sepanjang: [-8.1347, 110.5592],
  kukup: [-8.134, 110.5532],
  krakal: [-8.145, 110.5985],
  drini: [-8.1362, 110.5776],
  sundak: [-8.1473, 110.608],
  "pulang sawal": [-8.1502, 110.612],
  indrayanti: [-8.1502, 110.612],
  baron: [-8.1287, 110.5488],
  sadranan: [-8.1465, 110.6032],
  ngrawe: [-8.1345, 110.5555],
  mesra: [-8.1345, 110.5555],
  ngandong: [-8.147, 110.607],
  "watu kodok": [-8.138, 110.5695],
  slili: [-8.146, 110.602],
  timang: [-8.175, 110.662],
  jungwok: [-8.188, 110.708],
  siung: [-8.182, 110.683],
  ngobaran: [-8.123, 110.505],
  ngrenehan: [-8.122, 110.509],
  gesing: [-8.118, 110.493],
}

function resolveCoordinates(locationName: string): [number, number] {
  const norm = locationName.toLowerCase().trim()
  for (const [key, coords] of Object.entries(BEACH_COORDINATES)) {
    if (norm.includes(key)) {
      return coords
    }
  }
  return [-8.135, 110.57] // default Gunung Kidul coast
}

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

async function run() {
  console.log("--- CLEANING & RE-SEEDING STING RECORDS ---")

  // Ensure table exists
  await query(`
    CREATE TABLE IF NOT EXISTS sting_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        incident_date DATE NOT NULL,
        incident_time TIME,
        location_name VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 7),
        longitude DECIMAL(10, 7),
        station_id UUID REFERENCES monitoring_stations(id) ON DELETE SET NULL,
        bloom_event_id UUID REFERENCES bloom_events(id) ON DELETE SET NULL,
        victim_count INTEGER NOT NULL DEFAULT 1 CHECK (victim_count >= 1),
        victim_name VARCHAR(255),
        victim_age VARCHAR(50),
        victim_gender VARCHAR(20) CHECK (victim_gender IN ('Laki-laki', 'Perempuan')),
        severity_level VARCHAR(50),
        treatment_notes TEXT,
        reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Truncate table for clean re-seed
  await query(`TRUNCATE TABLE sting_records`)

  // Station ST-03 (Pesisir Selatan Jawa)
  const stRes = await query(`SELECT id FROM monitoring_stations WHERE station_code = 'ST-03' LIMIT 1`)
  const defaultStationId = stRes.rows[0]?.id || null

  // Jellyfish Bloom Event (EVT-202607-02)
  const evRes = await query(`SELECT id FROM bloom_events WHERE event_code = 'EVT-202607-02' LIMIT 1`)
  const jellyfishEventId = evRes.rows[0]?.id || null

  const excelPath = path.resolve(process.cwd(), "Database Korban Sengatan Ubur-Ubur 2021-2026.xlsx")
  const workbook = XLSX.readFile(excelPath)

  let totalInserted = 0

  for (const sheetName of workbook.SheetNames) {
    const yearNumber = parseInt(sheetName, 10) || 2024
    const sheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 })

    // Find the header row
    let headerRowIdx = -1
    const colIdxMap: Record<string, number> = {}

    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i] || []
      const joined = row.map((c: any) => String(c || "")).join(" ").toLowerCase()
      if (joined.includes("bulan") && (joined.includes("lokasi") || joined.includes("pantai"))) {
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
      console.log(`Skipping sheet ${sheetName}: Header not recognized.`)
      continue
    }

    console.log(`Processing ${sheetName}: headerRow = ${headerRowIdx}, columns:`, colIdxMap)

    for (let r = headerRowIdx + 1; r < rawData.length; r++) {
      const row = rawData[r] || []
      if (!row || row.length === 0) continue

      // Must have a valid numeric 'No' or valid beach location
      const noVal = colIdxMap.no !== undefined ? row[colIdxMap.no] : null
      const locVal = colIdxMap.location !== undefined ? String(row[colIdxMap.location] || "").trim() : ""

      if (!locVal || locVal === "-" || locVal === "0") continue
      if (!locVal.toLowerCase().includes("pantai") && !BEACH_COORDINATES[locVal.toLowerCase()]) {
        // Not a beach name row, probably summary text
        continue
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

      const coords = resolveCoordinates(locVal)

      let bloomId: string | null = null
      if (yearNumber === 2026 && incidentDate.startsWith("2026-07")) {
        bloomId = jellyfishEventId
      }

      const isChild = victimAge && (parseInt(victimAge, 10) < 12 || victimAge.includes("tahun") && parseInt(victimAge, 10) < 12)
      const severity = isChild ? "Sedang - Sesak Napas & Kram" : "Ringan - Iritasi Kulit & Nyeri Panas"

      const insertSql = `
        INSERT INTO sting_records (
          incident_date, location_name, latitude, longitude,
          station_id, bloom_event_id, victim_count, victim_name,
          victim_age, victim_gender, severity_level, treatment_notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `

      await query(insertSql, [
        incidentDate,
        locVal,
        coords[0],
        coords[1],
        defaultStationId,
        bloomId,
        victimCount,
        victimName,
        victimAge,
        victimGender,
        severity,
        "Pertolongan pertama oleh Tim SAR Linmas Pantai (kompres cuka asam asetat 4-6% dan air hangat).",
      ])

      totalInserted++
    }
  }

  console.log(`✓ Clean seed complete! Total inserted records: ${totalInserted}`)
  process.exit(0)
}

run().catch((err) => {
  console.error("Clean seed failed:", err)
  process.exit(1)
})
