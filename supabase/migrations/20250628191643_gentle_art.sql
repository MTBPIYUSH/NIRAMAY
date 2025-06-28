/*
  # Fix Profile RLS Policies

  1. Security Updates
    - Drop existing problematic policies
    - Create new comprehensive RLS policies for profiles table
    - Ensure proper INSERT, SELECT, and UPDATE permissions
    - Fix policy conditions to prevent violations

  2. Policy Changes
    - Allow authenticated users to insert their own profile
    - Allow users to read their own profile
    - Allow users to update their own profile
    - Allow admins to manage all profiles
    - Ensure proper JWT role checking
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own location data" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create comprehensive RLS policies for profiles table

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Enable read for users own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY "Enable read for admin users"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow admins to update all profiles
CREATE POLICY "Enable update for admin users"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow admins to insert profiles for other users (for admin management)
CREATE POLICY "Enable insert for admin users"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;