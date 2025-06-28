import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  role: 'citizen' | 'admin' | 'subworker';
  aadhar?: string;
  name: string;
  email?: string;
  phone?: string;
  ward?: string;
  city?: string;
  points?: number;
  eco_points?: number;
  status?: string;
  created_at: string;
  updated_at: string;
};