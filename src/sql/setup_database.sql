-- This script sets up the necessary tables for the SmartWaste application

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  reports INTEGER DEFAULT 0,
  recycling INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  next_level_points INTEGER DEFAULT 200,
  rank INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
CREATE POLICY "Users can view all profiles" 
  ON user_profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Waste Reports Table
CREATE TABLE IF NOT EXISTS waste_reports (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('Recyclable', 'Biodegradable', 'Hazardous', 'E-Waste')),
  status TEXT CHECK (status IN ('Pending', 'In Progress', 'Collected')) DEFAULT 'Pending',
  location JSONB,
  description TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  collected_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for waste_reports
DROP POLICY IF EXISTS "Users can view all waste reports" ON waste_reports;
CREATE POLICY "Users can view all waste reports" 
  ON waste_reports FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own waste reports" ON waste_reports;
CREATE POLICY "Users can insert their own waste reports" 
  ON waste_reports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own waste reports" ON waste_reports;
CREATE POLICY "Users can update their own waste reports" 
  ON waste_reports FOR UPDATE 
  USING (auth.uid() = user_id);

-- User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Create policies for user_badges
DROP POLICY IF EXISTS "Users can view all badges" ON user_badges;
CREATE POLICY "Users can view all badges" 
  ON user_badges FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
CREATE POLICY "Users can insert their own badges" 
  ON user_badges FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Rewards Table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  points INTEGER NOT NULL,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Create policies for rewards
DROP POLICY IF EXISTS "Users can view all rewards" ON rewards;
CREATE POLICY "Users can view all rewards" 
  ON rewards FOR SELECT 
  USING (true);

-- Insert sample rewards if none exist
INSERT INTO rewards (name, points, image_url, description)
SELECT * FROM (
  VALUES
    ('Eco-Friendly Water Bottle', 500, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80', 'Reusable stainless steel water bottle'),
    ('Recycled Tote Bag', 300, 'https://images.unsplash.com/photo-1597484662317-c93a56409d8e?w=500&q=80', 'Stylish tote bag made from recycled materials'),
    ('Tree Planting Certificate', 1000, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&q=80', 'We will plant a tree in your name'),
    ('$10 Gift Card', 2000, 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&q=80', 'Gift card for eco-friendly online store'),
    ('Compost Starter Kit', 1500, 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=500&q=80', 'Everything you need to start composting at home'),
    ('Solar Phone Charger', 3000, 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&q=80', 'Portable solar charger for your devices')
) AS t(name, points, image_url, description)
WHERE NOT EXISTS (SELECT 1 FROM rewards LIMIT 1);

-- Create function to update user stats when a waste report is added
CREATE OR REPLACE FUNCTION update_user_stats_on_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user profile stats
  UPDATE user_profiles
  SET 
    reports = reports + 1,
    points = points + CASE 
      WHEN NEW.type = 'Hazardous' THEN 50
      WHEN NEW.type = 'E-Waste' THEN 40
      WHEN NEW.type = 'Recyclable' THEN 30
      WHEN NEW.type = 'Biodegradable' THEN 20
      ELSE 10
    END,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  -- Check if user should level up
  UPDATE user_profiles
  SET 
    level = level + 1,
    next_level_points = next_level_points * 2
  WHERE 
    id = NEW.user_id AND 
    points >= next_level_points;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for waste_reports
DROP TRIGGER IF EXISTS update_user_stats_after_report ON waste_reports;
CREATE TRIGGER update_user_stats_after_report
AFTER INSERT ON waste_reports
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_report();

-- Create function to update ranks periodically
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  rank_counter INTEGER := 1;
BEGIN
  -- Update ranks based on points
  FOR user_record IN 
    SELECT id FROM user_profiles ORDER BY points DESC
  LOOP
    UPDATE user_profiles SET rank = rank_counter WHERE id = user_record.id;
    rank_counter := rank_counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to award badges
CREATE OR REPLACE FUNCTION award_badges()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Award badges based on reports count
  FOR user_record IN 
    SELECT id, reports FROM user_profiles WHERE reports >= 5
  LOOP
    -- Rookie Reporter badge
    IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_record.id AND badge_name = 'Rookie Reporter') THEN
      INSERT INTO user_badges (user_id, badge_name) VALUES (user_record.id, 'Rookie Reporter');
    END IF;
    
    -- Waste Warrior badge
    IF user_record.reports >= 20 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_record.id AND badge_name = 'Waste Warrior') THEN
      INSERT INTO user_badges (user_id, badge_name) VALUES (user_record.id, 'Waste Warrior');
    END IF;
  END LOOP;
  
  -- Award badges based on points
  FOR user_record IN 
    SELECT id, points FROM user_profiles
  LOOP
    -- Point Collector badge
    IF user_record.points >= 500 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_record.id AND badge_name = 'Point Collector') THEN
      INSERT INTO user_badges (user_id, badge_name) VALUES (user_record.id, 'Point Collector');
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the update_user_ranks function once to initialize ranks
SELECT update_user_ranks();

-- Instructions for running this script:
-- 1. Connect to your Supabase project using the SQL Editor
-- 2. Paste this script and run it
-- 3. Verify that the tables have been created by checking the Database section