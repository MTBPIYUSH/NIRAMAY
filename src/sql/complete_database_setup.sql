-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create waste_reports table
CREATE TABLE IF NOT EXISTS waste_reports (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Recyclable', 'Biodegradable', 'Hazardous', 'E-Waste')),
  status TEXT NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Collected')) DEFAULT 'Pending',
  location JSONB NOT NULL,
  description TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  collected_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  reports INTEGER DEFAULT 0,
  recycling INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  next_level_points INTEGER DEFAULT 200,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  points INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create redeemed_rewards table
CREATE TABLE IF NOT EXISTS redeemed_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  reward_id UUID REFERENCES rewards(id) NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Processed', 'Delivered', 'Cancelled')) DEFAULT 'Pending'
);

-- Enable RLS on all tables
ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own waste reports" ON waste_reports;
DROP POLICY IF EXISTS "Users can insert their own waste reports" ON waste_reports;
DROP POLICY IF EXISTS "Users can update their own waste reports" ON waste_reports;
DROP POLICY IF EXISTS "Users can view any user profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view any user badges" ON user_badges;
DROP POLICY IF EXISTS "Anyone can view rewards" ON rewards;
DROP POLICY IF EXISTS "Users can view their own redeemed rewards" ON redeemed_rewards;
DROP POLICY IF EXISTS "Users can insert their own redeemed rewards" ON redeemed_rewards;

-- Waste reports policies
CREATE POLICY "Users can view their own waste reports" 
  ON waste_reports FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own waste reports" 
  ON waste_reports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own waste reports" 
  ON waste_reports FOR UPDATE 
  USING (auth.uid() = user_id);

-- User profiles policies
CREATE POLICY "Users can view any user profile" 
  ON user_profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- User badges policies
CREATE POLICY "Users can view any user badges" 
  ON user_badges FOR SELECT 
  USING (true);

-- Rewards policies
CREATE POLICY "Anyone can view rewards" 
  ON rewards FOR SELECT 
  USING (true);

-- Redeemed rewards policies
CREATE POLICY "Users can view their own redeemed rewards" 
  ON redeemed_rewards FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redeemed rewards" 
  ON redeemed_rewards FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Drop existing functions and triggers to avoid conflicts
DROP FUNCTION IF EXISTS update_user_profile_on_report() CASCADE;
DROP FUNCTION IF EXISTS update_profile_on_collection() CASCADE;
DROP FUNCTION IF EXISTS update_user_ranks() CASCADE;
DROP FUNCTION IF EXISTS award_badges() CASCADE;

-- Function to update user profile when a waste report is added
CREATE OR REPLACE FUNCTION update_user_profile_on_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or create user profile
  INSERT INTO user_profiles (id, reports, points)
  VALUES (NEW.user_id, 1, CASE WHEN NEW.type = 'Hazardous' THEN 50 ELSE 30 END)
  ON CONFLICT (id) DO UPDATE
  SET 
    reports = user_profiles.reports + 1,
    points = user_profiles.points + CASE WHEN NEW.type = 'Hazardous' THEN 50 ELSE 30 END,
    updated_at = NOW();
    
  -- Check if user should level up
  UPDATE user_profiles
  SET 
    level = level + 1,
    next_level_points = next_level_points * 1.5
  WHERE 
    id = NEW.user_id AND 
    points >= next_level_points;
    
  -- Update recycling percentage (simplified calculation)
  UPDATE user_profiles
  SET 
    recycling = LEAST(100, recycling + 2)
  WHERE 
    id = NEW.user_id;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for waste report insertion
CREATE TRIGGER update_profile_after_report
AFTER INSERT ON waste_reports
FOR EACH ROW
EXECUTE FUNCTION update_user_profile_on_report();

