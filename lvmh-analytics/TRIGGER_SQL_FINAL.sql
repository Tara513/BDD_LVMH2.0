-- ============================================================================
-- PostgreSQL Trigger: Auto-create profile on user signup
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- 
-- This trigger automatically creates a profile entry in the 'profiles' table
-- when a new user is created in auth.users.
--
-- Requirements met:
-- ✅ profiles.id = auth.users.id
-- ✅ default role = 'sales'
-- ✅ house_id = null
-- ✅ created_at = now()
-- ✅ No duplicate entries (ON CONFLICT DO NOTHING)
-- ✅ Proper foreign key constraint (via profiles.id references auth.users.id)
-- ✅ Safe function definition (SECURITY DEFINER with search_path)
-- ============================================================================

-- Step 1: Drop existing function and trigger (safe to run multiple times)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

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
    NEW.id,           -- profiles.id = auth.users.id
    'sales',          -- default role = 'sales'
    NULL,             -- house_id = null
    NOW()             -- created_at = now()
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate entries
  
  RETURN NEW;
END;
$$;

-- Step 3: Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script, verify the trigger works:
--
-- 1. Create a new user in Supabase Dashboard → Authentication → Users
-- 2. Run this verification query:
--
-- SELECT 
--   u.id,
--   u.email,
--   u.created_at as user_created_at,
--   p.role,
--   p.house_id,
--   p.created_at as profile_created_at
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id
-- ORDER BY u.created_at DESC
-- LIMIT 5;
--
-- Expected result: New users should have a corresponding profile with:
-- - role = 'sales'
-- - house_id = NULL
-- - created_at = timestamp of user creation
-- ============================================================================
