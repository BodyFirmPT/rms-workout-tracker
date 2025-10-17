-- Create injury table
CREATE TABLE public.injury (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.client(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.injury ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on injury"
ON public.injury
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index on client_id for better query performance
CREATE INDEX idx_injury_client_id ON public.injury(client_id);