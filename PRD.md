PRODUCT REQUIREMENTS DOCUMENT (PRD)
JellyHABs-GIS
Sistem Informasi Monitoring Harmful Algal Blooms (HABs) dan Blooming Ubur-Ubur Berbahaya Berbasis WebGIS

Versi: 1.5 (Diperbarui: Master Data Pantai Binaan Stasiun & Refaktor Monitoring Sengatan)

1. Ringkasan Produk

JellyHABs-GIS adalah platform WebGIS berbasis web yang digunakan untuk mengelola, menyimpan, memvisualisasikan, dan menganalisis data monitoring ekosistem pesisir yang berkaitan dengan Harmful Algal Blooms (HABs) dan blooming ubur-ubur berbahaya.

Sistem dibangun sebagai aplikasi monolith menggunakan Next.js sehingga frontend, backend, autentikasi, dan akses database berada dalam satu codebase.

2. Tujuan Produk
Tujuan Utama
- Menyediakan basis data monitoring pesisir yang terintegrasi.
- Menampilkan data monitoring dalam bentuk dashboard dan WebGIS.
- Mendokumentasikan kejadian HABs dan blooming ubur-ubur serta dampaknya terhadap manusia (korban sengatan).
- Mendukung pengambilan keputusan berbasis data dan mitigasi risiko keselamatan wisata pesisir.
- Menjadi fondasi pengembangan model prediksi pada fase berikutnya.

3. Pengguna Sistem & Hak Akses (Access Control Rules)

3.1. Pengguna Tanpa Login (Public / Guest)
- **Hak Akses Read-Only**: Pengguna dapat melihat fitur visualisasi dan data monitoring (Dashboard, WebGIS, Stasiun Monitoring, Sampling Event, Kualitas Air, Plankton, HABs Events, Korban Sengatan, dan Dataset).
- **Pengsembunyian Tombol Mutasi (Add/Edit/Delete)**: Seluruh tombol/link aksi mutasi seperti "Tambah Stasiun", "Tambah Sampling", "Catat Kejadian", "Tambah Korban Sengatan", "Import Data", "Unggah Dataset", "Tambah Spesies", "Edit", dan "Hapus" DISEMBUNYIKAN SEPENUHNYA dari tampilan pengunjung publik.
- **Pengsembunyian Grup Menu "Sistem"**: Grup menu navigation **"Sistem"** (Manajemen Dataset & Manajemen Pengguna) DISEMBUNYIKAN SEPENUHNYA dari sidebar navigasi pengunjung publik.
- **Proteksi Halaman User Management**: Pengguna publik DILARANG mengakses modul Manajemen Pengguna (`/admin/users`) seluruhnya. Jika mencoba mengakses via URL langsung, sistem otomatis mengalihkan (redirect) ke halaman `/login`.
- **Status Header/Sidebar**: Jika tidak ada sesi login aktif, header dan sidebar menampilkan tombol/tautan **"Masuk / Login"**.

3.2. Peneliti (Researcher) & Administrator (Authenticated Users)
- **Peneliti**: Dapat melihat seluruh data, melakukan operasi penambahan/pengubahan data monitoring (Tambah/Edit Stasiun, Sampling Event, Kualitas Air, Plankton, HABs Events, Input & Import Korban Sengatan, Unggah Dataset), serta mengakses menu "Sistem" (Manajemen Dataset).
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

Event (Kejadian Blooming) & Dampak
- HABs Event
- Jellyfish Bloom Event
- Setiap event memiliki **rentang waktu** (tanggal mulai – tanggal selesai), bukan hanya 1 hari.
- Setiap event **berelasi dengan data kualitas air** (water_quality_records) yang relevan di periode dan stasiun yang sama.
- Setiap event juga **berelasi dengan data plankton** (plankton_records) yang tercatat selama periode kejadian.
- **Korban Sengatan Ubur-Ubur (Sting Records)**: Dokumentasi dampak nyata blooming terhadap keselamatan manusia, dapat diisi secara manual maupun import massal Excel (.xlsx/.csv), divisualisasikan pada Dashboard, WebGIS, dan terelasi dengan Jellyfish Bloom Events.

Visualisasi
- Dashboard (termasuk visualisasi tren dan statistik korban sengatan ubur-ubur)
- WebGIS (termasuk layer spasial sebaran hotspot korban sengatan per pantai)

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
- Login, Logout, Session Management, Dynamic Header & Sidebar

Modul 2 – Manajemen Pengguna (`/admin/users`)
Fitur:
- CRUD User & Role Guard Admin

Modul 3 – Event Kejadian Blooming (HABs & Jellyfish Bloom)
Data:
- Kode Kejadian, Stasiun Monitoring, Tanggal Mulai & Selesai, Tingkat Keparahan, Status Peringatan, Deskripsi, Dampak, Respon, Relasi Kualitas Air & Plankton

