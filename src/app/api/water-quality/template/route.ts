import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET() {
  const wb = XLSX.utils.book_new()

  // 1. Sheet: Template_Logbook_Lapangan (Sesuai Logbook Riset Oseanografi)
  const logbookData = [
    ["No", "Tanggal", "Koordinat", "", "Nama Lokasi", "Jam Pengukuran", "", "Parameter Pengukuran", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "Long", "Lat", "", "", "Suhu (°C)", "pH", "DO (mg/L)", "TDS (g/l)", "Sal (ppt)", "Kekeruhan (NTU)", "pHmV", "ORPmV", "mS/cm", "σt", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "NO3 (mg/L)", "NO3 (mg/L)", "P (mg/L)", "PO4 (mg/L)"],
    [1, "2026-07-28", -8.12977, 110.54748, "Pantai Baron", "12:00", 26.59, 8.57, 9.30, 18.6, 18.56, 6.1, -71, 122, 30.0, 10.7, 8.9, 2.0, 0.3, 0.8],
    [2, "2026-07-28", -8.13423, 110.55467, "Pantai Kukup", "14:02", 24.18, 8.86, 8.57, 28.7, 30.62, 0.3, -86, 97, 47.1, 20.4, 8.2, 1.9, 0.4, 1.2],
    [3, "2026-07-28", -8.13848, 110.57691, "Pantai Drini", "15:38", 25.08, 9.05, 9.48, 28.6, 30.53, 0.1, -96, 113, 47.0, 20.1, 7.9, 1.8, 0.0, 0.1],
  ]
  const wsLogbook = XLSX.utils.aoa_to_sheet(logbookData)
  XLSX.utils.book_append_sheet(wb, wsLogbook, "Logbook_Lapangan")

  // 2. Sheet: Template_Standar (Kolom Tabel Tunggal)
  const standardHeaders = [
    "record_code",
    "sampling_code",
    "data_source_type",
    "source_title",
    "source_url",
    "temperature_c",
    "ph",
    "dissolved_oxygen_mgl",
    "salinity_psu",
    "turbidity_ntu",
    "tds_gl",
    "conductivity_ms_cm",
    "ph_mv",
    "orp_mv",
    "sigma_t",
    "nitrate_no3_mgl",
    "nitrite_no2_mgl",
    "phosphorus_p_mgl",
    "phosphate_po4_mgl",
    "current_speed_ms",
    "depth_m",
    "notes",
  ]
  const standardRows = [
    standardHeaders,
    [
      "WQ-202607-001",
      "SMP-003",
      "Hasil Sampling",
      "",
      "",
      26.5,
      8.45,
      7.2,
      32.5,
      2.1,
      22.4,
      35.2,
      -75,
      115,
      15.2,
      5.4,
      0.8,
      0.25,
      0.65,
      0.35,
      1.5,
      "Pengukuran pesisir siang hari",
    ],
    [
      "WQ-202607-002",
      "",
      "Jurnal / Publikasi",
      "Jurnal Ilmu Kelautan (Prasetyo et al., 2024)",
      "https://doi.org/10.1016/j.jmarsys.2024.102345",
      27.1,
      8.38,
      6.9,
      33.1,
      1.8,
      23.1,
      36.0,
      -80,
      108,
      16.0,
      6.1,
      0.9,
      0.30,
      0.72,
      0.40,
      2.0,
      "Data sekunder dari jurnal ilmiah",
    ],
  ]
  const wsStandard = XLSX.utils.aoa_to_sheet(standardRows)
  XLSX.utils.book_append_sheet(wb, wsStandard, "Format_Standar")

  // 3. Sheet: Panduan Parameter
  const guideData = [
    ["Parameter", "Satuan", "Keterangan"],
    ["record_code", "Teks", "Kode unik pencatatan (opsional, otomatis dibuat jika kosong)"],
    ["sampling_code", "Teks", "Kode event sampling target (opsional jika sumber data dari Jurnal/Publikasi, e.g. SMP-001)"],
    ["data_source_type", "Teks", "Tipe sumber data: 'Hasil Sampling' atau 'Jurnal / Publikasi'"],
    ["source_title", "Teks", "Judul jurnal, nama artikel, atau nama sumber rujukan publikasi"],
    ["source_url", "Teks", "URL, DOI, atau link tautan referensi jurnal / publikasi ilmiah"],
    ["temperature_c / Suhu", "°C", "Suhu air laut"],
    ["ph", "Skala 0-14", "Derajat keasaman air laut"],
    ["dissolved_oxygen_mgl / DO", "mg/L", "Oksigen terlarut (Dissolved Oxygen)"],
    ["salinity_psu / Sal", "ppt / PSU", "Salinitas air laut"],
    ["turbidity_ntu / Kekeruhan", "NTU", "Tingkat kekeruhan air"],
    ["tds_gl / TDS", "g/L", "Total Dissolved Solids"],
    ["conductivity_ms_cm / mS/cm", "mS/cm", "Daya hantar listrik / konduktivitas"],
    ["ph_mv / pHmV", "mV", "Potensial elektroda pH dalam milivolt"],
    ["orp_mv / ORPmV", "mV", "Oxidation-Reduction Potential (potensial redoks)"],
    ["sigma_t / σt", "kg/m³", "Anomali densitas air laut (density anomaly)"],
    ["nitrate_no3_mgl / NO3", "mg/L", "Konsentrasi nitrat dalam air"],
    ["nitrite_no2_mgl / NO2", "mg/L", "Konsentrasi nitrit dalam air"],
    ["phosphorus_p_mgl / P", "mg/L", "Total fosfor dalam air"],
    ["phosphate_po4_mgl / PO4", "mg/L", "Konsentrasi ortofosfat dalam air"],
    ["current_speed_ms", "m/s", "Kecepatan arus permukaan air laut"],
    ["depth_m", "meter", "Kedalaman sensor/alat pengukuran"],
    ["notes", "Teks", "Catatan lapangan kondisi cuaca atau visual perairan"],
  ]
  const wsGuide = XLSX.utils.aoa_to_sheet(guideData)
  XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan_Parameter")

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Disposition": 'attachment; filename="Template_Kualitas_Air_JellyWatch.xlsx"',
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  })
}
