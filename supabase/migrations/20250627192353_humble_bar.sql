/*
  # Insert default admin and subworker accounts

  1. Default Users
    - Admin account for Ward 12, Gurgaon
    - Subworker accounts for testing
    
  2. Notes
    - These accounts use email/password authentication
    - Passwords should be changed in production
    - Admin and subworker emails are pre-approved
*/

-- Note: These INSERT statements are for reference
-- In production, admin and subworker accounts should be created through Supabase Auth
-- and then their profiles should be inserted into the profiles table

-- Example profile inserts (to be done after auth users are created):
-- INSERT INTO profiles (id, role, name, phone, ward, city) VALUES
-- ('admin-uuid-here', 'admin', 'Priya Patel', '+91 98765 43210', 'Ward 12', 'Gurgaon'),
-- ('worker1-uuid-here', 'subworker', 'Ravi Kumar', '+91 87654 32109', 'Ward 12', 'Gurgaon'),
-- ('worker2-uuid-here', 'subworker', 'Suresh Verma', '+91 76543 21098', 'Ward 12', 'Gurgaon');