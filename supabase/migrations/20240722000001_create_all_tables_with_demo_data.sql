-- Create users in auth.users table first
-- Note: We can't directly insert into auth.users from SQL migrations
-- This is a workaround for development/demo purposes only
-- In production, users should be created through proper auth flows

-- Create a function to insert demo users into auth.users
CREATE OR REPLACE FUNCTION create_demo_users()
RETURNS VOID AS $$
DECLARE
  user1_id UUID := '00000000-0000-0000-0000-000000000001';
  user2_id UUID := '00000000-0000-0000-0000-000000000002';
  user3_id UUID := '00000000-0000-0000-0000-000000000003';
  user4_id UUID := '00000000-0000-0000-0000-000000000004';
  user5_id UUID := '00000000-0000-0000-0000-000000000005';
BEGIN
  -- Check if users already exist to avoid duplicates
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user1_id) THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES 
      (user1_id, 'john.doe@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), NOW(), NOW()),
      (user2_id, 'jane.smith@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), NOW(), NOW()),
      (user3_id, 'alex.johnson@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), NOW(), NOW()),
      (user4_id, 'maria.garcia@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), NOW(), NOW()),
      (user5_id, 'david.lee@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), NOW(), NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create demo users
SELECT create_demo_users();

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
  rank INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waste_reports table
CREATE TABLE IF NOT EXISTS waste_reports (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  location JSONB NOT NULL,
  description TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  collected_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  reward_id TEXT REFERENCES rewards(id),
  status TEXT DEFAULT 'Pending',
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create functions
CREATE OR REPLACE FUNCTION increment(value INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN value + 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_user_reports(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET 
    reports = reports + 1,
    points = points + points_to_add
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET rank = ranks.rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC) as rank
    FROM user_profiles
  ) ranks
  WHERE user_profiles.id = ranks.id;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE waste_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE redeemed_rewards;

-- Insert demo data

-- Insert into user_profiles after creating auth users
INSERT INTO user_profiles (id, name, avatar_url, points, reports, recycling, level, next_level_points, rank)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'John Doe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=00000000-0000-0000-0000-000000000001', 850, 15, 75, 4, 1000, 1),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=00000000-0000-0000-0000-000000000002', 720, 12, 60, 3, 800, 2),
  ('00000000-0000-0000-0000-000000000003', 'Alex Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=00000000-0000-0000-0000-000000000003', 550, 8, 45, 3, 800, 3),
  ('00000000-0000-0000-0000-000000000004', 'Maria Garcia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=00000000-0000-0000-0000-000000000004', 420, 7, 40, 2, 600, 4),
  ('00000000-0000-0000-0000-000000000005', 'David Lee', 'https://api.dicebear.com/7.x/avataaars/svg?seed=00000000-0000-0000-0000-000000000005', 380, 6, 35, 2, 600, 5);

-- Demo waste reports
INSERT INTO waste_reports (id, user_id, type, status, location, description, reported_at, collected_at, image_url, urgent)
VALUES
  ('WR-123456', '00000000-0000-0000-0000-000000000001', 'plastic', 'Collected', '{"latitude": 40.7128, "longitude": -74.0060, "formatted_address": "New York, NY, USA"}', 'Large pile of plastic bottles near the park entrance', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800&q=80', FALSE),
  ('WR-123457', '00000000-0000-0000-0000-000000000001', 'paper', 'Collected', '{"latitude": 40.7282, "longitude": -73.9942, "formatted_address": "Manhattan, NY, USA"}', 'Cardboard boxes left on the sidewalk', NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days', 'https://images.unsplash.com/photo-1589398908294-12e501b79a2e?w=800&q=80', FALSE),
  ('WR-123458', '00000000-0000-0000-0000-000000000002', 'glass', 'In Progress', '{"latitude": 40.7112, "longitude": -74.0123, "formatted_address": "Downtown, NY, USA"}', 'Broken glass bottles in the alley', NOW() - INTERVAL '5 days', NULL, 'https://images.unsplash.com/photo-1605368689763-a664bf2e2b87?w=800&q=80', FALSE),
  ('WR-123459', '00000000-0000-0000-0000-000000000003', 'hazardous', 'Pending', '{"latitude": 40.7392, "longitude": -73.9903, "formatted_address": "Midtown, NY, USA"}', 'Old paint cans and chemicals', NOW() - INTERVAL '3 days', NULL, 'https://images.unsplash.com/photo-1605600216595-71896fb28dec?w=800&q=80', TRUE),
  ('WR-123460', '00000000-0000-0000-0000-000000000004', 'electronic', 'Pending', '{"latitude": 40.7231, "longitude": -74.0021, "formatted_address": "SoHo, NY, USA"}', 'Discarded computer monitors and keyboards', NOW() - INTERVAL '2 days', NULL, 'https://images.unsplash.com/photo-1605600215908-bdfaad113e6c?w=800&q=80', FALSE),
  ('WR-123461', '00000000-0000-0000-0000-000000000005', 'organic', 'Pending', '{"latitude": 40.7589, "longitude": -73.9851, "formatted_address": "Central Park, NY, USA"}', 'Food waste near picnic area', NOW() - INTERVAL '1 day', NULL, 'https://images.unsplash.com/photo-1605600659892-ec64d010bbe1?w=800&q=80', FALSE);

-- Demo user badges
INSERT INTO user_badges (id, user_id, badge_name, earned_at)
VALUES
  ('badge-001', '00000000-0000-0000-0000-000000000001', 'First Report', NOW() - INTERVAL '30 days'),
  ('badge-002', '00000000-0000-0000-0000-000000000001', 'Recycling Champion', NOW() - INTERVAL '20 days'),
  ('badge-003', '00000000-0000-0000-0000-000000000001', 'Community Hero', NOW() - INTERVAL '10 days'),
  ('badge-004', '00000000-0000-0000-0000-000000000002', 'First Report', NOW() - INTERVAL '25 days'),
  ('badge-005', '00000000-0000-0000-0000-000000000002', 'Recycling Champion', NOW() - INTERVAL '15 days'),
  ('badge-006', '00000000-0000-0000-0000-000000000003', 'First Report', NOW() - INTERVAL '20 days'),
  ('badge-007', '00000000-0000-0000-0000-000000000004', 'First Report', NOW() - INTERVAL '15 days'),
  ('badge-008', '00000000-0000-0000-0000-000000000005', 'First Report', NOW() - INTERVAL '10 days');

-- Demo rewards
INSERT INTO rewards (id, name, points, image_url, description, active)
VALUES
  ('reward-001', '10% Discount Coupon', 200, 'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=600&q=80', 'Get 10% off your next purchase at eco-friendly stores', TRUE),
  ('reward-002', 'Plant a Tree', 500, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80', 'We will plant a tree in your name in a reforestation project', TRUE),
  ('reward-003', 'Eco-friendly Kit', 750, 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600&q=80', 'Receive a kit with reusable items including water bottle, bags, and utensils', TRUE),
  ('reward-004', 'Community Event Ticket', 1000, 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80', 'Free ticket to our annual community cleanup and sustainability event', TRUE),
  ('reward-005', 'Recycled Art Workshop', 350, 'https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=600&q=80', 'Join a workshop to create art from recycled materials', TRUE),
  ('reward-006', 'Home Composting Kit', 600, 'https://images.unsplash.com/photo-1582560475093-ba66accbc095?w=600&q=80', 'Start composting at home with this beginner-friendly kit', TRUE);

-- Demo redeemed rewards
INSERT INTO redeemed_rewards (id, user_id, reward_id, status, redeemed_at)
VALUES
  ('redeem-001', '00000000-0000-0000-0000-000000000001', 'reward-001', 'Completed', NOW() - INTERVAL '15 days'),
  ('redeem-002', '00000000-0000-0000-0000-000000000001', 'reward-002', 'Completed', NOW() - INTERVAL '5 days'),
  ('redeem-003', '00000000-0000-0000-0000-000000000002', 'reward-001', 'Completed', NOW() - INTERVAL '10 days'),
  ('redeem-004', '00000000-0000-0000-0000-000000000003', 'reward-001', 'Pending', NOW() - INTERVAL '2 days');
