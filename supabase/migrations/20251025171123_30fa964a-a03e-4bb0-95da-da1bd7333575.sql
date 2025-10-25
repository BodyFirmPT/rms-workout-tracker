-- Create junction table for many-to-many relationship between clients and locations
CREATE TABLE public.client_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.location(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id, location_id)
);

-- Enable RLS on the new table
ALTER TABLE public.client_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for client_locations
CREATE POLICY "Allow all operations on client_locations" 
ON public.client_locations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Migrate existing data from location.client_id to client_locations
INSERT INTO public.client_locations (client_id, location_id)
SELECT client_id, id FROM public.location WHERE client_id IS NOT NULL;

-- Remove the client_id column from location table
ALTER TABLE public.location DROP COLUMN client_id;