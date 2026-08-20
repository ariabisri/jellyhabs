-- =============================================================================
-- Database Schema for JellyWatch (PostgreSQL 18 & Standard PostgreSQL Compatible)
-- Automatically adapts if PostGIS extension is installed or not.
-- =============================================================================

-- Try enabling PostGIS extension if installed on the server
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS extension not found on server. Using standard Lat/Lng and GeoJSON columns.';
END $$;

-- Enable pgcrypto for gen_random_uuid() (built-in on PG13+)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Reusable function to automatically update updated_at timestamp columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. ROLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif', 'suspended')),
    avatar_url VARCHAR(512),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. MONITORING STATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS monitoring_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add PostGIS geography column conditionally if PostGIS type exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geography') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='monitoring_stations' AND column_name='geom'
        ) THEN
            ALTER TABLE monitoring_stations ADD COLUMN geom GEOGRAPHY(Point, 4326);
        END IF;
    END IF;
END $$;

-- Trigger to auto-update PostGIS geom if PostGIS exists
CREATE OR REPLACE FUNCTION update_station_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geography') THEN
        EXECUTE 'SELECT ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography' 
        INTO NEW.geom 
        USING NEW.longitude, NEW.latitude;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stations_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON monitoring_stations
FOR EACH ROW
EXECUTE FUNCTION update_station_geom();

CREATE TRIGGER trg_stations_updated_at
BEFORE UPDATE ON monitoring_stations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. SAMPLING EVENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sampling_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sampling_code VARCHAR(20) NOT NULL UNIQUE,
    station_id UUID NOT NULL REFERENCES monitoring_stations(id) ON DELETE CASCADE,
    sampling_date DATE NOT NULL,
    sampling_time TIME,
    weather_condition VARCHAR(50),
    field_notes TEXT,
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_sampling_events_updated_at
BEFORE UPDATE ON sampling_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. SAMPLING EVENT MEMBERS (Multi-Peneliti)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sampling_event_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sampling_event_id UUID NOT NULL REFERENCES sampling_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_in_sampling VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_sampling_event_member UNIQUE (sampling_event_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 6. SPECIES MASTER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS species_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species_code VARCHAR(20) NOT NULL UNIQUE,
    scientific_name VARCHAR(255) NOT NULL,
    common_name VARCHAR(255),
    kingdom VARCHAR(100),
    phylum VARCHAR(100),
    class_name VARCHAR(100),
    order_name VARCHAR(100),
    family VARCHAR(100),
    genus VARCHAR(100),
    organism_category VARCHAR(30) NOT NULL CHECK (organism_category IN ('Fitoplankton', 'Zooplankton', 'Ubur-ubur')),
    is_toxic BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    image_url VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_species_master_updated_at
BEFORE UPDATE ON species_master
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 7. WATER QUALITY RECORDS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS water_quality_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_code VARCHAR(20) NOT NULL UNIQUE,
    sampling_event_id UUID NOT NULL REFERENCES sampling_events(id) ON DELETE CASCADE,
    temperature_c DECIMAL(5, 2),
    salinity_psu DECIMAL(5, 2),
    dissolved_oxygen_mgl DECIMAL(5, 2),
    ph DECIMAL(4, 2),
    chlorophyll_a_ugl DECIMAL(8, 2),
    turbidity_ntu DECIMAL(7, 2),
    current_speed_ms DECIMAL(5, 2),
    depth_m DECIMAL(6, 2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_water_quality_updated_at
BEFORE UPDATE ON water_quality_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 8. PLANKTON RECORDS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plankton_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_code VARCHAR(20) NOT NULL UNIQUE,
    sampling_event_id UUID NOT NULL REFERENCES sampling_events(id) ON DELETE CASCADE,
    species_id UUID NOT NULL REFERENCES species_master(id) ON DELETE RESTRICT,
    density_value DECIMAL(12, 2) NOT NULL,
    density_unit VARCHAR(30) NOT NULL,
    toxicity_status VARCHAR(30) NOT NULL,
    morphological_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_plankton_records_updated_at
BEFORE UPDATE ON plankton_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 9. BLOOM EVENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bloom_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_code VARCHAR(30) NOT NULL UNIQUE,
    station_id UUID NOT NULL REFERENCES monitoring_stations(id) ON DELETE CASCADE,
    event_start_date DATE NOT NULL,
    event_end_date DATE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Harmful Algal Blooms', 'Jellyfish Bloom')),
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('rendah', 'sedang', 'tinggi', 'kritis')),
    alert_status VARCHAR(20) NOT NULL CHECK (alert_status IN ('Normal', 'Waspada', 'Siaga', 'Darurat')),
    description TEXT,
    impact_assessment TEXT,
    response_action TEXT,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,
    affected_area_geojson JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add PostGIS affected_area column conditionally if PostGIS type exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geography') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='bloom_events' AND column_name='affected_area'
        ) THEN
            ALTER TABLE bloom_events ADD COLUMN affected_area GEOGRAPHY(Polygon, 4326);
        END IF;
    END IF;
