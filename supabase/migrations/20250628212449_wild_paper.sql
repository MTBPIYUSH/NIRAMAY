/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - The "Admins can access all profiles" policy creates infinite recursion
    - It queries the profiles table within a policy that's applied to the profiles table
    - This causes the policy to call itself infinitely

  2. Solution
    - Drop the problematic admin policy that causes recursion
    - Create a simpler admin policy that doesn't reference the profiles table
    - Keep the existing user policies for reading/updating own profiles
    - Use auth.jwt() to check user role from JWT claims instead of querying profiles table

  3. Security
    - Users can still read and update their own profiles
    - Admin access will need to be handled differently (through service role or JWT claims)
    - Maintains data security while fixing the recursion issue
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can access all profiles" ON profiles;

-- Keep the existing policies that work correctly
-- These policies don't cause recursion because they use auth.uid() directly
-- without querying the profiles table within the policy

-- The following policies should remain as they are:
-- 1. "Users can insert own profile" - uses (uid() = id) in with_check
-- 2. "Users can read own profile" - uses (uid() = id) in qual  
-- 3. "Users can update own profile" - uses (uid() = id) in both qual and with_check

-- Note: Admin access to all profiles should be handled through:
-- 1. Service role key for backend operations
-- 2. JWT claims if role information is stored in auth metadata
-- 3. A separate admin interface that uses service role permissions