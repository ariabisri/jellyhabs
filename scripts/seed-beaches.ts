import { query, pool } from "../src/lib/db"
import * as fs from "fs"
import * as path from "path"

interface BeachSeed {
  name: string
  village: string
  subdistrict: string
  regency: string
  latitude: number
  longitude: number
  sar_post_name: string
  description: string
}

const BEACHES_DATA: BeachSeed[] = [
  {
    name: "Pantai Kukup",
    village: "Kemadang",
    subdistrict: "Tanjungsari",
    regency: "Gunungkidul",
    latitude: -8.134,
    longitude: 110.5532,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron - Pos Kukup",
    description: "Pantai berpasir putih dengan terumbu karang dangkal dan gardu pandang pulau karang Jumino. Lokasi hotspot insiden sengatan tertinggi.",
  },
  {
    name: "Pantai Sepanjang",
    village: "Kemadang",
    subdistrict: "Tanjungsari",
    regency: "Gunungkidul",
    latitude: -8.1347,
    longitude: 110.5592,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron - Pos Sepanjang",
    description: "Garis pantai berpasir terpanjang di Gunungkidul, menyerupai Pantai Kuta dengan aktivitas bermain air wisatawan yang sangat ramai.",
  },
  {
    name: "Pantai Krakal",
    village: "Ngestirejo",
    subdistrict: "Tanjungsari",
    regency: "Gunungkidul",
    latitude: -8.145,
    longitude: 110.5985,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron - Pos Krakal",
    description: "Pantai karang landai luas dengan spot surfing dan kolam pasang surut alami.",
  },
  {
    name: "Pantai Drini",
    village: "Banjarejo",
    subdistrict: "Tanjungsari",
    regency: "Gunungkidul",
    latitude: -8.1362,
    longitude: 110.5776,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron - Pos Drini",
    description: "Pantai dengan pulau karang Drini di tengah, membelah pantai menjadi perairan tenang di sisi barat dan ombak di sisi timur.",
  },
  {
    name: "Pantai Baron",
    village: "Kemadang",
    subdistrict: "Tanjungsari",
    regency: "Gunungkidul",
    latitude: -8.1287,
    longitude: 110.5488,
    sar_post_name: "Markas Komando SAR Linmas Wilayah II Baron",
    description: "Teluk muara sungai bawah tanah dengan pendaratan perahu nelayan dan posko induk pemantauan penyelamatan SAR Linmas.",
  },
  {
    name: "Pantai Sundak",
    village: "Sidoharjo",
    subdistrict: "Tepus",
    regency: "Gunungkidul",
    latitude: -8.1473,
    longitude: 110.608,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron - Pos Sundak",
    description: "Pantai berpasir putih alami dengan gua air tawar di tebing karang.",
  },
  {
    name: "Pantai Pulang Sawal (Indrayanti)",
    village: "Sidoharjo",
    subdistrict: "Tepus",
    regency: "Gunungkidul",
    latitude: -8.1502,
    longitude: 110.612,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron - Pos Pulang Sawal",
    description: "Pantai pasir putih populer dengan fasilitas wisata lengkap dan kunjungan wisatawan sangat padat.",
  },
  {
    name: "Pantai Sadranan",
    village: "Sidoharjo",
    subdistrict: "Tepus",
    regency: "Gunungkidul",
    latitude: -8.1465,
    longitude: 110.6032,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron - Pos Sadranan",
    description: "Pusat aktivitas snorkeling terumbu karang dangkal dan kano laut.",
  },
  {
    name: "Pantai Somandeng",
    village: "Sidoharjo",
    subdistrict: "Tepus",
    regency: "Gunungkidul",
    latitude: -8.1468,
    longitude: 110.605,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron - Pos Sadranan/Somandeng",
    description: "Pantai penghubung antara Sadranan dan Sundak dengan hamparan karang datar.",
  },
  {
    name: "Pantai Ngandong",
    village: "Sidoharjo",
    subdistrict: "Tepus",
    regency: "Gunungkidul",
    latitude: -8.147,
    longitude: 110.607,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron - Pos Sundak",
    description: "Teluk pasir putih tenang di sebelah barat Sundak dengan pangkalan kapal nelayan kecil.",
  },
  {
    name: "Pantai Pok Tunggal",
    village: "Tepus",
    subdistrict: "Tepus",
    regency: "Gunungkidul",
    latitude: -8.154,
    longitude: 110.621,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron - Pos Pok Tunggal",
    description: "Pantai pasir putih yang dikelilingi tebing karst curam dengan pohon Duras ikonik.",
  },
  {
    name: "Pantai Ngrenehan",
    village: "Kanigoro",
    subdistrict: "Saptosari",
    regency: "Gunungkidul",
    latitude: -8.122,
    longitude: 110.509,
    sar_post_name: "Posko SAR Linmas Wilayah I - Pos Ngrenehan",
    description: "Teluk kecil pendaratan perahu ikan dengan pasar ikan segar dan perairan relatif tenang.",
  },
  {
    name: "Pantai Ngobaran",
    village: "Kanigoro",
    subdistrict: "Saptosari",
    regency: "Gunungkidul",
    latitude: -8.123,
    longitude: 110.505,
    sar_post_name: "Posko SAR Linmas Wilayah I - Pos Ngobaran",
    description: "Pantai dengan panorama tebing karang eksotis, pura laut, dan hamparan alga saat surut.",
  },
  {
    name: "Pantai Ngrawe (Mesra)",
    village: "Kemadang",
    subdistrict: "Tanjungsari",
    regency: "Gunungkidul",
    latitude: -8.1345,
    longitude: 110.5555,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron - Pos Kukup/Ngrawe",
    description: "Pantai berpasir putih dengan taman rumput hijau dan gazebo yang tertata rapi.",
  },
  {
    name: "Pantai Slili",
    village: "Sidoharjo",
    subdistrict: "Tepus",
    regency: "Gunungkidul",
    latitude: -8.146,
    longitude: 110.602,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron",
    description: "Pantai mungil berpasir putih di antara Krakal dan Sadranan.",
  },
  {
    name: "Pantai Watu Kodok",
    village: "Kemadang",
    subdistrict: "Tanjungsari",
    regency: "Gunungkidul",
    latitude: -8.138,
    longitude: 110.5695,
    sar_post_name: "Posko SAR Linmas Wilayah II Baron",
    description: "Pantai berpasir putih alami dengan bongkahan batu karang menyerupai katak.",
  },
]

