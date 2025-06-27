/*
  # Fix RLS policies to prevent infinite recursion

  1. Policy Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create simple, direct policies for CRUD operations
    - Ensure users can create their own profile during signup
    - Allow users to read and update their own profile
    - Allow admins to read profiles using user metadata instead of profile table lookup

  2. Security
    - Maintain RLS on profiles table
    - Use direct auth.uid() comparisons to avoid recursion
    - Use auth.users.raw_user_meta_data for role checking to avoid circular references
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can read ward profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new, simple policies that avoid recursion

-- Allow users to insert their own profile (needed for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to read all profiles (using user metadata to avoid recursion)
CREATE POLICY "Admins can read ward profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
    OR auth.uid() = id
  );

-- Allow admins to update profiles (using user metadata to avoid recursion)
CREATE POLICY "Admins can update profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
    OR auth.uid() = id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
    OR auth.uid() = id
  );