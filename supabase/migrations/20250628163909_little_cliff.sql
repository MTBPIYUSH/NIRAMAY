/*
  # Add location fields to profiles table

  1. New Columns
    - `address` (text) - Full formatted address from Google Places
    - `latitude` (double precision) - GPS latitude coordinate
    - `longitude` (double precision) - GPS longitude coordinate
    - `ward` (text) - Municipal ward derived from reverse geocoding

  2. Indexes
    - Add index on ward for efficient filtering
    - Add index on latitude/longitude for geospatial queries

  3. Security
    - Update RLS policies to allow users to update their own location data
*/

-- Add location fields to profiles table
DO $$
BEGIN
  -- Add address field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;

  -- Add latitude field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude double precision;
  END IF;

  -- Add longitude field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude double precision;
  END IF;

  -- Add ward field if it doesn't exist (update existing ward column if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ward'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ward text;
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_ward ON profiles(ward);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude);

-- Update RLS policies to allow location updates
CREATE POLICY "Users can update own location data"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);