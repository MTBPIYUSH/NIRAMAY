/*
  # Fix RLS policies for profiles table

  1. Security Updates
    - Drop existing problematic policies that reference users table
    - Create simplified RLS policies that work with Supabase auth
    - Enable proper access for authenticated users to their own profiles
    - Allow profile creation during signup process

  2. Changes
    - Remove policies that depend on users table access
    - Add basic authenticated user policies for CRUD operations
    - Ensure users can only access their own profile data
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Admins can read ward profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new simplified policies that work with Supabase auth
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create admin policies that check role from auth metadata instead of users table
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR 
    (auth.uid() = id)
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR 
    (auth.uid() = id)
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin') OR 
    (auth.uid() = id)
  );