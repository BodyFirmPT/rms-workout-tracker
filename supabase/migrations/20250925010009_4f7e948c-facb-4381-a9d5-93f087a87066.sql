-- Insert default muscle groups
INSERT INTO public.muscle_group (name, default_group) VALUES
  ('Chest', true),
  ('Back', true),
  ('Shoulders', true),
  ('Arms', true),
  ('Legs', true),
  ('Core', true),
  ('Cardio', true)
ON CONFLICT (name) DO UPDATE SET default_group = EXCLUDED.default_group;