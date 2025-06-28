/*
  # Complete AI Integration and Schema Implementation

  1. Schema Updates
    - Add AI-related columns to reports table
    - Add eco_store_items table for marketplace
    - Add redemptions table for point spending
    - Update profiles table for sub-worker status
    - Add comprehensive indexes for performance

  2. Security
    - Enable RLS on all new tables
    - Add policies for role-based access control
    - Ensure data isolation between users

  3. Performance
    - Add indexes on frequently queried columns
    - Optimize for dashboard and leaderboard queries
*/

-- Add AI-related columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority_level text DEFAULT 'medium';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_analysis jsonb;

-- Add constraint for priority_level values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reports_priority_level_check'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_priority_level_check 
    CHECK (priority_level IN ('low', 'medium', 'high', 'urgent'));
  END IF;
END $$;

-- Update profiles table for sub-worker status and eco_points
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS eco_points integer DEFAULT 0;

-- Add constraint for sub-worker status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_status_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('available', 'busy', 'offline'));
  END IF;
END $$;

-- Create eco_store_items table for marketplace
CREATE TABLE IF NOT EXISTS eco_store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  point_cost integer NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  image_url text NOT NULL,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add constraint for eco_store_items category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'eco_store_items_category_check'
  ) THEN
    ALTER TABLE eco_store_items ADD CONSTRAINT eco_store_items_category_check 
    CHECK (category IN ('dustbins', 'compost', 'tools', 'plants', 'vouchers'));
  END IF;
END $$;

-- Enable RLS on eco_store_items
ALTER TABLE eco_store_items ENABLE ROW LEVEL SECURITY;

-- Create redemptions table for point spending tracking
CREATE TABLE IF NOT EXISTS redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES eco_store_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  total_points_spent integer NOT NULL,
  status text DEFAULT 'pending',
  delivery_address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add constraint for redemption status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'redemptions_status_check'
  ) THEN
    ALTER TABLE redemptions ADD CONSTRAINT redemptions_status_check 
    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'));
  END IF;
END $$;

-- Enable RLS on redemptions
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Create notifications table for in-app messaging
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  related_report_id uuid REFERENCES reports(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Add constraint for notification type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_type_check'
  ) THEN
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('info', 'success', 'warning', 'error', 'assignment', 'approval', 'rejection'));
  END IF;
END $$;

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR ECO_STORE_ITEMS
CREATE POLICY "Allow authenticated users to read eco store items"
  ON eco_store_items
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Allow admin users to manage eco store items"
  ON eco_store_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS POLICIES FOR REDEMPTIONS
CREATE POLICY "Users can read their own redemptions"
  ON redemptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own redemptions"
  ON redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all redemptions"
  ON redemptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS POLICIES FOR NOTIFICATIONS
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications for any user"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_reports_priority_level ON reports(priority_level);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_eco_points ON profiles(eco_points DESC);
CREATE INDEX IF NOT EXISTS idx_eco_store_items_category ON eco_store_items(category);
CREATE INDEX IF NOT EXISTS idx_eco_store_items_point_cost ON eco_store_items(point_cost);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for new tables
CREATE TRIGGER eco_store_items_updated_at
  BEFORE UPDATE ON eco_store_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER redemptions_updated_at
  BEFORE UPDATE ON redemptions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert sample eco store items
INSERT INTO eco_store_items (name, description, point_cost, quantity, image_url, category) VALUES
('Smart Dustbin', 'IoT-enabled dustbin with overflow sensors', 500, 15, 'https://images.pexels.com/photos/3735187/pexels-photo-3735187.jpeg?auto=compress&cs=tinysrgb&w=400', 'dustbins'),
('Organic Compost Kit', 'Complete kit for home composting', 300, 25, 'https://images.pexels.com/photos/1444321/pexels-photo-1444321.jpeg?auto=compress&cs=tinysrgb&w=400', 'compost'),
('Recycling Tools Set', 'Professional tools for waste segregation', 400, 12, 'https://images.pexels.com/photos/3735196/pexels-photo-3735196.jpeg?auto=compress&cs=tinysrgb&w=400', 'tools'),
('Air Purifying Plants', 'Set of 5 air purifying indoor plants', 200, 30, 'https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=400', 'plants'),
('Eco-Friendly Bags', 'Reusable jute bags for shopping', 150, 50, 'https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg?auto=compress&cs=tinysrgb&w=400', 'tools'),
('Solar LED Lights', 'Solar-powered LED lights for gardens', 350, 20, 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400', 'tools')
ON CONFLICT DO NOTHING;