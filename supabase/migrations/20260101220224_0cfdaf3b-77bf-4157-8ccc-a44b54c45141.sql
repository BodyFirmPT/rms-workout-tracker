-- Add Pink to band_color and ankle-weight to band_type constraints
ALTER TABLE workout_exercise
DROP CONSTRAINT IF EXISTS band_color_check;

ALTER TABLE workout_exercise
ADD CONSTRAINT band_color_check 
CHECK (band_color IS NULL OR band_color IN ('Black', 'Blue', 'Purple', 'Red', 'Green', 'Yellow', 'Pink'));

ALTER TABLE workout_exercise
DROP CONSTRAINT IF EXISTS band_type_check;

ALTER TABLE workout_exercise
ADD CONSTRAINT band_type_check 
CHECK (band_type IS NULL OR band_type IN ('1-handle', '2-handle', 'flat', 'figure-8', 'double-leg-cuff', 'single-leg-cuff', 'ankle-weight'));