Modul 4 – Monitoring & Manajemen Korban Sengatan Ubur-Ubur (`/events/stings`) & Master Pantai (`beaches`)
Data:
- Tanggal & Waktu Kejadian
- Master Pantai Binaan (`beach_id`, FK ke tabel `beaches`)
- Lokasi Pantai (e.g. Kukup, Sepanjang, Krakal, Drini, Baron, Sundak, Pulang Sawal, Sadranan, dll.)
- Koordinat Geografis Pantai (Latitude / Longitude tersimpan di DB untuk WebGIS)
- Wilayah Administrasi Pantai (Kelurahan/Desa, Kecamatan, Kabupaten Gunungkidul)
- Posko Keamanan/SAR Linmas Pantai
- Relasi Stasiun Pantau (`station_id`, FK ke `monitoring_stations`) & Bloom Event (`bloom_event_id`, opsional)
- Jumlah Korban, Nama Korban, Usia, Jenis Kelamin (Laki-laki / Perempuan)
- Tingkat Keparahan / Gejala & Catatan Penanganan Medis / Pertolongan Pertama
- Pelapor (User)

Fitur:
- Master Data Pantai (`/api/beaches`): CRUD data pantai binaan stasiun pengamatan laut
- Tab "Pantai Binaan" di halaman detail stasiun (`/monitoring/stations/[id]`) yang merangkum sebaran pantai, posko SAR, dan akumulasi insiden sengatan
- Form Input Manual (Tambah/Edit/Hapus) dengan dropdown berelasi (*cascading*) dinamis nama stasiun (tanpa ID) dan daftar pantai terkait
- Filter interaktif dengan judul kategori eksplisit: Stasiun Pengamatan, Tahun Kejadian, Bulan Kejadian, Nama Pantai, dan Pencarian Kata Kunci
- Bulk Import data dari format Excel (.xlsx) / CSV dengan target stasiun binaan
- Ekspor data CSV untuk pelaporan
- Visualisasi ringkasan KPI & integrasi chart pada Dashboard
- Layer hotspot interaktif pada WebGIS

Acceptance Criteria:
- Data sengatan dan pantai dapat diakses publik secara read-only.
- Peneliti/Admin dapat menambahkan data secara manual atau import via file Excel `.xlsx`.
- Dropdown form input menampilkan nama stasiun murni tanpa ID teknis.
- Data tersambung ke WebGIS sebagai layer hotspot per pantai dengan georeferensi akurat dari tabel `beaches`.
- Detail Stasiun Monitoring menampilkan tab "Pantai Binaan" lengkap dengan statistik insiden.
- Detail Jellyfish Bloom Event dapat menampilkan data korban sengatan terkait.

7. Model Data — Catatan Penting

7.1 Tabel `bloom_events` (Kejadian Blooming)
- Menggunakan `event_start_date DATE NOT NULL` dan `event_end_date DATE`.

7.2 Junction Table `bloom_event_water_quality`
- Relasi Many-to-Many antara `bloom_events` dan `water_quality_records`.

7.3 Junction Table `bloom_event_plankton`
- Relasi Many-to-Many antara `bloom_events` dan `plankton_records`.

7.4 Tabel `sting_records` (BARU)
- Menyimpan rekaman insiden sengatan ubur-ubur terhadap manusia di pesisir pantai.
- Berelasi opsional ke `bloom_events(id)` untuk menghubungkan insiden ke kejadian blooming aktif.
- Berelasi opsional ke `monitoring_stations(id)` untuk analisis korelasi dengan stasiun pemantau terdekat.
- Kolom: `id`, `incident_date`, `incident_time`, `location_name`, `latitude`, `longitude`, `station_id`, `bloom_event_id`, `victim_count`, `victim_name`, `victim_age`, `victim_gender`, `severity_level`, `treatment_notes`, `reported_by`, `created_at`, `updated_at`.

8. Definisi Keberhasilan MVP
MVP dianggap berhasil apabila:
- Data monitoring dan data korban sengatan dapat diakses secara publik (Read-only) tanpa login.
- Operasi mutasi data (Add/Edit/Delete/Import) dan Manajemen Pengguna dilindungi autentikasi.
- Tampilan UI secara bersih menyembunyikan tombol aksi mutasi dan menu sensitif untuk Pengunjung / Guest.
- Data korban sengatan dapat diinput manual dan diimpor dari file Excel.
- Dashboard dan WebGIS menampilkan statistik dan layer spasial hotspot korban sengatan.
- Sistem berhasil di-deploy pada VPS Ubuntu menggunakan Next.js, PostgreSQL/PostGIS, PM2, dan Nginx.