PRODUCT REQUIREMENTS DOCUMENT (PRD)
JellyHABs-GIS
Sistem Informasi Monitoring Harmful Algal Blooms (HABs) dan Blooming Ubur-Ubur Berbahaya Berbasis WebGIS

Versi: 1.1 (Diperbarui: Akses Read-only Publik, Proteksi User Management & Header Session)

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
- **Hak Akses Read-Only**: Pengguna dapat melihat seluruh fitur visualisasi dan data monitoring (Dashboard, WebGIS, Stasiun Monitoring, Sampling Event, Kualitas Air, Plankton, HABs Events, dan Dataset).
- **Pembatasan Aksi Mutasi Data**: Pengguna publik DILARANG melakukan operasi penambahan (Add), pengubahan (Edit), maupun penghapusan (Delete) data. Tombol aksi mutasi disembunyikan/dibatasi.
- **Pembatasan Modul User Management**: Pengguna publik DILARANG mengakses modul Manajemen Pengguna (`/admin/users`) seluruhnya, termasuk akses baca (Read). Akses ke halaman ini wajib dialihkan (redirect) ke halaman `/login`.
- **Status Header/Sidebar**: Jika tidak ada sesi login aktif, header dan sidebar TIDAK BOLEH menampilkan data pengguna default/dummy. Harus menampilkan tombol/tautan **"Masuk / Login"**.

3.2. Peneliti (Researcher)
- Hak akses penuh untuk membaca data monitoring.
- Mengelola data monitoring (Tambah, Edit, Upload dataset, Sampling Event).
- Mengakses Dashboard & WebGIS interaktif.

3.3. Administrator
- Hak akses penuh untuk seluruh modul sistem.
- Mengelola modul Manajemen Pengguna (`/admin/users`) seluruhnya.
- Manajemen data master & validasi dataset.
- Mengubah role dan status pengguna.

4. Ruang Lingkup MVP

Fitur yang wajib tersedia:

Authentication & Access Control
- Login & Logout
- Session Management (HTTP-only Cookie JWT)
- Header/Sidebar Session Dynamic Display (Nama user login vs Link Login jika Guest)
- Public Read-Only Access (Tanpa login dapat melihat fitur monitoring)
- Route Guard Proteksi Modul User Management (`/admin/users`)

Monitoring
- Stasiun Monitoring
- Sampling Event
- Kualitas Air
- Fitoplankton
- Zooplankton
- Ubur-Ubur

Event
- HABs Event
- Jellyfish Bloom Event

Visualisasi
- Dashboard
- WebGIS

Dataset
- Upload CSV/File
- Download CSV/File
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
- Pengguna Guest tidak tercatat sebagai user tertentu saat mengakses dashboard.
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

7. Definisi Keberhasilan MVP
MVP dianggap berhasil apabila:
- Data monitoring dapat diakses secara publik (Read-only) tanpa login.
- Operasi mutasi data (Add/Edit/Delete) dan Manajemen Pengguna dilindungi autentikasi.
- Header & Sidebar mencerminkan status sesi pengguna dengan benar.
- Sistem berhasil di-deploy pada VPS Ubuntu menggunakan Next.js, PostgreSQL/PostGIS, PM2, dan Nginx.