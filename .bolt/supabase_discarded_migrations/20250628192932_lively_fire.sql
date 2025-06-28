/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current admin policies cause infinite recursion by checking profiles table within profiles policies
    - When checking if user is admin, it queries profiles table which triggers the same policy

  2. Solution
    - Drop existing problematic policies
    - Create new policies that avoid recursion
    - Use a different approach for admin checks or simplify the logic

  3. Changes
    - Remove recursive admin policies
    - Keep simple user-owns-data policies
    - Add a separate admin bypass using service role or simpler logic
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Enable insert for admin users" ON profiles;
DROP POLICY IF EXISTS "Enable read for admin users" ON profiles;
DROP POLICY IF EXISTS "Enable update for admin users" ON profiles;

-- Keep the working policies for users managing their own data
-- These don't cause recursion because they only check auth.uid() = id

-- The existing policies that work fine:
-- "Enable insert for authenticated users own profile" - (uid() = id)
-- "Enable read for users own profile" - (uid() = id)  
-- "Enable update for users own profile" - (uid() = id)

-- Add a simple admin policy that doesn't cause recursion
-- This uses user metadata instead of querying the profiles table
CREATE POLICY "Enable admin access via metadata"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR uid() = id
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR uid() = id
  );