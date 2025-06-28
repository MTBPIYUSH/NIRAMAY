import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Using placeholder values for development.');
  // Use placeholder values to prevent the app from crashing
  const placeholderUrl = 'https://placeholder.supabase.co';
  const placeholderKey = 'placeholder-anon-key';
  
  export const supabase = createClient(placeholderUrl, placeholderKey);
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export type Profile = {
  id: string;
  role: 'citizen' | 'admin' | 'subworker';
  aadhar?: string;
  name: string;
  phone?: string;
  ward?: string;
  city?: string;
  points?: number;
  created_at: string;
  updated_at: string;
};