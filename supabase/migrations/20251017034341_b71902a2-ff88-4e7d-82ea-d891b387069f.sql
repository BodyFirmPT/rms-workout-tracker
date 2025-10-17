-- Add workout_count_offset to injury table
ALTER TABLE injury ADD COLUMN workout_count_offset integer NOT NULL DEFAULT 0;