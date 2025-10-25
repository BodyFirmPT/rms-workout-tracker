-- Add band-specific columns to workout_exercise table
ALTER TABLE workout_exercise 
ADD COLUMN IF NOT EXISTS band_color text,
ADD COLUMN IF NOT EXISTS band_type text;

-- Add check constraints for valid values
ALTER TABLE workout_exercise
DROP CONSTRAINT IF EXISTS band_color_check;

ALTER TABLE workout_exercise
ADD CONSTRAINT band_color_check 
CHECK (band_color IS NULL OR band_color IN ('Black', 'Blue', 'Purple', 'Red', 'Green', 'Yellow'));

ALTER TABLE workout_exercise
DROP CONSTRAINT IF EXISTS band_type_check;

ALTER TABLE workout_exercise
ADD CONSTRAINT band_type_check 
CHECK (band_type IS NULL OR band_type IN ('1-handle', '2-handle', 'flat', 'figure-8'));

-- Update type constraint to include both 'exercise' and 'weight' for backward compatibility
ALTER TABLE workout_exercise
DROP CONSTRAINT IF EXISTS workout_exercise_type_check;

ALTER TABLE workout_exercise
ADD CONSTRAINT workout_exercise_type_check 
CHECK (type IN ('exercise', 'weight', 'band', 'stretch'));