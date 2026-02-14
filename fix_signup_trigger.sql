
-- Drop the existing trigger first to ensure a clean state
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with robust NULL handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, photo_url)
  VALUES (
    new.id,
    new.email,
    -- Coalesce to ensure name is never NULL (falls back to email part)
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    -- Coalesce to ensure role is never NULL, cast to user_role
    COALESCE(new.raw_user_meta_data->>'role', 'PATIENT')::user_role,
    new.raw_user_meta_data->>'photo'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
