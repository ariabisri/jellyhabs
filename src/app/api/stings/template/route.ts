import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET() {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Template Data Laporan Korban
  const stingData = [
    [
      "No",
      "Tanggal",
      "Bulan",
      "Lokasi",
      "Jumlah Korban",
      "Nama Korban",
      "Umur",
      "Jenis Kelamin",
      "Tingkat Keparahan",
      "Penanganan",
    ],
    [
      1,
      15,
      "Juli",
      "Pantai Sepanjang",
      1,
      "Ahmad Fauzi",
      "24 tahun",
      "Laki-laki",
      "Ringan - Iritasi Kulit",
      "Dibilas air cuka/asam asetat dan kompres hangat oleh SAR",
    ],
    [
      2,
      16,
      "Juli",
      "Pantai Kukup",
      1,
      "Siti Rahma",
      "10 tahun",
      "Perempuan",
      "Sedang - Sesak & Kram",
      "Pertolongan pertama di Pos SAR dan dilarikan ke Puskesmas",
    ],
    [
      3,
      17,
      "Juli",
      "Pantai Baron",
      2,
      "Bambang & Rian",
      "Dewasa",
      "Laki-laki",
      "Ringan",
      "Diberikan salep luka bakar dan pengawasan medis",
    ],
  ]
  const wsStings = XLSX.utils.aoa_to_sheet(stingData)
  XLSX.utils.book_append_sheet(wb, wsStings, "2026")

  // Sheet 2: Panduan Pengisian
  const guideData = [
    ["Kolom", "Wajib / Opsional", "Keterangan & Format"],
    ["No", "Opsional", "Nomor urut catatan"],
    ["Tanggal", "Wajib", "Angka tanggal kejadian (1-31)"],
    ["Bulan", "Wajib", "Nama bulan kejadian (contoh: Januari, Februari, Juli, dll)"],
    ["Lokasi", "Wajib", "Nama pantai atau lokasi pesisir (contoh: Pantai Baron, Pantai Kukup)"],
    ["Jumlah Korban", "Wajib", "Angka jumlah korban dalam kejadian tersebut (minimal 1)"],
    ["Nama Korban", "Opsional", "Nama lengkap korban (atau inisial jika privasi)"],
    ["Umur", "Opsional", "Usia korban (contoh: 24 tahun, 8 tahun, Dewasa)"],
    ["Jenis Kelamin", "Opsional", "'Laki-laki' atau 'Perempuan'"],
    ["Tingkat Keparahan", "Opsional", "Kategori keparahan (Ringan, Sedang, Berat)"],
    ["Penanganan", "Opsional", "Catatan tindakan medis atau pertolongan pertama oleh tim SAR"],
  ]
  const wsGuide = XLSX.utils.aoa_to_sheet(guideData)
  XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan_Pengisian")

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Disposition": 'attachment; filename="Template_Laporan_Korban_Sengatan.xlsx"',
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  })
}
