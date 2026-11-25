import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

/**
 * Template unduhan laporan korban sengatan ubur-ubur.
 * Struktur mengikuti format resmi lapangan `db_korban.xlsx`:
 * - Header 2 baris (merge vertikal) dengan kolom "Jenis Kelamin" dipecah
 *   menjadi sub-kolom "Laki-laki" dan "Perempuan" (berisi jumlah korban).
 * - Tahun kejadian, stasiun pengamatan, dan sumber data diisi pada form upload.
 */
export async function GET() {
  const wb = XLSX.utils.book_new()

  const header1 = [
    "No",
    "Bulan Kejadian",
    "Tanggal Kejadian",
    "Lokasi Pantai",
    "Jumlah Korban",
    "Nama Korban",
    "Umur",
    "Jenis Kelamin",
    "",
  ]
  const header2 = ["", "", "", "", "", "", "", "Laki-laki", "Perempuan"]

  const examples = [
    [1, "Juni", 10, "Pantai Sepanjang", 1, "Azalia", "7 tahun", "", 1],
    [2, "Juni", 10, "Pantai Drini", 1, "Riza Alfian", "10 tahun", 1, ""],
    [3, "Juli", 15, "Pantai Krakal", 2, "-", "-", 2, ""],
    [4, "Juli", 15, "Pantai Kukup", 3, "-", "-", 2, 1],
  ]

  const ws = XLSX.utils.aoa_to_sheet([header1, header2, ...examples])

  ws["!merges"] = [
    // Kolom A-G merge vertikal (baris 1-2)
    ...Array.from({ length: 7 }, (_, c) => ({ s: { r: 0, c }, e: { r: 1, c } })),
    // "Jenis Kelamin" merge horizontal (H1:I1)
    { s: { r: 0, c: 7 }, e: { r: 0, c: 8 } },
  ]

  ws["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 16 },
    { wch: 24 },
    { wch: 14 },
    { wch: 24 },
    { wch: 12 },
    { wch: 11 },
    { wch: 11 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Data Korban")

  const guideData = [
    ["Kolom", "Wajib / Opsional", "Keterangan & Format"],
    ["No", "Opsional", "Nomor urut catatan"],
    ["Bulan Kejadian", "Wajib", "Nama bulan (Januari s.d. Desember) atau angka 1-12"],
    ["Tanggal Kejadian", "Wajib", "Angka tanggal kejadian (1-31)"],
    ["Lokasi Pantai", "Wajib", "Nama pantai (contoh: Pantai Drini, Pantai Kukup, Pantai Baron)"],
    ["Jumlah Korban", "Wajib", "Jumlah korban pada kejadian tersebut (minimal 1)"],
    ["Nama Korban", "Opsional", "Nama korban, isi '-' jika tidak diketahui"],
    ["Umur", "Opsional", "Usia korban (contoh: 7 tahun), isi '-' jika tidak diketahui"],
    ["Jenis Kelamin - Laki-laki", "Opsional", "Jumlah korban laki-laki (angka)"],
    ["Jenis Kelamin - Perempuan", "Opsional", "Jumlah korban perempuan (angka)"],
    [],
    ["Catatan Penting"],
    ["1. Jangan mengubah dua baris header (baris 1 dan 2)."],
    ["2. Hapus baris contoh sebelum mengisi data Anda."],
    ["3. Tahun kejadian, stasiun pengamatan, dan sumber data (Hasil Sampling / Jurnal / Berita / Laporan Instansi) dipilih pada form upload."],
    ["4. Jika kolom Laki-laki dan Perempuan sama-sama terisi, data akan dipecah menjadi dua catatan sesuai jumlah per jenis kelamin."],
  ]
  const wsGuide = XLSX.utils.aoa_to_sheet(guideData)
  wsGuide["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 70 }]
  XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan Pengisian")

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Disposition": 'attachment; filename="Template_Data_Korban_Sengatan.xlsx"',
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  })
}
