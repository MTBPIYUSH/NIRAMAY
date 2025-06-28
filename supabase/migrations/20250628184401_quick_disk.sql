/*
  # Remove points logic, keep only eco-points

  1. Database Changes
    - Remove points column from profiles table
    - Keep eco_points column
    - Update any references to points

  2. Clean Up
    - Remove any points-related constraints or defaults
    - Ensure eco_points remains the single reward system
*/

-- Remove points column from profiles table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'points'
  ) THEN
    ALTER TABLE profiles DROP COLUMN points;
  END IF;
END $$;

-- Ensure eco_points column exists and has proper default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'eco_points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN eco_points integer DEFAULT 0;
  END IF;
END $$;

-- Update any existing null eco_points to 0
UPDATE profiles SET eco_points = 0 WHERE eco_points IS NULL;

-- Add index for eco_points if not exists
CREATE INDEX IF NOT EXISTS idx_profiles_eco_points ON profiles(eco_points DESC);