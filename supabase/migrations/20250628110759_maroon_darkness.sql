/*
  # Fix RLS policies for reports table

  1. Security Updates
    - Drop existing incorrect RLS policies for reports table
    - Create correct RLS policies that allow:
      - Users to insert their own reports (where auth.uid() = user_id)
      - Users to read their own reports (where auth.uid() = user_id)
      - Admins to read and update all reports
    
  2. Policy Details
    - INSERT: Allow authenticated users to insert reports where they are the user_id
    - SELECT: Allow users to read their own reports and admins to read all
    - UPDATE: Allow only admins to update reports
*/

-- Drop existing policies for reports table
DROP POLICY IF EXISTS "Admins can read all reports" ON reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON reports;
DROP POLICY IF EXISTS "Users can read their own reports" ON reports;

-- Create correct INSERT policy for users to insert their own reports
CREATE POLICY "Users can insert their own reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create correct SELECT policy for users to read their own reports
CREATE POLICY "Users can read their own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create SELECT policy for admins to read all reports
CREATE POLICY "Admins can read all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create UPDATE policy for admins to update all reports
CREATE POLICY "Admins can update all reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );