-- Migration: Add data source metadata to sting_records (Issue #65)
-- Sumber data: 'Hasil Sampling' | 'Referensi Jurnal' | 'Berita' | 'Laporan Instansi'

ALTER TABLE sting_records
    ADD COLUMN IF NOT EXISTS data_source_type VARCHAR(50) DEFAULT 'Hasil Sampling',
    ADD COLUMN IF NOT EXISTS sampling_event_id UUID REFERENCES sampling_events(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS source_title VARCHAR(500),
    ADD COLUMN IF NOT EXISTS source_url VARCHAR(1024);

CREATE INDEX IF NOT EXISTS idx_sting_records_data_source_type ON sting_records (data_source_type);
CREATE INDEX IF NOT EXISTS idx_sting_records_sampling_event_id ON sting_records (sampling_event_id);
