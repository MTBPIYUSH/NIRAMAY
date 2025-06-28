/*
  # Fix RLS policy for reports table

  1. Security Changes
    - Drop the incorrect INSERT policy that checks `uid() = id`
    - Create a new INSERT policy that correctly checks `auth.uid() = user_id`
    - This allows authenticated users to insert reports where they are the author

  The issue was that the policy was checking `uid() = id` but the reports table uses `user_id` 
  as the foreign key to reference the user, not `id`.
*/

-- Drop the existing incorrect INSERT policy
DROP POLICY IF EXISTS "Users can insert their own report" ON reports;

-- Create the correct INSERT policy
CREATE POLICY "Users can insert their own reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);