import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export type Profile = {
  id: string;
  role: 'citizen' | 'admin' | 'subworker';
  aadhar?: string;
  name: string;
  email?: string;
  phone?: string;
  ward?: string;
  city?: string;
  eco_points?: number;
  status?: 'available' | 'busy' | 'offline';
  created_at: string;
  updated_at: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  assigned_ward?: string;
  current_task_id?: string;
  task_completion_count?: number;
};

// Database types for better type safety
export type DatabaseProfile = {
  id: string;
  role: string;
  aadhar?: string;
  name: string;
  phone?: string;
  ward?: string;
  city?: string;
  eco_points?: number;
  status?: string;
  created_at: string;
  updated_at: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  assigned_ward?: string;
  current_task_id?: string;
  task_completion_count?: number;
};

export type DatabaseReport = {
  id: string;
  user_id: string;
  images: string[];
  lat: number;
  lng: number;
  address: string;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  proof_image?: string;
  proof_lat?: number;
  proof_lng?: number;
  rejection_comment?: string;
  eco_points?: number;
  priority_level?: string;
  ai_analysis?: any;
  completion_timestamp?: string;
  rejection_reason?: string;
};