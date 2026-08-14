PRODUCT REQUIREMENTS DOCUMENT (PRD)
JellyHABs-GIS
Sistem Informasi Monitoring Harmful Algal Blooms (HABs) dan Blooming Ubur-Ubur Berbahaya Berbasis WebGIS

Versi: 1.0

1. Ringkasan Produk

JellyHABs-GIS adalah platform WebGIS berbasis web yang digunakan untuk mengelola, menyimpan, memvisualisasikan, dan menganalisis data monitoring ekosistem pesisir yang berkaitan dengan Harmful Algal Blooms (HABs) dan blooming ubur-ubur berbahaya.

Sistem dibangun sebagai aplikasi monolith menggunakan Next.js sehingga frontend, backend, autentikasi, dan akses database berada dalam satu codebase.

2. Tujuan Produk
Tujuan Utama
Menyediakan basis data monitoring pesisir yang terintegrasi.
Menampilkan data monitoring dalam bentuk dashboard dan WebGIS.
Mendokumentasikan kejadian HABs dan blooming ubur-ubur.
Mendukung pengambilan keputusan berbasis data.
Menjadi fondasi pengembangan model prediksi pada fase berikutnya.
3. Pengguna Sistem
Administrator

Hak akses:

Manajemen pengguna
Manajemen data master
Validasi dataset
Melihat seluruh data
Peneliti

Hak akses:

Mengelola data monitoring
Upload dataset
Mengelola sampling event
Mengakses dashboard
Publik

Hak akses:

Dashboard publik
WebGIS publik
Riwayat kejadian
4. Ruang Lingkup MVP

Fitur yang wajib tersedia:

Authentication
Login
Logout
Role Management
Monitoring
Stasiun Monitoring
Sampling Event
Kualitas Air
Fitoplankton
Zooplankton
Ubur-Ubur
Event
HABs Event
Jellyfish Bloom Event
Visualisasi
Dashboard
WebGIS
Dataset
Upload CSV
Download CSV
Riwayat Upload
5. Teknologi
Frontend
Next.js 15+
TypeScript
Tailwind CSS
Shadcn/UI
React Hook Form
Zod
Backend
Next.js Route Handlers
Server Actions
Drizzle ORM
Database
PostgreSQL
PostGIS
Peta
React Leaflet
OpenStreetMap
Visualisasi
Apache ECharts
Authentication
Auth.js
Deployment
Ubuntu VPS
Nginx
PM2
6. Modul Sistem
Modul 1 – Authentication

Fitur:

Login
Logout
Session Management
Password Reset

Acceptance Criteria:

Pengguna berhasil login.
Session tersimpan aman.
Hak akses sesuai role.
Modul 2 – Manajemen Pengguna

Data:

Nama
Email
Role
Status

Fitur:

Tambah
Edit
Nonaktifkan

Acceptance Criteria:

Admin dapat mengelola seluruh pengguna.
Modul 3 – Stasiun Monitoring

Data:

Kode Stasiun
Nama Stasiun
Provinsi
Kabupaten/Kota
Latitude
Longitude
Deskripsi

Fitur:

CRUD
Tampilkan pada peta

Acceptance Criteria:

Stasiun muncul pada WebGIS.
Modul 4 – Sampling Event

Data:

Tanggal Sampling
Lokasi
Cuaca
Catatan

Fitur:

CRUD

Acceptance Criteria:

Event terhubung dengan stasiun monitoring.
Modul 5 – Monitoring Kualitas Air

Parameter:

Suhu
Salinitas
pH
Dissolved Oxygen
Klorofil-a
Nitrat
Nitrit
Fosfat
Silikat
TSS

Fitur:

Input Manual
Upload CSV
Grafik Tren

Acceptance Criteria:

Data tersimpan berdasarkan event.
Modul 6 – Monitoring Fitoplankton

Data:

Spesies
Kelimpahan
Status Toksik

Fitur:

CRUD
Upload CSV

