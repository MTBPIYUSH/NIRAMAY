/*
  # Admin Approval Workflow Implementation

  1. Schema Updates
    - Update reports table to support approval workflow
    - Add proof submission fields
    - Add status transitions for approval process

  2. New Status Values
    - submitted_for_approval: Worker has submitted proof
    - approved: Admin has approved the cleanup
    - rejected: Admin has rejected the submission

  3. Proof Submission Fields
    - proof_image: URL of completion photo
    - proof_lat, proof_lng: Location where proof was taken
    - completion_timestamp: When the proof was submitted
    - rejection_reason: Admin's reason for rejection (if applicable)

  4. Indexes
    - Add indexes for approval workflow queries
*/

-- Add completion_timestamp field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'completion_timestamp'
  ) THEN
    ALTER TABLE reports ADD COLUMN completion_timestamp timestamp with time zone;
  END IF;
END $$;

-- Add rejection_reason field (different from rejection_comment)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE reports ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Update status constraint to include new approval statuses
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reports_status_check'
  ) THEN
    ALTER TABLE reports DROP CONSTRAINT reports_status_check;
  END IF;
  
  -- Add new constraint with approval statuses
  ALTER TABLE reports ADD CONSTRAINT reports_status_check 
  CHECK (status IN (
    'submitted', 
    'assigned', 
    'in-progress', 
    'submitted_for_approval', 
    'approved', 
    'rejected', 
    'completed'
  ));
END $$;

-- Create index for approval workflow queries
CREATE INDEX IF NOT EXISTS idx_reports_approval_status ON reports(status) 
WHERE status IN ('submitted_for_approval', 'approved', 'rejected');

-- Create index for completion timestamp
CREATE INDEX IF NOT EXISTS idx_reports_completion_timestamp ON reports(completion_timestamp DESC);

-- Function to handle approval and point distribution
CREATE OR REPLACE FUNCTION approve_cleanup_task(
  task_id uuid,
  admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report_record RECORD;
  points_to_award integer;
BEGIN
  -- Get the report details
  SELECT r.*, p.eco_points as current_points
  INTO report_record
  FROM reports r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.id = task_id AND r.status = 'submitted_for_approval';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Calculate points based on priority
  CASE report_record.priority_level
    WHEN 'low' THEN points_to_award := 10;
    WHEN 'medium' THEN points_to_award := 20;
    WHEN 'high' THEN points_to_award := 30;
    WHEN 'urgent' THEN points_to_award := 40;
    ELSE points_to_award := 20; -- Default to medium
  END CASE;

  -- Update report status to approved
  UPDATE reports 
  SET 
    status = 'approved',
    updated_at = now()
  WHERE id = task_id;

  -- Award points to the citizen
  UPDATE profiles 
  SET 
    eco_points = eco_points + points_to_award,
    updated_at = now()
  WHERE id = report_record.user_id;

  -- Update worker status back to available and increment completion count
  UPDATE profiles 
  SET 
    status = 'available',
    current_task_id = NULL,
    task_completion_count = task_completion_count + 1,
    updated_at = now()
  WHERE id = report_record.assigned_to AND role = 'subworker';

  -- Create reward transaction record
  INSERT INTO reward_transactions (user_id, report_id, points)
  VALUES (report_record.user_id, task_id, points_to_award);

  RETURN true;
END;
$$;

-- Function to reject cleanup task
CREATE OR REPLACE FUNCTION reject_cleanup_task(
  task_id uuid,
  admin_id uuid,
  rejection_reason_text text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report_record RECORD;
BEGIN
  -- Get the report details
  SELECT *
  INTO report_record
  FROM reports
  WHERE id = task_id AND status = 'submitted_for_approval';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Update report status to rejected with reason
  UPDATE reports 
  SET 
    status = 'rejected',
    rejection_reason = rejection_reason_text,
    updated_at = now()
  WHERE id = task_id;

  -- Keep worker as busy but clear the current task (they need to resubmit)
  UPDATE profiles 
  SET 
    current_task_id = NULL,
    updated_at = now()
  WHERE id = report_record.assigned_to AND role = 'subworker';

  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_cleanup_task TO authenticated;
GRANT EXECUTE ON FUNCTION reject_cleanup_task TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION approve_cleanup_task(uuid, uuid) IS 'Approves a cleanup task, awards points to citizen, and updates worker status';
COMMENT ON FUNCTION reject_cleanup_task(uuid, uuid, text) IS 'Rejects a cleanup task with reason and allows worker to resubmit';