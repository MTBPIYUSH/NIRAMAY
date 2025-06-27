/*
  # Fix RLS policies for profiles table

  1. Policy Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create simple, direct policies for CRUD operations
    - Ensure users can create their own profile during signup
    - Allow users to read and update their own profile
    - Allow admins to read profiles in their ward (simplified)

  2. Security
    - Maintain RLS on profiles table
    - Use direct auth.uid() comparisons to avoid recursion
    - Separate admin access from user access clearly
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read ward profiles" ON profiles;
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

-- Allow admins to read profiles in their ward (simplified to avoid recursion)
-- This policy checks if the requesting user has admin role by looking at their own record
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

-- Allow admins to update profiles in their ward
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