END $$;

CREATE TRIGGER trg_bloom_events_updated_at
BEFORE UPDATE ON bloom_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 10. EVENT REPORT SOURCES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_report_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bloom_event_id UUID NOT NULL REFERENCES bloom_events(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_title VARCHAR(500) NOT NULL,
    source_url VARCHAR(1024),
    document_path VARCHAR(512),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 11. BLOOM EVENT PLANKTON (Junction Many-to-Many)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bloom_event_plankton (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bloom_event_id UUID NOT NULL REFERENCES bloom_events(id) ON DELETE CASCADE,
    plankton_record_id UUID NOT NULL REFERENCES plankton_records(id) ON DELETE CASCADE,
    relationship_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_bloom_event_plankton UNIQUE (bloom_event_id, plankton_record_id)
);

-- -----------------------------------------------------------------------------
-- 12. BLOOM EVENT WATER QUALITY (Junction Many-to-Many)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bloom_event_water_quality (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bloom_event_id UUID NOT NULL REFERENCES bloom_events(id) ON DELETE CASCADE,
    water_quality_record_id UUID NOT NULL REFERENCES water_quality_records(id) ON DELETE CASCADE,
    relationship_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_bloom_event_water_quality UNIQUE (bloom_event_id, water_quality_record_id)
);

-- -----------------------------------------------------------------------------
-- 13. DATASETS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_format VARCHAR(10) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    station_id UUID REFERENCES monitoring_stations(id) ON DELETE SET NULL,
    sampling_event_id UUID REFERENCES sampling_events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE & SPATIAL QUERIES
-- =============================================================================

-- Spatial Indexes (Conditionally if PostGIS exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geography') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_stations_geom ON monitoring_stations USING GIST (geom)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bloom_affected_area ON bloom_events USING GIST (affected_area)';
    END IF;
END $$;

-- Unique Code Lookup Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_stations_code ON monitoring_stations (station_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sampling_code ON sampling_events (sampling_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wq_code ON water_quality_records (record_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_plankton_code ON plankton_records (record_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bloom_code ON bloom_events (event_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_species_code ON species_master (species_code);

-- Date Filter Indexes
CREATE INDEX IF NOT EXISTS idx_sampling_date ON sampling_events (sampling_date DESC);
CREATE INDEX IF NOT EXISTS idx_bloom_event_start_date ON bloom_events (event_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_bloom_event_end_date ON bloom_events (event_end_date DESC);

-- Alert & Category Filter Indexes
CREATE INDEX IF NOT EXISTS idx_bloom_alert_status ON bloom_events (alert_status);
CREATE INDEX IF NOT EXISTS idx_species_scientific ON species_master (scientific_name);
CREATE INDEX IF NOT EXISTS idx_species_category ON species_master (organism_category);

-- Foreign Key Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role_id);
CREATE INDEX IF NOT EXISTS idx_sampling_station ON sampling_events (station_id);
CREATE INDEX IF NOT EXISTS idx_sampling_recorder ON sampling_events (recorded_by);
CREATE INDEX IF NOT EXISTS idx_wq_sampling ON water_quality_records (sampling_event_id);
CREATE INDEX IF NOT EXISTS idx_plankton_sampling ON plankton_records (sampling_event_id);
CREATE INDEX IF NOT EXISTS idx_plankton_species ON plankton_records (species_id);
CREATE INDEX IF NOT EXISTS idx_bloom_station ON bloom_events (station_id);
CREATE INDEX IF NOT EXISTS idx_bloom_reporter ON bloom_events (reported_by);
CREATE INDEX IF NOT EXISTS idx_bloom_validator ON bloom_events (validated_by);
CREATE INDEX IF NOT EXISTS idx_report_sources_event ON event_report_sources (bloom_event_id);
CREATE INDEX IF NOT EXISTS idx_bloom_plankton_event ON bloom_event_plankton (bloom_event_id);
CREATE INDEX IF NOT EXISTS idx_bloom_plankton_record ON bloom_event_plankton (plankton_record_id);
CREATE INDEX IF NOT EXISTS idx_bloom_wq_event ON bloom_event_water_quality (bloom_event_id);
CREATE INDEX IF NOT EXISTS idx_bloom_wq_record ON bloom_event_water_quality (water_quality_record_id);
CREATE INDEX IF NOT EXISTS idx_datasets_uploader ON datasets (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_datasets_station ON datasets (station_id);
CREATE INDEX IF NOT EXISTS idx_datasets_sampling ON datasets (sampling_event_id);

