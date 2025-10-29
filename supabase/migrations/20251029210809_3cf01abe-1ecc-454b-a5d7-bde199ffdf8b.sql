-- Add client_id column to users table
ALTER TABLE public.users 
ADD COLUMN client_id uuid REFERENCES public.client(id) ON DELETE SET NULL;