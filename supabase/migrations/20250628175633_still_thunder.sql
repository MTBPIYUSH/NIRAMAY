/*
  # Profile Schema Updates for Location and Sub-Worker Support

  1. New Columns
    - `address` (text) - User's address
    - `latitude` (double precision) - GPS latitude
    - `longitude` (double precision) - GPS longitude
    - `ward` (text) - Municipal ward

  2. Indexes
    - Performance indexes for ward, location, status, and role lookups

  3. Helper Function
    - Function to safely add sub-worker profiles
*/

-- Add address and location columns to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'ward'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ward text;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_ward ON profiles(ward);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Drop existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS add_subworker_profile(uuid, text, text, text, text, text);

-- Create helper function to add sub-worker profiles safely
CREATE OR REPLACE FUNCTION add_subworker_profile(
  user_id uuid,
  worker_name text,
  worker_phone text,
  worker_status text DEFAULT 'available',
  worker_ward text DEFAULT 'Ward 12',
  worker_city text DEFAULT 'Gurgaon'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (
    id,
    role,
    name,
    phone,
    status,
    ward,
    city,
    eco_points,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'subworker',
    worker_name,
    worker_phone,
    worker_status,
    worker_ward,
    worker_city,
    0,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    ward = EXCLUDED.ward,
    city = EXCLUDED.city,
    updated_at = now();
END;
$$;

-- Add comment explaining how to use the helper function
COMMENT ON FUNCTION add_subworker_profile(uuid, text, text, text, text, text) IS 'Helper function to safely add sub-worker profiles. Use after creating auth users via Supabase Auth API.';

/*
  To create sub-worker accounts after this migration:

  1. Create auth users via Supabase Dashboard or Auth API:
     - ravi.kumar@worker.gov.in
     - suresh.verma@worker.gov.in  
     - amit.singh@worker.gov.in

  2. Then call the helper function with actual user IDs:
     SELECT add_subworker_profile('actual-user-id', 'Ravi Kumar', '+91 98765 43210', 'busy');
     SELECT add_subworker_profile('actual-user-id', 'Suresh Verma', '+91 87654 32109', 'available');
     SELECT add_subworker_profile('actual-user-id', 'Amit Singh', '+91 76543 21098', 'available');

  3. Or use the seeding script: src/scripts/seedSubWorkers.ts
*/