# Panduan Instalasi & Eksekusi Database JellyWatch (PostgreSQL 18)

Direktori ini berisi skrip DDL SQL (`schema.sql`) dan data awal (`seed.sql`) untuk aplikasi **JellyWatch** yang kompatibel dengan **PostgreSQL 18** dan **PostGIS**.

---

## 📋 Prasyarat

1. **PostgreSQL 18** sudah terinstall.
2. **Ekstensi PostGIS** sudah terinstall pada lingkungan server/mesin PostgreSQL.

---

## 🚀 Langkah-Langkah Eksekusi Database

### 1. Buat Database Baru

Buka terminal / Command Prompt atau `psql`, lalu jalankan:

```sql
CREATE DATABASE jellywatch_db;
```

### 2. Eksekusi Skrip Schema (`schema.sql`)

Jalankan skrip pembentukan tabel, trigger, dan indeks pada database `jellywatch_db`:

#### Menggunakan `psql` (CLI):

```bash
psql -U postgres -d jellywatch_db -f database/schema.sql
```

> **Catatan:** Skrip `schema.sql` akan mengaktifkan ekstensi `postgis` dan `pgcrypto`, membuat 12 tabel beserta constraint `FOREIGN KEY`, `CHECK`, trigger pembaruan `geom` & `updated_at`, serta seluruh indeks performa & spatial GIST.

---

### 3. Eksekusi Skrip Data Awal (`seed.sql`)

Jalankan skrip data awal (master role, pengguna, stasiun monitoring, spesies, sampling, records, events, dan datasets):

#### Menggunakan `psql` (CLI):

```bash
psql -U postgres -d jellywatch_db -f database/seed.sql
```

---

## 🗂️ Struktur Tabel (12 Entitas)

1. `roles` — Master hak akses pengguna
2. `users` — Pengguna sistem (Admin, Peneliti, Viewer)
3. `monitoring_stations` — Stasiun pemantauan pesisir & laut (dengan PostGIS `geom`)
4. `sampling_events` — Log pengambilan sampel lapangan
5. `sampling_event_members` — Multi-peneliti yang terlibat dalam sampling
6. `species_master` — Master taksonomi fitoplankton, zooplankton, dan ubur-ubur
7. `water_quality_records` — Parameter fisik-kimia air laut (Suhu, Salinitas, DO, pH, Klorofil-a)
8. `plankton_records` — Kepadatan dan toksisitas spesies hasil sampling
9. `bloom_events` — Peringatan kejadian HABs & Jellyfish Bloom (dengan PostGIS `affected_area`)
10. `event_report_sources` — Sumber referensi kejadian (Paper/Jurnal, Satelit, Laporan)
11. `bloom_event_plankton` — Hubungan M:N kejadian bloom dengan record plankton
12. `datasets` — Manajemen berkas publikasi dan data mentah
