/*
  # Complete Task Lifecycle Implementation

  1. New Fields for Reports Table
    - `assigned_to` (uuid) - References the sub-worker assigned to the task
    - `proof_image` (text) - URL/path to proof image submitted by sub-worker
    - `proof_lat` (double precision) - Latitude of proof submission location
    - `proof_lng` (double precision) - Longitude of proof submission location
    - `rejection_comment` (text) - Admin comment when rejecting proof
    - `eco_points` (integer) - Points awarded for completing this task

  2. New Table: reward_transactions
    - Tracks all point distributions and rewards
    - Links users to reports and point amounts

  3. Security Policies
    - Sub-workers can update proof fields for assigned reports
    - Users can read their own reward transactions
    - Admins can manage all reward transactions
*/

-- Add assigned_to column first (this was missing and causing the error)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add other new fields to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_image text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_lat double precision;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_lng double precision;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rejection_comment text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS eco_points integer DEFAULT 75;

-- Create reward_transactions table for tracking point distribution
CREATE TABLE IF NOT EXISTS reward_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  points integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on reward_transactions
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for reward_transactions
CREATE POLICY "Users can read their own reward transactions"
  ON reward_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reward transactions"
  ON reward_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add policy for sub-workers to update proof fields (now that assigned_to column exists)
CREATE POLICY "Sub-workers can update assigned reports proof"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = assigned_to AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'subworker'
    )
  )
  WITH CHECK (
    auth.uid() = assigned_to AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'subworker'
    )
  );

-- Create index for better performance on assigned_to lookups
CREATE INDEX IF NOT EXISTS idx_reports_assigned_to ON reports(assigned_to);

-- Create index for better performance on reward_transactions lookups
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_id ON reward_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_report_id ON reward_transactions(report_id);