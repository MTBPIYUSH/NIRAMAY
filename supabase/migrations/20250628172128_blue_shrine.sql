/*
  # Schema updates for sub-workers and citizen profiles

  1. Schema Changes
    - Add address, latitude, longitude, ward columns to profiles table
    - Add indexes for performance optimization
    - Create helper function for adding sub-worker profiles later

  2. Security
    - Maintain existing RLS policies
    - Add indexes for efficient queries

  Note: Sub-worker auth users and profiles will be created separately
  through the application or manual process to avoid foreign key violations.
*/

-- Add new columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;

  -- Add latitude column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude double precision;
  END IF;

  -- Add longitude column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude double precision;
  END IF;

  -- Ensure ward column exists (might already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'ward'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ward text;
  END IF;

  -- Ensure city column exists (might already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_profiles_ward ON profiles (ward);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_eco_points ON profiles (eco_points DESC);

-- Create a helper function to safely add sub-worker profiles
-- This can be called after auth users are created
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
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    ward = EXCLUDED.ward,
    city = EXCLUDED.city,
    updated_at = now();
END;
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION add_subworker_profile TO authenticated;

-- Add comment explaining the sub-worker setup process
COMMENT ON FUNCTION add_subworker_profile IS 'Helper function to add sub-worker profiles after auth users are created. Call this function with actual user IDs from auth.users table.';

/*
  Sub-worker Setup Instructions:
  
  1. Create auth users manually in Supabase Dashboard or via application:
     - Email: ravi.kumar@worker.gov.in, Password: password123
     - Email: suresh.verma@worker.gov.in, Password: password123  
     - Email: amit.singh@worker.gov.in, Password: password123
  
  2. After creating auth users, call the helper function with their actual user IDs:
     
     SELECT add_subworker_profile(
       'actual-user-id-from-auth-users',
       'Ravi Kumar',
       '+91 98765 43210',
       'busy'
     );
     
     SELECT add_subworker_profile(
       'actual-user-id-from-auth-users',
       'Suresh Verma',
       '+91 87654 32109',
       'available'
     );
     
     SELECT add_subworker_profile(
       'actual-user-id-from-auth-users',
       'Amit Singh',
       '+91 76543 21098',
       'available'
     );
*/