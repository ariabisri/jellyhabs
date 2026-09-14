-- Migration: Add extended water quality parameters (TDS, pH mV, ORP, Conductivity, Sigma-t, Nutrients)
-- To support comprehensive field marine logbooks (e.g. Logbook_kualitas_air.xlsx)

ALTER TABLE water_quality_records 
    ADD COLUMN IF NOT EXISTS tds_gl DECIMAL(8, 2),
    ADD COLUMN IF NOT EXISTS ph_mv DECIMAL(8, 2),
    ADD COLUMN IF NOT EXISTS orp_mv DECIMAL(8, 2),
    ADD COLUMN IF NOT EXISTS conductivity_ms_cm DECIMAL(8, 2),
    ADD COLUMN IF NOT EXISTS sigma_t DECIMAL(8, 2),
    ADD COLUMN IF NOT EXISTS nitrate_no3_mgl DECIMAL(8, 2),
    ADD COLUMN IF NOT EXISTS nitrite_no2_mgl DECIMAL(8, 2),
    ADD COLUMN IF NOT EXISTS phosphorus_p_mgl DECIMAL(8, 2),
    ADD COLUMN IF NOT EXISTS phosphate_po4_mgl DECIMAL(8, 2);

ALTER TABLE water_quality_records ALTER COLUMN record_code TYPE VARCHAR(50);
ALTER TABLE sampling_events ALTER COLUMN sampling_code TYPE VARCHAR(50);

