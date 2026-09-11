import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { query } from "@/lib/db"

export async function GET() {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Template_Plankton
  const planktonData = [
    [
      "record_code",
      "sampling_code",
      "species_code",
      "density_value",
      "density_unit",
      "toxicity_status",
      "morphological_notes",
    ],
    [
      "PLK-2026-001",
      "SMP-001",
      "SP-01",
      15400,
      "sel/L",
      "Toksik (PSP)",
      "Bentuk rantai oval, rantai 4-8 sel teramati di bawah mikroskop",
    ],
    [
      "PLK-2026-002",
      "SMP-001",
      "SP-02",
      8200,
      "sel/L",
      "Toksik (NSP)",
      "Gerakan berputar cepat khas dinoflagellata",
    ],
    [
      "PLK-2026-003",
      "SMP-003",
      "SP-04",
      120,
      "ind/m3",
      "Sangat Berbahaya",
      "Spesimen ubur-ubur Physalia physalis warna biru keunguan dengan tentakel panjang",
    ],
  ]
  const wsPlankton = XLSX.utils.aoa_to_sheet(planktonData)
  XLSX.utils.book_append_sheet(wb, wsPlankton, "Template_Plankton")

  // Sheet 2: Daftar Spesies Master Referensi
  try {
    const spRes = await query<{ species_code: string; scientific_name: string; common_name: string; organism_category: string }>(
      `SELECT species_code, scientific_name, common_name, organism_category FROM species_master ORDER BY species_code`
    )
    const spRows = [
      ["Kode Spesies (species_code)", "Nama Ilmiah", "Nama Lokal", "Kategori"],
      ...spRes.rows.map((s) => [s.species_code, s.scientific_name, s.common_name || "-", s.organism_category]),
    ]
    const wsSpecies = XLSX.utils.aoa_to_sheet(spRows)
    XLSX.utils.book_append_sheet(wb, wsSpecies, "Daftar_Spesies_Referensi")
  } catch {
    // fallback
  }

  // Sheet 3: Panduan
  const guideData = [
    ["Kolom", "Wajib / Opsional", "Keterangan"],
    ["record_code", "Opsional", "Kode unik pencatatan (e.g. PLK-001), otomatis dibuat jika kosong"],
    ["sampling_code", "Wajib", "Kode event sampling target tempat sampel diambil (e.g. SMP-001)"],
    ["species_code", "Wajib", "Kode spesies master (lihat tab 'Daftar_Spesies_Referensi') atau nama ilmiah"],
    ["density_value", "Wajib", "Angka kelimpahan / kepadatan organisme (contoh: 15400)"],
    ["density_unit", "Wajib", "Satuan kepadatan (e.g. sel/L, sel/mL, ind/m3, koloni/L)"],
    ["toxicity_status", "Wajib", "Keterangan toksisitas (e.g. Toksik, Non-toksik, Beracun, Sangat Berbahaya)"],
    ["morphological_notes", "Opsional", "Catatan visual mikroskopis atau kondisi spesimen"],
  ]
  const wsGuide = XLSX.utils.aoa_to_sheet(guideData)
  XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan_Pengisian")

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Disposition": 'attachment; filename="Template_Plankton_UburUbur.xlsx"',
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  })
}
