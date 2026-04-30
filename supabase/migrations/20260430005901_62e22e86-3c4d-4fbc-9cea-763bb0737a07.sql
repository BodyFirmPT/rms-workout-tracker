
-- Color palette
CREATE TABLE public.band_color_option (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  hex text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.band_color_option ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view band colors"
  ON public.band_color_option FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert band colors"
  ON public.band_color_option FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update band colors"
  ON public.band_color_option FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete band colors"
  ON public.band_color_option FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Per-client overrides
CREATE TABLE public.client_band_mapping (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  band_category text NOT NULL CHECK (band_category IN ('band','ankle_weight')),
  resistance_level text NOT NULL CHECK (resistance_level IN ('extra_light','light','medium','heavy','extra_heavy')),
  color_id uuid NOT NULL REFERENCES public.band_color_option(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, band_category, resistance_level)
);

ALTER TABLE public.client_band_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their clients' band mappings"
  ON public.client_band_mapping FOR SELECT
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    WHERE u.id = auth.uid() AND c.id = client_band_mapping.client_id
  )) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Trainers can insert their clients' band mappings"
  ON public.client_band_mapping FOR INSERT
  TO authenticated
  WITH CHECK ((EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    WHERE u.id = auth.uid() AND c.id = client_band_mapping.client_id
  )) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Trainers can update their clients' band mappings"
  ON public.client_band_mapping FOR UPDATE
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    WHERE u.id = auth.uid() AND c.id = client_band_mapping.client_id
  )) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    WHERE u.id = auth.uid() AND c.id = client_band_mapping.client_id
  )) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Trainers can delete their clients' band mappings"
  ON public.client_band_mapping FOR DELETE
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    WHERE u.id = auth.uid() AND c.id = client_band_mapping.client_id
  )) OR has_role(auth.uid(), 'admin'::app_role));

-- New columns on workout_exercise
ALTER TABLE public.workout_exercise
  ADD COLUMN resistance_level text,
  ADD COLUMN band_category text;

ALTER TABLE public.workout_exercise
  ADD CONSTRAINT workout_exercise_resistance_level_check
  CHECK (resistance_level IS NULL OR resistance_level IN ('extra_light','light','medium','heavy','extra_heavy'));

ALTER TABLE public.workout_exercise
  ADD CONSTRAINT workout_exercise_band_category_check
  CHECK (band_category IS NULL OR band_category IN ('band','ankle_weight'));

-- Seed default palette
INSERT INTO public.band_color_option (name, hex, sort_order) VALUES
  ('White',  '#ffffff', 10),
  ('Yellow', '#eab308', 20),
  ('Green',  '#22c55e', 30),
  ('Blue',   '#3b82f6', 40),
  ('Black',  '#374151', 50),
  ('Pink',   '#ec4899', 60),
  ('Red',    '#ef4444', 70),
  ('Purple', '#8b5cf6', 80)
ON CONFLICT (name) DO NOTHING;
