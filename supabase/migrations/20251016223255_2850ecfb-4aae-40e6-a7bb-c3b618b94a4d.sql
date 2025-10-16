-- Add type column to workout_exercise table
ALTER TABLE workout_exercise 
ADD COLUMN type text NOT NULL DEFAULT 'exercise'
CHECK (type IN ('exercise', 'stretch'));