-- Add column to store the raw import data for each exercise
ALTER TABLE workout_exercise ADD COLUMN IF NOT EXISTS raw_import_data text;