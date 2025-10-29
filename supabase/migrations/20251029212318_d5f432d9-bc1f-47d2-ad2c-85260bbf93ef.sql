-- Update the handle_new_user function to also create a client for the user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_trainer_id uuid;
  v_client_id uuid;
  v_full_name text;
BEGIN
  -- Get the full name from metadata
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.email);
  
  -- Create a trainer record with the user's name
  INSERT INTO public.trainer (name)
  VALUES (v_full_name)
  RETURNING id INTO v_trainer_id;
  
  -- Create a client record for the user with the same trainer
  INSERT INTO public.client (name, trainer_id)
  VALUES (v_full_name, v_trainer_id)
  RETURNING id INTO v_client_id;
  
  -- Insert user record with the new trainer_id and client_id
  INSERT INTO public.users (id, email, full_name, avatar_url, trainer_id, client_id)
  VALUES (
    new.id,
    new.email,
    v_full_name,
    new.raw_user_meta_data->>'avatar_url',
    v_trainer_id,
    v_client_id
  );
  
  RETURN new;
END;
$$;

-- Create a function to update client name when user profile updates
CREATE OR REPLACE FUNCTION public.sync_user_client_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update the client name if the user has a client_id
  IF NEW.client_id IS NOT NULL AND NEW.full_name IS NOT NULL THEN
    UPDATE public.client
    SET name = NEW.full_name
    WHERE id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync user name to client name
DROP TRIGGER IF EXISTS sync_user_client_name_trigger ON public.users;
CREATE TRIGGER sync_user_client_name_trigger
  AFTER UPDATE OF full_name ON public.users
  FOR EACH ROW
  WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name)
  EXECUTE FUNCTION public.sync_user_client_name();