/*
  # Sub-worker Account Setup Migration
  
  This migration prepares the database for sub-worker accounts but does not
  insert actual profile records since they require corresponding auth.users.
  
  Instead, this migration:
  1. Ensures the profiles table has the necessary columns
  2. Creates a function to easily add sub-worker profiles when auth users exist
  3. Documents the required manual steps for creating auth users
*/

-- Ensure profiles table has all required columns (some may already exist)
DO $$ 
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status text DEFAULT 'available';
  END IF;

  -- Add ward column if it doesn't exist  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'ward'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ward text;
  END IF;

  -- Add city column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;

  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;

  -- Add latitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude double precision;
  END IF;

  -- Add longitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude double precision;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_ward ON profiles(ward);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Add check constraint for status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'profiles_status_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('available', 'busy', 'offline'));
  END IF;
END $$;

-- Create a helper function to add sub-worker profiles after auth users are created
CREATE OR REPLACE FUNCTION add_subworker_profile(
  user_id uuid,
  worker_name text,
  worker_phone text,
  worker_ward text DEFAULT 'Ward 12',
  worker_city text DEFAULT 'Gurgaon'
) RETURNS void AS $$
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
    'available',
    worker_ward,
    worker_city,
    0,
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    ward = EXCLUDED.ward,
    city = EXCLUDED.city,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_subworker_profile TO authenticated;

/*
  MANUAL STEPS REQUIRED:
  
  After this migration, you need to create the auth users and profiles manually:
  
  1. Use the Supabase Dashboard or Auth API to create these users:
     - Email: ravi.kumar@worker.gov.in, Password: password123
     - Email: suresh.verma@worker.gov.in, Password: password123  
     - Email: amit.singh@worker.gov.in, Password: password123
  
  2. After creating each auth user, run this SQL with their actual user IDs:
     
     SELECT add_subworker_profile(
       'actual-user-id-from-auth-users',
       'Ravi Kumar',
       '+91 98765 43210'
     );
     
     SELECT add_subworker_profile(
       'actual-user-id-from-auth-users',
       'Suresh Verma', 
       '+91 87654 32109'
     );
     
     SELECT add_subworker_profile(
       'actual-user-id-from-auth-users',
       'Amit Singh',
       '+91 76543 21098'
     );
  
  3. Alternatively, use the seeding script in src/scripts/seedSubWorkers.ts
     which handles both auth user creation and profile insertion.
*/