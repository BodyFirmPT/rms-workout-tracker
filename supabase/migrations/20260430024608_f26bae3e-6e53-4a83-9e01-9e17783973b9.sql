-- Allow the new 'two_x_heavy' resistance level
ALTER TABLE workout_exercise DROP CONSTRAINT IF EXISTS workout_exercise_resistance_level_check;
ALTER TABLE workout_exercise ADD CONSTRAINT workout_exercise_resistance_level_check
  CHECK (resistance_level IS NULL OR resistance_level IN ('extra_light','light','medium','heavy','extra_heavy','two_x_heavy'));

ALTER TABLE client_band_mapping DROP CONSTRAINT IF EXISTS client_band_mapping_resistance_level_check;
ALTER TABLE client_band_mapping ADD CONSTRAINT client_band_mapping_resistance_level_check
  CHECK (resistance_level IN ('extra_light','light','medium','heavy','extra_heavy','two_x_heavy'));

-- Backfill bands
UPDATE workout_exercise SET
  band_category = 'band',
  resistance_level = CASE lower(band_color)
    WHEN 'white'  THEN 'extra_light'
    WHEN 'yellow' THEN 'light'
    WHEN 'green'  THEN 'medium'
    WHEN 'red'    THEN 'heavy'
    WHEN 'purple' THEN 'heavy'
    WHEN 'blue'   THEN 'extra_heavy'
    WHEN 'black'  THEN 'two_x_heavy'
    ELSE NULL
  END
WHERE band_color IS NOT NULL
  AND resistance_level IS NULL
  AND (band_type IS NULL OR band_type <> 'ankle-weight');

-- Backfill ankle-weights
UPDATE workout_exercise SET
  band_category = 'ankle_weight',
  resistance_level = CASE lower(band_color)
    WHEN 'green' THEN 'light'
    WHEN 'pink'  THEN 'medium'
    WHEN 'blue'  THEN 'medium'
    WHEN 'black' THEN 'heavy'
    ELSE NULL
  END
WHERE band_color IS NOT NULL
  AND resistance_level IS NULL
  AND band_type = 'ankle-weight';

-- Add unique constraint first so ON CONFLICT works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_band_mapping_unique'
  ) THEN
    ALTER TABLE client_band_mapping
      ADD CONSTRAINT client_band_mapping_unique
      UNIQUE (client_id, band_category, resistance_level);
  END IF;
END $$;

-- Per-client Purple override
INSERT INTO client_band_mapping (client_id, band_category, resistance_level, color_id)
SELECT DISTINCT w.client_id, 'band', 'heavy',
       (SELECT id FROM band_color_option WHERE name = 'Purple')
FROM workout_exercise we
JOIN workout w ON w.id = we.workout_id
WHERE lower(we.band_color) = 'purple'
  AND (we.band_type IS NULL OR we.band_type <> 'ankle-weight')
ON CONFLICT (client_id, band_category, resistance_level) DO NOTHING;