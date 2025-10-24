-- Add late_cancelled field to workout table
ALTER TABLE public.workout 
ADD COLUMN late_cancelled boolean DEFAULT false;