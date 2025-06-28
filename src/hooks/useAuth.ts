import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session with timeout and error handling
    const getInitialSession = async () => {
      try {
        // Set a timeout for the session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (error) {
          console.error('Error getting session:', error);
          // Clear any stale session data
          await clearAuthState();
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          console.log('Found existing session for user:', session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log('No existing session found');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        // Clear any stale session data on error
        await clearAuthState();
      } finally {
        if (mounted) {
          setLoading(false);
          setSessionChecked(true);
        }
      }
    };

    // Clear authentication state
    const clearAuthState = async () => {
      try {
        // Clear Supabase session
        await supabase.auth.signOut();
        
        // Clear local storage items that might be causing issues
        const keysToRemove = [
          'supabase.auth.token',
          'sb-qnqbbvbotcqmpdtixlgi-auth-token',
          'sb-auth-token'
        ];
        
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          } catch (e) {
            // Ignore errors when clearing storage
          }
        });

        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error clearing auth state:', error);
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;

        try {
          if (event === 'SIGNED_OUT' || !session?.user) {
            setUser(null);
            setProfile(null);
          } else if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          await clearAuthState();
        } finally {
          if (mounted && sessionChecked) {
            setLoading(false);
          }
        }
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Add timeout to profile fetch - increased from 8000ms to 15000ms
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 15000)
      );

      const { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

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

      // Profile will be fetched automatically by the auth state change listener
      
      return { data, error: null };
    } catch (error: unknown) {
      console.error('Signin error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setProfile(null);
      
      // Clear any cached data
      const keysToRemove = [
        'supabase.auth.token',
        'sb-qnqbbvbotcqmpdtixlgi-auth-token',
        'sb-auth-token'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          // Ignore errors when clearing storage
        }
      });
      
      return { error: null };
    } catch (error: unknown) {
      return { error };
    } finally {
      setLoading(false);
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