-- Function to update user profile when a waste report status changes to 'Collected'
CREATE OR REPLACE FUNCTION update_profile_on_collection()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Collected' AND (OLD.status != 'Collected' OR OLD.status IS NULL) THEN
    -- Award points for collection
    UPDATE user_profiles
    SET 
      points = points + 20,
      updated_at = NOW()
    WHERE 
      id = NEW.user_id;
      
    -- Check if user should level up
    UPDATE user_profiles
    SET 
      level = level + 1,
      next_level_points = next_level_points * 1.5
    WHERE 
      id = NEW.user_id AND 
      points >= next_level_points;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for waste report status update
CREATE TRIGGER update_profile_after_collection
AFTER UPDATE ON waste_reports
FOR EACH ROW
WHEN (NEW.status = 'Collected' AND OLD.status != 'Collected')
EXECUTE FUNCTION update_profile_on_collection();

-- Function to update user ranks
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  rank_counter INTEGER := 1;
BEGIN
  -- First reset all ranks
  UPDATE user_profiles SET rank = NULL;
  
  -- Then assign new ranks based on points
  FOR user_record IN 
    SELECT id FROM user_profiles ORDER BY points DESC
  LOOP
    UPDATE user_profiles SET rank = rank_counter WHERE id = user_record.id;
    rank_counter := rank_counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to award badges based on activity
CREATE OR REPLACE FUNCTION award_badges()
RETURNS TRIGGER AS $$
BEGIN
  -- Award "Eco Warrior" badge when user reaches 500 points
  IF NEW.points >= 500 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.id AND badge_name = 'Eco Warrior') THEN
    INSERT INTO user_badges (user_id, badge_name) VALUES (NEW.id, 'Eco Warrior');
  END IF;
  
  -- Award "Cleanup Champion" badge when user reports 20 or more waste items
  IF NEW.reports >= 20 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.id AND badge_name = 'Cleanup Champion') THEN
    INSERT INTO user_badges (user_id, badge_name) VALUES (NEW.id, 'Cleanup Champion');
  END IF;
  
  -- Award "Recycling Expert" badge when recycling reaches 80%
  IF NEW.recycling >= 80 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.id AND badge_name = 'Recycling Expert') THEN
    INSERT INTO user_badges (user_id, badge_name) VALUES (NEW.id, 'Recycling Expert');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for badge awards
CREATE TRIGGER award_badges_trigger
AFTER UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION award_badges();

-- Create a scheduled function to update ranks daily (if pg_cron is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'update-user-ranks',
      '0 0 * * *',  -- Run at midnight every day
      $$SELECT update_user_ranks()$$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If pg_cron is not available, just log a message
  RAISE NOTICE 'pg_cron extension not available, skipping scheduled task';
END
$$;

-- Sample data for rewards (only insert if table is empty)
INSERT INTO rewards (name, points, image_url, description)
SELECT * FROM (
  VALUES
    ('10% Discount at EcoStore', 500, 'https://images.unsplash.com/photo-1572454591674-2739f30a2b2f?w=300&q=80', 'Get 10% off your next purchase at EcoStore, valid for 3 months.'),
    ('Free Reusable Water Bottle', 750, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&q=80', 'Claim a high-quality stainless steel water bottle to reduce plastic waste.'),
    ('Community Garden Membership', 1000, 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=300&q=80', 'One month free membership to your local community garden.'),
    ('Eco-Friendly Home Kit', 1500, 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=300&q=80', 'Kit includes biodegradable cleaning products and reusable household items.'),
    ('Electric Scooter Rental', 2000, 'https://images.unsplash.com/photo-1604868189265-219ba7ffc595?w=300&q=80', 'Free 3-day rental of an electric scooter from GreenRide.'),
    ('Tree Planting Certificate', 1200, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&q=80', 'We''ll plant a tree in your name and send you a certificate.')
) AS t
WHERE NOT EXISTS (SELECT 1 FROM rewards LIMIT 1);

-- Create a function to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Run the update_user_ranks function once to initialize ranks
SELECT update_user_ranks();
