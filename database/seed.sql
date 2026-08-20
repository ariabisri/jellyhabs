-- =============================================================================
-- Initial Seed Data for JellyWatch Database
-- PostgreSQL 18 Compatible
-- =============================================================================

-- 1. ROLES
INSERT INTO roles (id, name, description, permissions) VALUES
('00000000-0000-0000-0000-000000000001', 'Admin', 'Administrator sistem dengan hak akses penuh', '{"all": true}'::jsonb),
('00000000-0000-0000-0000-000000000002', 'Peneliti', 'Peneliti/Analis data monitoring dan kejadian HABs', '{"read": true, "write": true, "delete": false}'::jsonb),
('00000000-0000-0000-0000-000000000003', 'Viewer', 'Pengguna publik / pengamat dengan akses baca saja', '{"read": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 2. USERS (Default password for all users: password123)
INSERT INTO users (id, full_name, email, password_hash, role_id, status) VALUES
('11111111-1111-1111-1111-111111111111', 'Aria Bisri, S.Kom, MT', 'aria@brin.go.id', '$2b$10$kjZ6Sk33C4fTbUCtWjuaO.KK3SMrNSWR2CBkAMZ5dNdeeCgy5I8vm', '00000000-0000-0000-0000-000000000001', 'aktif'),
('11111111-1111-1111-1111-111111111112', 'Dr. Hanung Agus Mulyadi', 'budi@brin.go.id', '$2b$10$kjZ6Sk33C4fTbUCtWjuaO.KK3SMrNSWR2CBkAMZ5dNdeeCgy5I8vm', '00000000-0000-0000-0000-000000000002', 'aktif'),
('11111111-1111-1111-1111-111111111113', 'Mochamad Ramdhan Firdhaus, M.Si', 'ramdhan@brin.go.id', '$2b$10$kjZ6Sk33C4fTbUCtWjuaO.KK3SMrNSWR2CBkAMZ5dNdeeCgy5I8vm', '00000000-0000-0000-0000-000000000002', 'aktif'),
('11111111-1111-1111-1111-111111111114', 'Nurul Fitriya, M.Si', 'nurul@brin.go.id', '$2b$10$kjZ6Sk33C4fTbUCtWjuaO.KK3SMrNSWR2CBkAMZ5dNdeeCgy5I8vm', '00000000-0000-0000-0000-000000000002', 'aktif'),
('11111111-1111-1111-1111-111111111115', 'Oksto Ridho Sianturi, M.Sc', 'oksto@brin.go.id', '$2b$10$kjZ6Sk33C4fTbUCtWjuaO.KK3SMrNSWR2CBkAMZ5dNdeeCgy5I8vm', '00000000-0000-0000-0000-000000000002', 'aktif')
ON CONFLICT (email) DO NOTHING;

-- 3. MONITORING STATIONS
INSERT INTO monitoring_stations (id, station_code, name, province, city, latitude, longitude, description, status) VALUES
('22222222-2222-2222-2222-222222222221', 'ST-01', 'Teluk Jakarta', 'DKI Jakarta', 'Jakarta Utara', -6.1000000, 106.8000000, 'Stasiun pemantauan utama pesisir utara Jakarta', 'aktif'),
('22222222-2222-2222-2222-222222222222', 'ST-02', 'Teluk Ambon', 'Maluku', 'Ambon', 3.7100000, 128.1300000, 'Stasiun pemantauan wilayah perairan Indonesia Timur', 'aktif'),
('22222222-2222-2222-2222-222222222223', 'ST-03', 'Pesisir Selatan Jawa', 'Jawa Tengah', 'Yogyakarta', -6.8000000, 109.6000000, 'Stasiun pemantauan pesisir selatan Samudra Hindia', 'aktif')
ON CONFLICT (station_code) DO NOTHING;

-- 4. SPECIES MASTER
INSERT INTO species_master (id, species_code, scientific_name, common_name, kingdom, phylum, organism_category, is_toxic, description) VALUES
('33333333-3333-3333-3333-333333333331', 'SPM-001', 'Pyrodinium bahamense', 'Dinoflagellata Merah', 'Chromista', 'Myzozoa', 'Fitoplankton', TRUE, 'Dinoflagellata penyebab utama PSP (Paralytic Shellfish Poisoning) dan fenomena red tide.'),
('33333333-3333-3333-3333-333333333332', 'SPM-002', 'Copepoda', 'Kopepoda', 'Animalia', 'Arthropoda', 'Zooplankton', FALSE, 'Zooplankton krustasea kecil yang menjadi pakan alami bagi organisme laut.'),
('33333333-3333-3333-3333-333333333333', 'SPM-003', 'Aurelia aurita', 'Ubur-ubur Bulan (Moon Jellyfish)', 'Animalia', 'Cnidaria', 'Ubur-ubur', FALSE, 'Spesies ubur-ubur kosmopolitan yang sering mengalami blooming di perairan pesisir.')
ON CONFLICT (species_code) DO NOTHING;

-- 5. SAMPLING EVENTS
INSERT INTO sampling_events (id, sampling_code, station_id, sampling_date, sampling_time, weather_condition, field_notes, recorded_by) VALUES
('44444444-4444-4444-4444-444444444441', 'SMP-001', '22222222-2222-2222-2222-222222222221', '2026-07-01', '08:30:00', 'Cerah', 'Air surut, arus tenang.', '11111111-1111-1111-1111-111111111112'),
('44444444-4444-4444-4444-444444444442', 'SMP-002', '22222222-2222-2222-2222-222222222222', '2026-07-02', '09:15:00', 'Berawan', 'Sedikit bergelombang.', '11111111-1111-1111-1111-111111111113'),
('44444444-4444-4444-4444-444444444443', 'SMP-003', '22222222-2222-2222-2222-222222222223', '2026-07-05', '10:00:00', 'Hujan Ringan', 'Kekeruhan air tinggi.', '11111111-1111-1111-1111-111111111114')
ON CONFLICT (sampling_code) DO NOTHING;

-- 6. SAMPLING EVENT MEMBERS
INSERT INTO sampling_event_members (sampling_event_id, user_id, role_in_sampling) VALUES
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111112', 'Ketua Tim'),
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111113', 'Analis Lapangan'),
('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111113', 'Ketua Tim'),
('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111114', 'Ketua Tim')
ON CONFLICT (sampling_event_id, user_id) DO NOTHING;

-- 7. WATER QUALITY RECORDS
INSERT INTO water_quality_records (id, record_code, sampling_event_id, temperature_c, salinity_psu, dissolved_oxygen_mgl, ph, chlorophyll_a_ugl, notes) VALUES
('77777777-7777-7777-7777-777777777771', 'WQ-101', '44444444-4444-4444-4444-444444444441', 29.50, 32.00, 5.40, 8.10, 12.50, 'Kualitas air normal'),
('77777777-7777-7777-7777-777777777772', 'WQ-102', '44444444-4444-4444-4444-444444444442', 28.10, 30.00, 6.00, 8.20, 8.20, 'Kondisi stabil'),
('77777777-7777-7777-7777-777777777773', 'WQ-103', '44444444-4444-4444-4444-444444444443', 30.20, 33.00, 4.80, 7.90, 45.00, 'Klorofil-a tinggi - indikasi blooming alga!')
ON CONFLICT (record_code) DO NOTHING;

-- 8. PLANKTON RECORDS
INSERT INTO plankton_records (id, record_code, sampling_event_id, species_id, density_value, density_unit, toxicity_status, morphological_notes) VALUES
('55555555-5555-5555-5555-555555555551', 'PLK-101', '44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 15000.00, 'sel/L', 'Beracun', 'Sel berikatan membentuk rantai pendek'),
('55555555-5555-5555-5555-555555555552', 'PLK-102', '44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332', 5000.00, 'ind/m³', 'Tidak', 'Dominansi stadium kopepodit'),
('55555555-5555-5555-5555-555555555553', 'JEL-103', '44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 200.00, 'ind/m²', 'Iritasi Ringan', 'Gumpalan ubur-ubur medusa terlihat di permukaan')
ON CONFLICT (record_code) DO NOTHING;

-- 9. BLOOM EVENTS
INSERT INTO bloom_events (id, event_code, station_id, event_start_date, event_end_date, event_type, severity_level, alert_status, description, impact_assessment, response_action, reported_by, validated_by, validated_at) VALUES
('66666666-6666-6666-6666-666666666661', 'EVT-202607-01', '22222222-2222-2222-2222-222222222221', '2026-07-02', '2026-07-10', 'Harmful Algal Blooms', 'tinggi', 'Siaga', 'Peningkatan drastis populasi Pyrodinium bahamense di perairan Teluk Jakarta.', 'Potensi kontaminasi kerang pesisir dan kematian ikan di tambak.', 'Pemasangan rambu peringatan dan pengambilan sampel intensif.', '11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP),
('66666666-6666-6666-6666-666666666662', 'EVT-202607-02', '22222222-2222-2222-2222-222222222223', '2026-07-03', NULL, 'Jellyfish Bloom', 'sedang', 'Waspada', 'Lonjakan populasi ubur-ubur Aurelia aurita mendadak di area perikanan tangkap.', 'Mengganggu jaring nelayan dan aktivitas wisata pantai.', 'Himbauan keselamatan bagi wisatawan dan koordinasi dinas kelautan.', '11111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP)
ON CONFLICT (event_code) DO NOTHING;

-- 10. EVENT REPORT SOURCES
INSERT INTO event_report_sources (bloom_event_id, source_type, source_title, source_url, notes) VALUES
('66666666-6666-6666-6666-666666666661', 'Paper/Jurnal', 'Harmful Algal Blooms Dynamics in Jakarta Bay', 'https://doi.org/10.1016/j.marpolbul.2025.1001', 'Studi referensi histori HABs Teluk Jakarta'),
('66666666-6666-6666-6666-666666666661', 'Laporan Lapangan', 'Laporan Tim Survei Lapangan BRIN Teluk Jakarta Juli 2026', 'https://jellywatch.org/docs/reports/SMP-001.pdf', 'Hasil pengujian laboratorium sampel air');

-- 11. BLOOM EVENT PLANKTON
INSERT INTO bloom_event_plankton (bloom_event_id, plankton_record_id, relationship_notes) VALUES
('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', 'Spesies dominan utama yang memicu alert status Siaga'),
('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555553', 'Spesies ubur-ubur yang mengalami blooming')
ON CONFLICT (bloom_event_id, plankton_record_id) DO NOTHING;

-- 12. BLOOM EVENT WATER QUALITY
INSERT INTO bloom_event_water_quality (bloom_event_id, water_quality_record_id, relationship_notes) VALUES
('66666666-6666-6666-6666-666666666661', '77777777-7777-7777-7777-777777777771', 'Klorofil-a 12.5 ug/L dan suhu 29.5°C mengindikasikan awal blooming alga'),
('66666666-6666-6666-6666-666666666662', '77777777-7777-7777-7777-777777777773', 'Klorofil-a ekstrem 45.0 ug/L dan DO rendah 4.8 mg/L memicu ledakan ubur-ubur')
ON CONFLICT (bloom_event_id, water_quality_record_id) DO NOTHING;

-- 13. DATASETS
INSERT INTO datasets (file_name, original_name, file_format, file_size_bytes, storage_path, description, uploaded_by, station_id, sampling_event_id) VALUES
('ds_01_teluk_jakarta_2025.csv', 'Data Kualitas Air Teluk Jakarta 2025.csv', 'CSV', 2621440, '/uploads/datasets/ds_01_teluk_jakarta_2025.csv', 'Data Kualitas Air Teluk Jakarta 2025 mentah', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441'),
('ds_02_habs_distribution.pdf', 'Laporan Distribusi Spesies HABs.pdf', 'PDF', 5347737, '/uploads/datasets/ds_02_habs_distribution.pdf', 'Laporan Distribusi Spesies HABs Indonesia 2026', '11111111-1111-1111-1111-111111111114', NULL, NULL);

