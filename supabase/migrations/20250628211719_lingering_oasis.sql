/*
  # Complete Niramay Database Schema Setup

  This migration creates the complete database schema for the Niramay waste management platform.

  ## Tables Created:
  1. **profiles** - User profiles with role-based access
  2. **reports** - Waste reports submitted by citizens
  3. **reward_transactions** - Eco-points transaction history
  4. **eco_store_items** - Products available in eco store
  5. **redemptions** - User redemptions from eco store
  6. **notifications** - System notifications for users

  ## Security:
  - Row Level Security (RLS) enabled on all tables
  - Role-based access policies
  - Proper foreign key constraints
  - Optimized indexes for performance

  ## Functions:
  - Auto-update timestamps
  - User profile creation triggers
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create trigger functions
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_report_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be used for additional user setup logic
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.redemptions CASCADE;
DROP TABLE IF EXISTS public.eco_store_items CASCADE;
DROP TABLE IF EXISTS public.reward_transactions CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    role text NOT NULL,
    aadhar text NULL,
    name text NOT NULL,
    phone text NULL,
    ward text NULL,
    city text NULL,
    created_at timestamp with time zone DEFAULT now() NULL,
    updated_at timestamp with time zone DEFAULT now() NULL,
    status text DEFAULT 'available'::text NULL,
    eco_points int4 DEFAULT 0 NULL,
    address text NULL,
    latitude float8 NULL,
    longitude float8 NULL,
    assigned_ward text NULL,
    current_task_id uuid NULL,
    task_completion_count int4 DEFAULT 0 NULL,
    
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_aadhar_key UNIQUE (aadhar),
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['citizen'::text, 'admin'::text, 'subworker'::text]))),
    CONSTRAINT profiles_status_check CHECK ((status = ANY (ARRAY['available'::text, 'busy'::text, 'offline'::text]))),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create reports table
CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    images text[] NOT NULL,
    lat float8 NOT NULL,
    lng float8 NOT NULL,
    address text NULL,
    status text DEFAULT 'submitted'::text NULL,
    created_at timestamp with time zone DEFAULT now() NULL,
    updated_at timestamp with time zone DEFAULT now() NULL,
    assigned_to uuid NULL,
    proof_image text NULL,
    proof_lat float8 NULL,
    proof_lng float8 NULL,
    rejection_comment text NULL,
    eco_points int4 DEFAULT 20 NULL,
    priority_level text DEFAULT 'medium'::text NULL,
    ai_analysis jsonb NULL,
    
    CONSTRAINT reports_pkey PRIMARY KEY (id),
    CONSTRAINT reports_priority_level_check CHECK ((priority_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT reports_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add foreign key constraint for profiles current_task_id (after reports table exists)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_current_task_id_fkey 
FOREIGN KEY (current_task_id) REFERENCES public.reports(id) ON DELETE SET NULL;

-- Create reward_transactions table
CREATE TABLE public.reward_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    report_id uuid NULL,
    points int4 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NULL,
    
    CONSTRAINT reward_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT reward_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT reward_transactions_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE
);

-- Create eco_store_items table
CREATE TABLE public.eco_store_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NULL,
    point_cost int4 DEFAULT 0 NOT NULL,
    quantity int4 DEFAULT 0 NOT NULL,
    image_url text NOT NULL,
    category text NOT NULL,
    is_active bool DEFAULT true NULL,
    created_at timestamp with time zone DEFAULT now() NULL,
    updated_at timestamp with time zone DEFAULT now() NULL,
    
    CONSTRAINT eco_store_items_pkey PRIMARY KEY (id),
    CONSTRAINT eco_store_items_category_check CHECK ((category = ANY (ARRAY['dustbins'::text, 'compost'::text, 'tools'::text, 'plants'::text, 'vouchers'::text])))
);

-- Create redemptions table
CREATE TABLE public.redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    item_id uuid NOT NULL,
    quantity int4 DEFAULT 1 NOT NULL,
    total_points_spent int4 NOT NULL,
    status text DEFAULT 'pending'::text NULL,
    delivery_address text NULL,
    created_at timestamp with time zone DEFAULT now() NULL,
    updated_at timestamp with time zone DEFAULT now() NULL,
    
    CONSTRAINT redemptions_pkey PRIMARY KEY (id),
    CONSTRAINT redemptions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text]))),
    CONSTRAINT redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT redemptions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.eco_store_items(id) ON DELETE CASCADE
);

-- Create notifications table
CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NULL,
    is_read bool DEFAULT false NULL,
    related_report_id uuid NULL,
    created_at timestamp with time zone DEFAULT now() NULL,
    
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text, 'assignment'::text, 'approval'::text, 'rejection'::text]))),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT notifications_related_report_id_fkey FOREIGN KEY (related_report_id) REFERENCES public.reports(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_profiles_assigned_ward ON public.profiles USING btree (assigned_ward);
CREATE INDEX idx_profiles_current_task ON public.profiles USING btree (current_task_id);
CREATE INDEX idx_profiles_eco_points ON public.profiles USING btree (eco_points DESC);
CREATE INDEX idx_profiles_location ON public.profiles USING btree (latitude, longitude);
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX idx_profiles_status ON public.profiles USING btree (status);
CREATE INDEX idx_profiles_ward ON public.profiles USING btree (ward);
CREATE INDEX idx_profiles_worker_status ON public.profiles USING btree (role, status) WHERE (role = 'subworker'::text);

CREATE INDEX idx_reports_assigned_to ON public.reports USING btree (assigned_to);
CREATE INDEX idx_reports_priority_level ON public.reports USING btree (priority_level);
CREATE INDEX idx_reports_status ON public.reports USING btree (status);
CREATE INDEX idx_reports_user_id ON public.reports USING btree (user_id);
CREATE INDEX idx_reports_created_at ON public.reports USING btree (created_at DESC);

CREATE INDEX idx_reward_transactions_report_id ON public.reward_transactions USING btree (report_id);
CREATE INDEX idx_reward_transactions_user_id ON public.reward_transactions USING btree (user_id);

CREATE INDEX idx_eco_store_items_category ON public.eco_store_items USING btree (category);
CREATE INDEX idx_eco_store_items_point_cost ON public.eco_store_items USING btree (point_cost);
CREATE INDEX idx_eco_store_items_active ON public.eco_store_items USING btree (is_active);

CREATE INDEX idx_redemptions_status ON public.redemptions USING btree (status);
CREATE INDEX idx_redemptions_user_id ON public.redemptions USING btree (user_id);

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eco_store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can access all profiles" ON public.profiles 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policies for reports
CREATE POLICY "Users can read own reports" ON public.reports 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.reports 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all reports" ON public.reports 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can update all reports" ON public.reports 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Subworkers can update assigned reports" ON public.reports 
FOR UPDATE USING (
    auth.uid() = assigned_to AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'subworker'
    )
) WITH CHECK (
    auth.uid() = assigned_to AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'subworker'
    )
);

-- RLS Policies for reward_transactions
CREATE POLICY "Users can read own transactions" ON public.reward_transactions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON public.reward_transactions 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policies for eco_store_items
CREATE POLICY "All users can read active items" ON public.eco_store_items 
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage store items" ON public.eco_store_items 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policies for redemptions
CREATE POLICY "Users can read own redemptions" ON public.redemptions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own redemptions" ON public.redemptions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all redemptions" ON public.redemptions 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policies for notifications
CREATE POLICY "Users can read own notifications" ON public.notifications 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications 
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" ON public.notifications 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Add triggers for updated_at columns
CREATE TRIGGER profiles_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER reports_updated_at 
BEFORE UPDATE ON public.reports 
FOR EACH ROW EXECUTE FUNCTION handle_report_updated_at();

CREATE TRIGGER eco_store_items_updated_at 
BEFORE UPDATE ON public.eco_store_items 
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER redemptions_updated_at 
BEFORE UPDATE ON public.redemptions 
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert sample eco store items
INSERT INTO public.eco_store_items (name, description, point_cost, quantity, image_url, category) VALUES
('Smart Dustbin', 'IoT-enabled dustbin with overflow sensors', 500, 15, 'https://images.pexels.com/photos/3735187/pexels-photo-3735187.jpeg?auto=compress&cs=tinysrgb&w=400', 'dustbins'),
('Organic Compost Kit', 'Complete kit for home composting', 300, 25, 'https://images.pexels.com/photos/1444321/pexels-photo-1444321.jpeg?auto=compress&cs=tinysrgb&w=400', 'compost'),
('Recycling Tools Set', 'Professional tools for waste segregation', 400, 12, 'https://images.pexels.com/photos/3735196/pexels-photo-3735196.jpeg?auto=compress&cs=tinysrgb&w=400', 'tools'),
('Air Purifying Plants', 'Set of 5 air purifying indoor plants', 200, 30, 'https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=400', 'plants'),
('Eco-Friendly Bags', 'Reusable jute bags for shopping', 150, 50, 'https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg?auto=compress&cs=tinysrgb&w=400', 'tools'),
('Solar LED Lights', 'Solar-powered LED lights for gardens', 350, 20, 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400', 'tools');