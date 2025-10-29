-- Drop existing function first
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate function with trainer creation logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_trainer_id uuid;
  v_full_name text;
BEGIN
  -- Get the full name from metadata
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.email);
  
  -- Create a trainer record with the user's name
  INSERT INTO public.trainer (name)
  VALUES (v_full_name)
  RETURNING id INTO v_trainer_id;
  
  -- Insert user record with the new trainer_id
  INSERT INTO public.users (id, email, full_name, avatar_url, trainer_id)
  VALUES (
    new.id,
    new.email,
    v_full_name,
    new.raw_user_meta_data->>'avatar_url',
    v_trainer_id
  );
  
  RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();