async function main() {
  console.log("=== Menjalankan Migrasi & Seeding Tabel Master Beaches ===")

  // 1. Eksekusi file migrasi SQL
  const migrationPath = path.join(__dirname, "../database/migrations/create_beaches_table.sql")
  const migrationSql = fs.readFileSync(migrationPath, "utf-8")
  await query(migrationSql)
  console.log("✓ Tabel beaches dan relasi berhasil dipastikan di database.")

  // 2. Dapatkan stasiun ST-03 (Pesisir Selatan Jawa)
  const stRes = await query("SELECT id, name FROM monitoring_stations WHERE station_code = 'ST-03' LIMIT 1")
  if (stRes.rows.length === 0) {
    console.error("❌ Stasiun ST-03 tidak ditemukan!")
    process.exit(1)
  }
  const station = stRes.rows[0]
  console.log(`✓ Mengaitkan pantai dengan Stasiun: ${station.name} (${station.id})`)

  // 3. Masukkan / Upsert data pantai
  let insertedCount = 0
  for (const b of BEACHES_DATA) {
    const res = await query(
      `INSERT INTO beaches (station_id, name, village, subdistrict, regency, latitude, longitude, sar_post_name, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'aktif')
       ON CONFLICT (station_id, name) DO UPDATE SET
         village = EXCLUDED.village,
         subdistrict = EXCLUDED.subdistrict,
         regency = EXCLUDED.regency,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         sar_post_name = EXCLUDED.sar_post_name,
         description = EXCLUDED.description,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [
        station.id,
        b.name,
        b.village,
        b.subdistrict,
        b.regency,
        b.latitude,
        b.longitude,
        b.sar_post_name,
        b.description,
      ]
    )
    insertedCount++
  }
  console.log(`✓ Berhasil melakukan seed/upsert ${insertedCount} pantai ke tabel beaches.`)

  // 4. Update relasi beach_id di sting_records berdasarkan pencocokan nama
  const allBeaches = await query("SELECT id, name FROM beaches WHERE station_id = $1", [station.id])
  let updatedRecords = 0

  for (const beach of allBeaches.rows) {
    const baseKeyword = beach.name.replace(/^pantai\s+/i, "").replace(/\s*\(.*\)/, "").trim().toLowerCase()
    let keywords = [baseKeyword]
    if (beach.name.toLowerCase().includes("pulang sawal")) keywords.push("pulang sawal", "indrayanti")
    if (beach.name.toLowerCase().includes("ngrawe")) keywords.push("ngrawe", "mesra")

    for (const kw of keywords) {
      const updateRes = await query(
        `UPDATE sting_records 
         SET beach_id = $1, station_id = $2
         WHERE beach_id IS NULL AND LOWER(location_name) LIKE '%' || $3 || '%'`,
        [beach.id, station.id, kw]
      )
      updatedRecords += updateRes.rowCount || 0
    }
  }

  console.log(`✓ Berhasil mengaitkan ${updatedRecords} rekam data sting_records dengan beach_id terkait.`)

  // 5. Cek statistik relasi
  const statRes = await query(`
    SELECT b.name as beach_name, COUNT(s.id) as incident_count, COALESCE(SUM(s.victim_count), 0) as total_victims
    FROM beaches b
    LEFT JOIN sting_records s ON b.id = s.beach_id
    GROUP BY b.name
    ORDER BY total_victims DESC
  `)

  console.log("\nRingkasan Relasi Pantai & Data Sengatan:")
  console.table(statRes.rows)

  await pool.end()
  console.log("=== Selesai ===")
}

main().catch((err) => {
  console.error("Gagal menjalankan seed beaches:", err)
  process.exit(1)
})
