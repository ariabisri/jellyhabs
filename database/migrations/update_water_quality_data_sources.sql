-- Migration: Make sampling_event_id optional and add source data metadata (Journal Articles / Field Sampling)

ALTER TABLE water_quality_records
    ALTER COLUMN sampling_event_id DROP NOT NULL;

ALTER TABLE water_quality_records
    ADD COLUMN IF NOT EXISTS data_source_type VARCHAR(50) DEFAULT 'Hasil Sampling',
    ADD COLUMN IF NOT EXISTS source_title VARCHAR(500),
    ADD COLUMN IF NOT EXISTS source_url VARCHAR(1024);
