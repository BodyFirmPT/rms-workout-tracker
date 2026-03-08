
-- Create exercise_media table
CREATE TABLE public.exercise_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.workout_exercise(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercise_media ENABLE ROW LEVEL SECURITY;

-- RLS: Trainers can view their clients' exercise media
CREATE POLICY "Trainers can view their clients exercise media"
ON public.exercise_media FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM workout_exercise we
    JOIN workout w ON w.id = we.workout_id
    JOIN client c ON c.id = w.client_id
    JOIN users u ON u.trainer_id = c.trainer_id
    WHERE we.id = exercise_media.exercise_id AND u.id = auth.uid()
  )) OR has_role(auth.uid(), 'admin'::app_role)
);

-- RLS: Trainers can insert exercise media
CREATE POLICY "Trainers can insert exercise media"
ON public.exercise_media FOR INSERT
TO authenticated
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM workout_exercise we
    JOIN workout w ON w.id = we.workout_id
    JOIN client c ON c.id = w.client_id
    JOIN users u ON u.trainer_id = c.trainer_id
    WHERE we.id = exercise_media.exercise_id AND u.id = auth.uid()
  )) OR has_role(auth.uid(), 'admin'::app_role)
);

-- RLS: Trainers can update their clients' exercise media
CREATE POLICY "Trainers can update exercise media"
ON public.exercise_media FOR UPDATE
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM workout_exercise we
    JOIN workout w ON w.id = we.workout_id
    JOIN client c ON c.id = w.client_id
    JOIN users u ON u.trainer_id = c.trainer_id
    WHERE we.id = exercise_media.exercise_id AND u.id = auth.uid()
  )) OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM workout_exercise we
    JOIN workout w ON w.id = we.workout_id
    JOIN client c ON c.id = w.client_id
    JOIN users u ON u.trainer_id = c.trainer_id
    WHERE we.id = exercise_media.exercise_id AND u.id = auth.uid()
  )) OR has_role(auth.uid(), 'admin'::app_role)
);

-- RLS: Trainers can delete their clients' exercise media
CREATE POLICY "Trainers can delete exercise media"
ON public.exercise_media FOR DELETE
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM workout_exercise we
    JOIN workout w ON w.id = we.workout_id
    JOIN client c ON c.id = w.client_id
    JOIN users u ON u.trainer_id = c.trainer_id
    WHERE we.id = exercise_media.exercise_id AND u.id = auth.uid()
  )) OR has_role(auth.uid(), 'admin'::app_role)
);

-- RLS: Anyone can view media for shared workouts
CREATE POLICY "Anyone can view media for shared workouts"
ON public.exercise_media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_exercise we
    JOIN workout w ON w.id = we.workout_id
    WHERE we.id = exercise_media.exercise_id AND w.share_token IS NOT NULL
  )
);

-- Create index for fast lookups
CREATE INDEX idx_exercise_media_exercise_id ON public.exercise_media(exercise_id);
