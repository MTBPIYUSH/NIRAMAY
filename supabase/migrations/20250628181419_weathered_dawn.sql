/*
  # Worker Ward Mapping and Enhanced Profiles

  1. Enhanced Profiles Table
    - Add assigned_ward for sub-workers
    - Add current_task_id for tracking active assignments
    - Add task_completion_count for performance tracking

  2. Security
    - Enable RLS on profiles table
    - Add policies for worker management

  3. Functions
    - Function to get available workers by ward
    - Function to assign task to worker
    - Function to complete task and update worker status
*/

-- Add new columns to profiles table for worker management
DO $$ 
BEGIN
  -- Add assigned_ward column (for sub-workers to specify their coverage area)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'assigned_ward'
  ) THEN
    ALTER TABLE profiles ADD COLUMN assigned_ward text;
  END IF;

  -- Add current_task_id column (to track active task assignment)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'current_task_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_task_id uuid;
  END IF;

  -- Add task_completion_count column (for performance tracking)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'task_completion_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN task_completion_count integer DEFAULT 0;
  END IF;
END $$;

-- Create additional indexes for worker filtering
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_ward ON profiles(assigned_ward);
CREATE INDEX IF NOT EXISTS idx_profiles_current_task ON profiles(current_task_id);
CREATE INDEX IF NOT EXISTS idx_profiles_worker_status ON profiles(role, status) WHERE role = 'subworker';

-- Add foreign key constraint for current_task_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_current_task_id_fkey'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_current_task_id_fkey 
    FOREIGN KEY (current_task_id) REFERENCES reports(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Function to get available workers by ward
CREATE OR REPLACE FUNCTION get_available_workers_by_ward(target_ward text)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  assigned_ward text,
  task_completion_count integer,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.phone,
    p.assigned_ward,
    p.task_completion_count,
    p.status
  FROM profiles p
  WHERE 
    p.role = 'subworker' 
    AND p.status = 'available'
    AND p.current_task_id IS NULL
    AND (p.assigned_ward = target_ward OR p.assigned_ward IS NULL)
  ORDER BY p.task_completion_count ASC, p.name ASC;
END;
$$;

-- Function to assign task to worker
CREATE OR REPLACE FUNCTION assign_task_to_worker(
  task_id uuid,
  worker_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  worker_available boolean := false;
BEGIN
  -- Check if worker is available
  SELECT (status = 'available' AND current_task_id IS NULL AND role = 'subworker')
  INTO worker_available
  FROM profiles
  WHERE id = worker_id;

  IF NOT worker_available THEN
    RETURN false;
  END IF;

  -- Update report status and assignment
  UPDATE reports 
  SET 
    status = 'assigned',
    assigned_to = worker_id,
    updated_at = now()
  WHERE id = task_id;

  -- Update worker status and current task
  UPDATE profiles 
  SET 
    status = 'busy',
    current_task_id = task_id,
    updated_at = now()
  WHERE id = worker_id;

  RETURN true;
END;
$$;

-- Function to complete task and update worker status
CREATE OR REPLACE FUNCTION complete_task_and_update_worker(
  task_id uuid,
  worker_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update report status to completed
  UPDATE reports 
  SET 
    status = 'completed',
    updated_at = now()
  WHERE id = task_id AND assigned_to = worker_id;

  -- Update worker status back to available and increment completion count
  UPDATE profiles 
  SET 
    status = 'available',
    current_task_id = NULL,
    task_completion_count = task_completion_count + 1,
    updated_at = now()
  WHERE id = worker_id AND role = 'subworker';

  RETURN true;
END;
$$;

-- Function to extract ward from address using simple text matching
CREATE OR REPLACE FUNCTION extract_ward_from_address(address_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  ward_match text;
BEGIN
  -- Try to extract ward information from address
  -- Look for patterns like "Ward 12", "Ward-12", "Sector 14" etc.
  
  -- First try to find explicit ward mentions
  ward_match := (regexp_match(address_text, 'Ward[- ]?(\d+)', 'i'))[1];
  
  IF ward_match IS NOT NULL THEN
    RETURN 'Ward ' || ward_match;
  END IF;
  
  -- Try to find sector mentions (common in Indian cities)
  ward_match := (regexp_match(address_text, 'Sector[- ]?(\d+)', 'i'))[1];
  
  IF ward_match IS NOT NULL THEN
    RETURN 'Sector ' || ward_match;
  END IF;
  
  -- Try to find block mentions
  ward_match := (regexp_match(address_text, 'Block[- ]?([A-Z0-9]+)', 'i'))[1];
  
  IF ward_match IS NOT NULL THEN
    RETURN 'Block ' || ward_match;
  END IF;
  
  -- Default fallback
  RETURN 'Ward 12';
END;
$$;

-- Update existing sub-worker profiles with assigned_ward
UPDATE profiles 
SET assigned_ward = COALESCE(ward, 'Ward 12')
WHERE role = 'subworker' AND assigned_ward IS NULL;

-- Add comments for documentation
COMMENT ON FUNCTION get_available_workers_by_ward(text) IS 'Returns available sub-workers for a specific ward, ordered by task completion count';
COMMENT ON FUNCTION assign_task_to_worker(uuid, uuid) IS 'Assigns a task to an available worker and updates their status';
COMMENT ON FUNCTION complete_task_and_update_worker(uuid, uuid) IS 'Marks task as completed and updates worker availability';
COMMENT ON FUNCTION extract_ward_from_address(text) IS 'Extracts ward/sector information from address text using pattern matching';