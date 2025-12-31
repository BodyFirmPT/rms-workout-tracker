-- Update band_type constraint to include new cuff types
ALTER TABLE workout_exercise
DROP CONSTRAINT IF EXISTS band_type_check;

ALTER TABLE workout_exercise
ADD CONSTRAINT band_type_check 
CHECK (band_type IS NULL OR band_type IN ('1-handle', '2-handle', 'flat', 'figure-8', 'double-leg-cuff', 'single-leg-cuff'));