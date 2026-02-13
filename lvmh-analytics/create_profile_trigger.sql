-- ============================================================================
-- PostgreSQL Trigger: Auto-create profile on user signup
-- ============================================================================
-- This trigger automatically creates a profile entry in the 'profiles' table
-- when a new user is created in auth.users.
--
-- Requirements:
-- - profiles.id = auth.users.id
-- - default role = 'sales'
-- - house_id = null
-- - created_at = now()
-- - No duplicate entries
-- ============================================================================

-- Step 1: Drop existing function if it exists (to allow re-creation)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, house_id, created_at)
  VALUES (
    NEW.id,
    'sales',  -- Default role as per requirements
    NULL,      -- house_id = null as per requirements
    NOW()      -- created_at = now() as per requirements
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate entries
  
  RETURN NEW;
END;
$$;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Grant necessary permissions
-- Ensure the function can be executed by the trigger system
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- ============================================================================
-- Verification Query (run after creating the trigger)
-- ============================================================================
-- To verify the trigger is working:
-- 1. Create a new user in Supabase Auth UI
-- 2. Run this query:
--
-- SELECT 
--   u.id,
--   u.email,
--   p.role,
--   p.house_id,
--   p.created_at
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id
-- ORDER BY u.created_at DESC
-- LIMIT 5;
-- ============================================================================
