import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a fallback client if environment variables are missing
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Running in demo mode.');
  
  // Create a mock client for demo purposes
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Demo mode - Supabase not configured') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Demo mode - Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Demo mode - Supabase not configured') })
        })
      }),
      insert: () => Promise.resolve({ error: new Error('Demo mode - Supabase not configured') })
    })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

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