Acceptance Criteria:

Data dapat divisualisasikan.
Modul 7 – Monitoring Zooplankton

Data:

Spesies
Kelimpahan

Fitur:

CRUD

Acceptance Criteria:

Data dapat difilter.
Modul 8 – Monitoring Ubur-Ubur

Data:

Spesies
Biomassa
Densitas
Bell Diameter

Fitur:

CRUD

Acceptance Criteria:

Data dapat divisualisasikan.
Modul 9 – HABs Event

Data:

Lokasi
Tanggal
Tingkat Keparahan
Deskripsi
Foto

Fitur:

CRUD

Acceptance Criteria:

Event muncul pada peta.
Modul 10 – Jellyfish Bloom Event

Data:

Lokasi
Tanggal
Tingkat Keparahan
Deskripsi
Foto

Fitur:

CRUD

Acceptance Criteria:

Event muncul pada peta.
Modul 11 – Dashboard

Komponen:

Statistik
Total Stasiun
Total Sampling
Total HABs
Total Blooming Ubur-Ubur
Grafik
Tren Kualitas Air
Tren Fitoplankton
Distribusi Kejadian
Distribusi Lokasi

Acceptance Criteria:

Dashboard dimuat < 3 detik.
Modul 12 – WebGIS

Layer:

Stasiun Monitoring
Kualitas Air
HABs Event
Jellyfish Event

Fitur:

Zoom
Pan
Filter
Layer Toggle
Popup Informasi

Acceptance Criteria:

Data spasial dapat ditampilkan dengan benar.
Modul 13 – Dataset Management

Fitur:

Upload CSV
Download CSV
Validasi Dataset
Riwayat Upload

Acceptance Criteria:

Dataset dapat ditelusuri dan diekspor kembali.
7. Struktur Halaman
Publik
Beranda
Tentang Sistem
Dashboard Publik
WebGIS Publik
Riwayat Kejadian
Peneliti
Dashboard
Sampling Event
Monitoring Kualitas Air
Monitoring Plankton
Monitoring Ubur-Ubur
Dataset
Administrator
Dashboard Admin
User Management
Master Data
Audit Log
8. Kebutuhan Non-Fungsional
Performa
API Response < 1 detik
Dashboard < 3 detik
Keamanan
Auth.js Authentication
Password Hashing
HTTPS
Input Validation dengan Zod
Ketersediaan
Backup Database Harian
Uptime ≥ 99%
Skalabilitas
Mendukung migrasi ke Docker pada fase berikutnya
Mendukung integrasi AI Service terpisah
9. Roadmap Pengembangan
Sprint 1
Setup Next.js
PostgreSQL
Drizzle ORM
Authentication
Sprint 2
User Management
Monitoring Station
Sprint 3
Sampling Event
Sprint 4
Water Quality
Sprint 5
Phytoplankton
Zooplankton
Jellyfish
Sprint 6
HABs Event
Jellyfish Bloom Event
Sprint 7
Dashboard
Sprint 8
WebGIS
Sprint 9
Dataset Management
Sprint 10
Deploy ke VPS
10. Definisi Keberhasilan MVP

MVP dianggap berhasil apabila:

Data monitoring dapat diinput dan dikelola.
Data dapat divisualisasikan pada dashboard.
Data dapat divisualisasikan pada WebGIS.
Pengguna dapat melakukan pencarian dan filter data.
Sistem berhasil di-deploy pada VPS Ubuntu menggunakan Next.js, PostgreSQL/PostGIS, PM2, dan Nginx.
Sistem siap dikembangkan menuju modul prediksi HABs dan blooming ubur-ubur pada fase berikutnya.
Catatan Arsitektur

Versi MVP menggunakan arsitektur monolith Next.js. Integrasi Docker, layanan AI Python, atau pemisahan service menjadi microservice berada di luar ruang lingkup versi pertama dan dapat dipertimbangkan pada fase pengembangan lanjutan.