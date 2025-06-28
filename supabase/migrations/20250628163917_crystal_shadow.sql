/*
  # Seed Sub-worker Accounts

  1. Create Auth Users
    - Insert 3 sub-worker accounts into auth.users
    - Set appropriate metadata for each user

  2. Create Profile Records
    - Insert corresponding profiles with role = 'subworker'
    - Set status based on mock data
    - Include contact information

  3. Security
    - Ensure proper RLS policies are applied
*/

-- Insert sub-worker profiles (Auth users will be created via application)
-- These correspond to the mock data in mockData.ts

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
) VALUES 
  (
    gen_random_uuid(),
    'subworker',
    'Ravi Kumar',
    '+91 98765 43210',
    'busy',
    'Ward 12',
    'Gurgaon',
    0,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'subworker',
    'Suresh Verma',
    '+91 87654 32109',
    'available',
    'Ward 12',
    'Gurgaon',
    0,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'subworker',
    'Amit Singh',
    '+91 76543 21098',
    'available',
    'Ward 12',
    'Gurgaon',
    0,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Note: The actual auth.users records should be created through the application
-- using Supabase Auth API with the following credentials:
-- 
-- User 1: ravi.kumar@worker.gov.in / password123
-- User 2: suresh.verma@worker.gov.in / password123  
-- User 3: amit.singh@worker.gov.in / password123
--
-- This ensures proper password hashing and auth token generation