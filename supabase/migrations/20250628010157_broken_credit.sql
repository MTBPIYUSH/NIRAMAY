/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Drop existing problematic RLS policies that cause infinite recursion
    - Create new, simplified RLS policies that don't query the profiles table within themselves
    - Use direct auth.uid() comparisons instead of subqueries

  2. Policy Details
    - Users can read their own profile: auth.uid() = id
    - Users can update their own profile: auth.uid() = id  
    - Users can insert their own profile: auth.uid() = id
    - Admins can read all profiles: role = 'admin' (using auth.jwt() claims)
    - Admins can update all profiles: role = 'admin' (using auth.jwt() claims)

  The key fix is removing the EXISTS subqueries that were causing the recursion.
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simple, non-recursive policies

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

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- For admin access, we'll use a simpler approach with auth.jwt() claims
-- This avoids the recursive query issue
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    (auth.jwt() ->> 'role')::text = 'admin'
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    (auth.jwt() ->> 'role')::text = 'admin'
  )
  WITH CHECK (
    auth.uid() = id OR 
    (auth.jwt() ->> 'role')::text = 'admin'
  );