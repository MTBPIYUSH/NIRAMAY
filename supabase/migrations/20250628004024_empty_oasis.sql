/*
  # Insert demo admin and subworker profiles

  1. Demo Users
    - Admin account for Ward 12, Gurgaon
    - Subworker accounts for testing
    
  2. Notes
    - These profiles are for demo purposes
    - In production, admin and subworker accounts should be created through proper channels
    - The auth.users entries need to be created first through Supabase Auth
*/

-- Note: These are example profiles that can be inserted after creating the corresponding auth users
-- You'll need to create the auth users first through Supabase Auth, then insert these profiles

-- Example admin profile (replace with actual UUID from auth.users)
-- INSERT INTO profiles (id, role, name, phone, ward, city) VALUES
-- ('admin-uuid-here', 'admin', 'Priya Patel', '+91 98765 43210', 'Ward 12', 'Gurgaon');

-- Example subworker profiles (replace with actual UUIDs from auth.users)
-- INSERT INTO profiles (id, role, name, phone, ward, city) VALUES
-- ('worker1-uuid-here', 'subworker', 'Ravi Kumar', '+91 87654 32109', 'Ward 12', 'Gurgaon'),
-- ('worker2-uuid-here', 'subworker', 'Suresh Verma', '+91 76543 21098', 'Ward 12', 'Gurgaon');

-- For demo purposes, you can create these users through the Supabase Auth interface
-- with the following credentials:
-- Admin: admin@niramay.gov.in / password123
-- Worker: worker@niramay.gov.in / password123