-- Add status column to workout table with enum-like values
ALTER TABLE public.workout 
ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' 
CHECK (status IN ('draft', 'started', 'completed'));

-- Migrate existing data: active workouts become 'started', inactive become 'draft'
UPDATE public.workout 
SET status = CASE 
  WHEN is_active = true THEN 'started'
  ELSE 'draft'
END;

-- Remove the old is_active column
ALTER TABLE public.workout DROP COLUMN is_active;