/*
  # Fix infinite recursion in profiles RLS policies

  1. Remove problematic policies that cause infinite recursion
  2. Keep working policies for users managing their own data
  3. Add corrected admin policy using proper Supabase auth functions
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Enable insert for admin users" ON profiles;
DROP POLICY IF EXISTS "Enable read for admin users" ON profiles;
DROP POLICY IF EXISTS "Enable update for admin users" ON profiles;

-- Keep the working policies for users managing their own data
-- These don't cause recursion because they only check auth.uid() = id

-- The existing policies that work fine:
-- "Enable insert for authenticated users own profile" - (auth.uid() = id)
-- "Enable read for users own profile" - (auth.uid() = id)  
-- "Enable update for users own profile" - (auth.uid() = id)

-- Add a simple admin policy that doesn't cause recursion
-- This uses user metadata instead of querying the profiles table
CREATE POLICY "Enable admin access via metadata"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR auth.uid() = id
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR auth.uid() = id
  );