PRODUCT REQUIREMENTS DOCUMENT (PRD)
JellyHABs-GIS
Sistem Informasi Monitoring Harmful Algal Blooms (HABs) dan Blooming Ubur-Ubur Berbahaya Berbasis WebGIS

Versi: 1.3 (Diperbarui: Koreksi Model Event — Rentang Waktu & Relasi Kualitas Air)

1. Ringkasan Produk

JellyHABs-GIS adalah platform WebGIS berbasis web yang digunakan untuk mengelola, menyimpan, memvisualisasikan, dan menganalisis data monitoring ekosistem pesisir yang berkaitan dengan Harmful Algal Blooms (HABs) dan blooming ubur-ubur berbahaya.

Sistem dibangun sebagai aplikasi monolith menggunakan Next.js sehingga frontend, backend, autentikasi, dan akses database berada dalam satu codebase.

2. Tujuan Produk
Tujuan Utama
- Menyediakan basis data monitoring pesisir yang terintegrasi.
- Menampilkan data monitoring dalam bentuk dashboard dan WebGIS.
- Mendokumentasikan kejadian HABs dan blooming ubur-ubur.
- Mendukung pengambilan keputusan berbasis data.
- Menjadi fondasi pengembangan model prediksi pada fase berikutnya.

3. Pengguna Sistem & Hak Akses (Access Control Rules)

3.1. Pengguna Tanpa Login (Public / Guest)
- **Hak Akses Read-Only**: Pengguna dapat melihat fitur visualisasi dan data monitoring (Dashboard, WebGIS, Stasiun Monitoring, Sampling Event, Kualitas Air, Plankton, HABs Events, dan Dataset).
- **Pengsembunyian Tombol Mutasi (Add/Edit/Delete)**: Seluruh tombol/link aksi mutasi seperti "Tambah Stasiun", "Tambah Sampling", "Catat Kejadian", "Unggah Dataset", "Tambah Spesies", "Edit", dan "Hapus" DISEMBUNYIKAN SEPENUHNYA dari tampilan pengunjung publik.
- **Pengsembunyian Grup Menu "Sistem"**: Grup menu navigation **"Sistem"** (Manajemen Dataset & Manajemen Pengguna) DISEMBUNYIKAN SEPENUHNYA dari sidebar navigasi pengunjung publik.
- **Proteksi Halaman User Management**: Pengguna publik DILARANG mengakses modul Manajemen Pengguna (`/admin/users`) seluruhnya. Jika mencoba mengakses via URL langsung, sistem otomatis mengalihkan (redirect) ke halaman `/login`.
- **Status Header/Sidebar**: Jika tidak ada sesi login aktif, header dan sidebar menampilkan tombol/tautan **"Masuk / Login"**.

3.2. Peneliti (Researcher) & Administrator (Authenticated Users)
- **Peneliti**: Dapat melihat seluruh data, melakukan operasi penambahan/pengubahan data monitoring (Tambah/Edit Stasiun, Sampling Event, Kualitas Air, Plankton, HABs Events, Unggah Dataset), serta mengakses menu "Sistem" (Manajemen Dataset).
- **Administrator**: Memiliki hak akses penuh untuk seluruh modul sistem, termasuk Manajemen Pengguna (`/admin/users`) dan pengaturan role/otoritas.

4. Ruang Lingkup MVP

Fitur yang wajib tersedia:

Authentication & Access Control
- Login & Logout
- Session Management (HTTP-only Cookie JWT)
- Header/Sidebar Session Dynamic Display (Nama user login vs Link Login jika Guest)
- Selective UI Hiding (Sembunyikan Menu Sistem & Tombol Tambah/Edit/Hapus untuk Guest)
- Public Read-Only Access (Tanpa login dapat melihat fitur monitoring)
- Route Guard Proteksi Modul User Management (`/admin/users`)

Monitoring
- Stasiun Monitoring
- Sampling Event
- Kualitas Air
- Fitoplankton
- Zooplankton
- Ubur-Ubur

Event (Kejadian Blooming)
- HABs Event
- Jellyfish Bloom Event
- Setiap event memiliki **rentang waktu** (tanggal mulai – tanggal selesai), bukan hanya 1 hari.
- Setiap event **berelasi dengan data kualitas air** (water_quality_records) yang relevan di periode dan stasiun yang sama, karena parameter lingkungan (suhu, klorofil-a, DO, pH, salinitas, dsb.) merupakan faktor pemicu dan indikator terjadinya blooming.
- Setiap event juga **berelasi dengan data plankton** (plankton_records) yang tercatat selama periode kejadian.

Visualisasi
- Dashboard
- WebGIS

Dataset
- Upload CSV/File (Logged-in only)
- Download CSV/File (Public)
- Riwayat Upload

