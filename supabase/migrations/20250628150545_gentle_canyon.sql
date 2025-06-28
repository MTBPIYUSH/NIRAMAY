/*
  # Add Task Lifecycle Fields

  1. New Fields
    - Add proof_image, proof_lat, proof_lng to reports table for sub-worker proof submissions
    - Add rejection_comment field for admin feedback
    - Add eco_points field for reward calculation

  2. Security
    - Update RLS policies to handle new workflow states
    - Add policies for sub-workers to update proof fields
*/

-- Add new fields to reports table
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

-- Add policy for sub-workers to update proof fields
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