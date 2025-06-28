import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        
        // If profile doesn't exist, try to create one
        if (error.code === 'PGRST116') { // No rows returned
          console.log('Profile not found, attempting to create one...');
          await createProfileForUser(userId);
          return;
        }
        
        setProfile(null);
        return;
      }

      console.log('Profile fetched:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const createProfileForUser = async (userId: string) => {
    try {
      console.log('Creating profile for existing user:', userId);
      
      // Get user metadata from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user data:', userError);
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            role: user.user_metadata?.role || 'citizen',
            name: user.user_metadata?.name || 'User',
            aadhar: user.user_metadata?.aadhar,
            phone: user.user_metadata?.phone,
            points: 0
          }
        ]);

      if (profileError) {
        console.error('Error creating profile for existing user:', profileError);
        return;
      }

      console.log('Profile created for existing user');
      // Fetch the profile again
      await fetchProfile(userId);
    } catch (error) {
      console.error('Error in createProfileForUser:', error);
    }
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    aadhar: string;
    phone?: string;
  }) => {
    try {
      console.log('Starting signup process...');
      
      // First, create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            aadhar: userData.aadhar,
            phone: userData.phone,
            role: 'citizen'
          }
        }
      });

      if (error) {
        console.error('Auth signup error:', error);
        throw error;
      }

      console.log('Auth signup successful:', data);

      // Note: Profile creation will be handled by a database trigger
      // or we can create it after email confirmation
      // For now, we'll let the auth state change handle profile creation
      
      return { data, error: null };
    } catch (error: unknown) {
      console.error('Signup error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Starting signin process...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Signin error:', error);
        throw error;
      }

      console.log('Signin successful:', data);

      // If signin is successful, fetch the profile
      if (data.user) {
        // Add a small delay to allow any triggers to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchProfile(data.user.id);
      }

      return { data, error: null };
    } catch (error: unknown) {
      console.error('Signin error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      
      return { error: null };
    } catch (error: unknown) {
      return { error };
    }
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };
};