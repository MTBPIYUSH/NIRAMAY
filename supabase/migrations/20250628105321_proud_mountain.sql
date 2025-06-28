/*
  # Create eco_products table for Eco Store functionality

  1. New Tables
    - `eco_products`
      - `id` (uuid, primary key)
      - `name` (text, product name)
      - `description` (text, product description)
      - `points` (integer, points required to redeem)
      - `image_url` (text, product image URL)
      - `category` (text, product category with constraint)
      - `stock` (integer, available stock)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `eco_products` table
    - Add policy for authenticated users to read products
    - Add policy for admin users to manage products

  3. Sample Data
    - Insert sample eco-products for the store
*/

-- Create the eco_products table
CREATE TABLE IF NOT EXISTS public.eco_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    points integer NOT NULL DEFAULT 0,
    image_url text NOT NULL,
    category text NOT NULL,
    stock integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT eco_products_category_check CHECK (category IN ('dustbins', 'compost', 'tools', 'plants'))
);

-- Enable Row Level Security
ALTER TABLE public.eco_products ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Policy to allow all authenticated users to read eco_products
CREATE POLICY "Allow authenticated users to read eco products"
ON public.eco_products FOR SELECT
TO authenticated
USING (true);

-- Policy to allow admin users to insert, update, and delete eco_products
CREATE POLICY "Allow admin users to manage eco products"
ON public.eco_products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER eco_products_updated_at
BEFORE UPDATE ON public.eco_products
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert sample eco-products
INSERT INTO public.eco_products (name, description, points, image_url, category, stock) VALUES
('Smart Dustbin', 'IoT-enabled dustbin with overflow sensors for smart waste management', 500, 'https://images.pexels.com/photos/3735187/pexels-photo-3735187.jpeg?auto=compress&cs=tinysrgb&w=400', 'dustbins', 15),
('Organic Compost Kit', 'Complete kit for home composting with instructions and tools', 300, 'https://images.pexels.com/photos/1444321/pexels-photo-1444321.jpeg?auto=compress&cs=tinysrgb&w=400', 'compost', 25),
('Recycling Tools Set', 'Professional tools for waste segregation and recycling', 400, 'https://images.pexels.com/photos/3735196/pexels-photo-3735196.jpeg?auto=compress&cs=tinysrgb&w=400', 'tools', 12),
('Air Purifying Plants', 'Set of 5 air purifying indoor plants for cleaner air', 200, 'https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=400', 'plants', 30),
('Eco-Friendly Bags', 'Reusable jute bags for shopping and daily use', 150, 'https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg?auto=compress&cs=tinysrgb&w=400', 'tools', 50),
('Solar LED Lights', 'Solar-powered LED lights for gardens and outdoor spaces', 350, 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400', 'tools', 20),
('Bamboo Water Bottle', 'Eco-friendly bamboo water bottle with steel interior', 180, 'https://images.pexels.com/photos/3735196/pexels-photo-3735196.jpeg?auto=compress&cs=tinysrgb&w=400', 'tools', 40),
('Vermi-Compost Bin', 'Complete vermi-composting setup for kitchen waste', 450, 'https://images.pexels.com/photos/1444321/pexels-photo-1444321.jpeg?auto=compress&cs=tinysrgb&w=400', 'compost', 18);