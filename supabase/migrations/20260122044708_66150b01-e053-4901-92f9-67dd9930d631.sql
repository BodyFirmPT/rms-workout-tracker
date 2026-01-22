-- Add share_token column to workout table for public sharing
ALTER TABLE public.workout 
ADD COLUMN share_token text UNIQUE;

-- Create index on share_token for fast lookups
CREATE INDEX idx_workout_share_token ON public.workout(share_token) WHERE share_token IS NOT NULL;

-- Add RLS policy to allow public read access via share token
CREATE POLICY "Anyone can view workout with valid share token" 
ON public.workout 
FOR SELECT 
USING (share_token IS NOT NULL);

-- Add policy to allow public update of workout status (start workout)
CREATE POLICY "Anyone can start workout with share token" 
ON public.workout 
FOR UPDATE 
USING (share_token IS NOT NULL AND status IN ('draft', 'started'))
WITH CHECK (share_token IS NOT NULL AND status IN ('draft', 'started', 'completed'));

-- Add policy to workout_exercise for public read access when workout has share token
CREATE POLICY "Anyone can view exercises for shared workouts" 
ON public.workout_exercise 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.workout 
  WHERE workout.id = workout_exercise.workout_id 
  AND workout.share_token IS NOT NULL
));

-- Add policy to workout_exercise for public update (complete sets) when workout has share token  
CREATE POLICY "Anyone can complete sets for shared workouts" 
ON public.workout_exercise 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.workout 
  WHERE workout.id = workout_exercise.workout_id 
  AND workout.share_token IS NOT NULL
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workout 
  WHERE workout.id = workout_exercise.workout_id 
  AND workout.share_token IS NOT NULL
));