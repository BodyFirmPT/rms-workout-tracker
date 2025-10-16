-- Add workout_count_offset column to client table
ALTER TABLE public.client
ADD COLUMN workout_count_offset integer NOT NULL DEFAULT 0;