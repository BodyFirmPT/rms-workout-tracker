-- Add muscle_group_id column to restricted_exercise table
ALTER TABLE public.restricted_exercise
ADD COLUMN muscle_group_id UUID REFERENCES public.muscle_group(id) ON DELETE CASCADE;

-- Create index for faster lookups by muscle group
CREATE INDEX idx_restricted_exercise_muscle_group_id ON public.restricted_exercise(muscle_group_id);