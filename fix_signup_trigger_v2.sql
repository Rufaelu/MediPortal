
-- Drop the function and trigger to be sure
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name text;
  v_role public.user_role;
BEGIN
  -- Determine name: use metadata or fall back to email prefix
  v_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  if v_name is null or v_name = '' then
    v_name := 'User';
  end if;

  -- Determine role: use metadata or default to PATIENT. Handle case conversion if needed.
  BEGIN
    v_role := (COALESCE(new.raw_user_meta_data->>'role', 'PATIENT'))::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'PATIENT'::public.user_role;
  END;

  -- Insert profile, handling potential conflicts safely
  INSERT INTO public.profiles (id, email, name, role, photo_url)
  VALUES (
    new.id,
    new.email,
    v_name,
    v_role,
    new.raw_user_meta_data->>'photo'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    photo_url = EXCLUDED.photo_url;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
