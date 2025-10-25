-- Create location table
CREATE TABLE public.location (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.client(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.location(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add location_id to workout table
ALTER TABLE public.workout
ADD COLUMN location_id UUID REFERENCES public.location(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.location ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on location"
ON public.location
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on equipment"
ON public.equipment
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_location_client_id ON public.location(client_id);
CREATE INDEX idx_equipment_location_id ON public.equipment(location_id);
CREATE INDEX idx_workout_location_id ON public.workout(location_id);