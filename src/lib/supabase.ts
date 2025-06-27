import { createClient } from '@supabase/supabase-js';

// Use fallback values if environment variables are not set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create client with error handling
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a mock client to prevent app crashes
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        })
      }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
    })
  };
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