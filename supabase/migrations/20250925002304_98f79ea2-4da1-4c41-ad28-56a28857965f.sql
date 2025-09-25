-- Create trainer table
CREATE TABLE public.trainer (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client table
CREATE TABLE public.client (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trainer_id UUID NOT NULL REFERENCES public.trainer(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create muscle_group table
CREATE TABLE public.muscle_group (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  default_group BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout table
CREATE TABLE public.workout (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.client(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_exercise table
CREATE TABLE public.workout_exercise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workout(id) ON DELETE CASCADE,
  muscle_group_id UUID NOT NULL REFERENCES public.muscle_group(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  reps TEXT NOT NULL,
  unit TEXT NOT NULL,
  count INTEGER NOT NULL,
  note TEXT DEFAULT '',
  set_count INTEGER NOT NULL,
  completed_sets INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trainer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscle_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercise ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (since no auth required)
CREATE POLICY "Allow all operations on trainer" ON public.trainer FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on client" ON public.client FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on muscle_group" ON public.muscle_group FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on workout" ON public.workout FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on workout_exercise" ON public.workout_exercise FOR ALL USING (true) WITH CHECK (true);

-- Insert default muscle groups
INSERT INTO public.muscle_group (name, default_group) VALUES
  ('Chest', true),
  ('Back', true),
  ('Shoulders', true),
  ('Arms', true),
  ('Legs', true),
  ('Core', true);

-- Create sample trainer
INSERT INTO public.trainer (name) VALUES ('Demo Trainer');

-- Create sample client
INSERT INTO public.client (name, trainer_id) 
SELECT 'Demo Client', id FROM public.trainer WHERE name = 'Demo Trainer' LIMIT 1;