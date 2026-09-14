-- Migration: Add station_id, beach_id, latitude, longitude to water_quality_records

ALTER TABLE water_quality_records
ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES monitoring_stations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS beach_id UUID REFERENCES beaches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

-- Backfill station_id from sampling_events for existing records
UPDATE water_quality_records wq
SET station_id = se.station_id
FROM sampling_events se
WHERE wq.sampling_event_id = se.id
  AND wq.station_id IS NULL;
