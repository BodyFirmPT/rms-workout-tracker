-- Add new columns for the improved exercise data model
ALTER TABLE workout_exercise 
ADD COLUMN reps_count INTEGER,
ADD COLUMN reps_unit TEXT DEFAULT 'reps',
ADD COLUMN weight_count DECIMAL(8,2),
ADD COLUMN weight_unit TEXT DEFAULT 'lbs';

-- Migrate existing data
-- For exercises with unit 'reps', move count to reps_count and set weight to 0
UPDATE workout_exercise 
SET 
  reps_count = CASE 
    WHEN unit = 'reps' THEN CAST(reps AS INTEGER)
    WHEN unit IN ('seconds', 'minutes') THEN CAST(reps AS INTEGER)
    ELSE CAST(reps AS INTEGER)
  END,
  reps_unit = CASE 
    WHEN unit IN ('reps', 'seconds', 'minutes') THEN unit
    ELSE 'reps'
  END,
  weight_count = CASE 
    WHEN unit IN ('lbs', 'kg') THEN count
    ELSE 0
  END,
  weight_unit = CASE 
    WHEN unit IN ('lbs', 'kg') THEN unit
    ELSE 'lbs'
  END
WHERE reps_count IS NULL;

-- Make new columns non-nullable after migration
ALTER TABLE workout_exercise 
ALTER COLUMN reps_count SET NOT NULL,
ALTER COLUMN reps_unit SET NOT NULL,
ALTER COLUMN weight_count SET NOT NULL,
ALTER COLUMN weight_unit SET NOT NULL;

-- Remove old columns after successful migration
-- We'll keep them for now and remove in a separate migration if needed
-- ALTER TABLE workout_exercise DROP COLUMN reps;
-- ALTER TABLE workout_exercise DROP COLUMN unit; 
-- ALTER TABLE workout_exercise DROP COLUMN count;