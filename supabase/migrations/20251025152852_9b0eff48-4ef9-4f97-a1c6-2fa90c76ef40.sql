-- Create restricted_exercise table
CREATE TABLE public.restricted_exercise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.client(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restricted_exercise ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations
CREATE POLICY "Allow all operations on restricted_exercise"
ON public.restricted_exercise
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups by client
CREATE INDEX idx_restricted_exercise_client_id ON public.restricted_exercise(client_id);