5. Teknologi
Frontend
- Next.js 15+ / 16+
- TypeScript
- Tailwind CSS
- Shadcn/UI
- React Hook Form
- Zod

Backend
- Next.js Route Handlers
- Server Actions
- PostgreSQL Pool (`pg`) / Drizzle ORM

Database
- PostgreSQL 18
- PostGIS

Peta
- React Leaflet / Leaflet
- OpenStreetMap

Visualisasi
- Apache ECharts / ECharts for React

Authentication & Session
- JWT (jose) & HTTP-only Cookies
- bcryptjs Password Hashing

6. Modul Sistem
Modul 1 – Authentication & Session Header
Fitur:
- Login
- Logout
- Session Management
- Password Reset
- Header & Sidebar Session Display: Menampilkan nama user login jika terautentikasi, atau link "Masuk" jika Guest.

Acceptance Criteria:
- Pengguna berhasil login.
- Session tersimpan aman di HTTP-only cookie.
- Pengguna Guest tidak dapat melihat tombol Tambah/Edit/Hapus maupun grup menu "Sistem".
- Header menampilkan nama user asli jika login, atau link "Masuk" jika Guest.

Modul 2 – Manajemen Pengguna (`/admin/users`)
Data:
- Nama
- Email
- Role
- Status

Fitur:
- Tambah
- Edit
- Hapus / Nonaktifkan

Acceptance Criteria:
- HANYA Admin terautentikasi yang dapat mengakses modul ini.
- Pengguna Guest atau non-login dialihkan ke `/login`.

Modul 3 – Event Kejadian Blooming (HABs & Jellyfish Bloom)
Data:
- Kode Kejadian
- Stasiun Monitoring
- Tanggal Mulai Kejadian (`event_start_date`)
- Tanggal Selesai Kejadian (`event_end_date`)
- Jenis Kejadian (Harmful Algal Blooms / Jellyfish Bloom)
- Tingkat Keparahan (rendah, sedang, tinggi, kritis)
- Status Peringatan (Normal, Waspada, Siaga, Darurat)
- Deskripsi, Dampak, dan Tindakan Respon
- Pelapor & Validator

Relasi Data:
- **Kualitas Air**: Setiap event berelasi dengan satu atau lebih data kualitas air (`water_quality_records`) yang tercatat pada periode dan stasiun yang sama. Parameter lingkungan seperti suhu, klorofil-a, DO, pH, dan salinitas merupakan faktor pemicu dan indikator terjadinya blooming. Relasi ini dikelola melalui junction table `bloom_event_water_quality`.
- **Plankton**: Setiap event berelasi dengan satu atau lebih data plankton (`plankton_records`) yang tercatat selama periode kejadian, melalui junction table `bloom_event_plankton`.

Acceptance Criteria:
- Kejadian blooming dicatat dengan **rentang waktu** (tanggal mulai dan tanggal selesai), bukan hanya satu tanggal.
- Saat mencatat/mengedit kejadian, pengguna dapat mengaitkan data kualitas air dan data plankton yang relevan.
- Data event menampilkan informasi parameter lingkungan terkait untuk mendukung analisis penyebab.

7. Model Data — Catatan Penting

7.1 Tabel `bloom_events` (Kejadian Blooming)
- Kolom `event_date` **DIGANTI** menjadi dua kolom: `event_start_date DATE NOT NULL` dan `event_end_date DATE` (nullable, karena kejadian mungkin masih berlangsung).
- Kejadian blooming berlangsung dalam **rentang waktu tertentu** (hari hingga minggu), bukan hanya 1 hari.

7.2 Junction Table `bloom_event_water_quality` (BARU)
- Relasi Many-to-Many antara `bloom_events` dan `water_quality_records`.
- Menghubungkan kejadian blooming dengan data parameter lingkungan laut yang relevan.
- Kolom: `bloom_event_id`, `water_quality_record_id`, `relationship_notes`.

7.3 Junction Table `bloom_event_plankton` (Sudah ada)
- Relasi Many-to-Many antara `bloom_events` dan `plankton_records`.
- Menghubungkan kejadian blooming dengan data kepadatan spesies terkait.

8. Definisi Keberhasilan MVP
MVP dianggap berhasil apabila:
- Data monitoring dapat diakses secara publik (Read-only) tanpa login.
- Operasi mutasi data (Add/Edit/Delete) dan Manajemen Pengguna dilindungi autentikasi.
- Tampilan UI secara bersih menyembunyikan tombol aksi mutasi dan menu sensitif untuk Pengunjung / Guest.
- Header & Sidebar mencerminkan status sesi pengguna dengan benar.
- Kejadian blooming tercatat dengan rentang waktu (tanggal mulai–selesai) dan terelasi dengan data kualitas air serta data plankton.
- Sistem berhasil di-deploy pada VPS Ubuntu menggunakan Next.js, PostgreSQL/PostGIS, PM2, dan Nginx.