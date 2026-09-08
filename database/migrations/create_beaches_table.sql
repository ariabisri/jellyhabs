-- Migration: Create beaches table and associate with monitoring_stations and sting_records

CREATE TABLE IF NOT EXISTS beaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES monitoring_stations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    village VARCHAR(100),
    subdistrict VARCHAR(100),
    regency VARCHAR(100) DEFAULT 'Gunungkidul',
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    sar_post_name VARCHAR(150),
    description TEXT,
    status VARCHAR(20) DEFAULT 'aktif', -- 'aktif' | 'nonaktif'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_beach_station_name UNIQUE(station_id, name)
);

CREATE INDEX IF NOT EXISTS idx_beaches_station_id ON beaches(station_id);
CREATE INDEX IF NOT EXISTS idx_beaches_name ON beaches(name);
CREATE INDEX IF NOT EXISTS idx_beaches_status ON beaches(status);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_beaches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_beaches_updated_at ON beaches;
CREATE TRIGGER trg_beaches_updated_at
    BEFORE UPDATE ON beaches
    FOR EACH ROW
    EXECUTE FUNCTION update_beaches_updated_at();

-- Add beach_id to sting_records if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sting_records' AND column_name = 'beach_id'
    ) THEN
        ALTER TABLE sting_records ADD COLUMN beach_id UUID REFERENCES beaches(id) ON DELETE SET NULL;
        CREATE INDEX idx_sting_records_beach_id ON sting_records(beach_id);
    END IF;
END $$;
