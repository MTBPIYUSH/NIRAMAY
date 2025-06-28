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

    // Get initial session with improved error handling
    const getInitialSession = async () => {
      try {
        // Increase timeout to 15 seconds and add retry logic
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 15000)
        );

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (error) {
          console.error('Error getting session:', error);
          // Don't clear auth state on network errors, just log and continue
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            setSessionChecked(true);
          }
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          console.log('Found existing session for user:', session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id, session.user);
        } else {
          console.log('No existing session found');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        // On timeout or network error, don't clear everything - just set loading to false
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setSessionChecked(true);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes with improved error handling
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
            await fetchProfile(session.user.id, session.user);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          // Don't clear auth state on profile fetch errors
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

  const fetchProfile = async (userId: string, user?: User) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Increase timeout to 15 seconds for profile fetch
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 15000)
      );

      const { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('Error fetching profile:', error);
        
        // If it's a network/timeout error, don't try to create profile
        if (error.message?.includes('timeout') || error.message?.includes('network')) {
          setProfile(null);
          return;
        }
        
        // For other errors, still try to create profile if user exists
        if (user && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.log('Profile fetch failed, but will try to create profile');
          await createProfileForUser(userId, user);
        }
        return;
      }

      if (!data) {
        // Profile doesn't exist, try to create one
        console.log('Profile not found, attempting to create one...');
        if (user) {
          await createProfileForUser(userId, user);
        }
        return;
      }

      console.log('Profile fetched:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // Only try to create profile if we have user data and it's not a timeout
      if (user && !error.message?.includes('timeout')) {
        console.log('Will attempt to create profile after fetch error');
        await createProfileForUser(userId, user);
      } else {
        setProfile(null);
      }
    }
  };

  const createProfileForUser = async (userId: string, user: User) => {
    try {
      console.log('Creating profile for user:', userId);
      
      if (!user) {
        console.error('User object not provided for profile creation');
        return;
      }

      // Add retry logic for profile creation
      let retries = 3;
      let lastError = null;

      while (retries > 0) {
        try {
          const now = new Date().toISOString();

          const { data, error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                role: user.user_metadata?.role || 'citizen',
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                aadhar: user.user_metadata?.aadhar,
                phone: user.user_metadata?.phone,
                eco_points: 0,
                status: 'available',
                created_at: now,
                updated_at: now
              }
            ])
            .select()
            .single();

          if (profileError) {
            lastError = profileError;
            console.error(`Profile creation attempt ${4 - retries} failed:`, profileError);
            
            // If it's an RLS error, break the retry loop
            if (profileError.code === '42501') {
              console.error('RLS policy violation - check database policies');
              break;
            }
            
            retries--;
            if (retries > 0) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          } else {
            console.log('Profile created successfully:', data);
            setProfile(data);
            return;
          }
        } catch (error) {
          lastError = error;
          console.error(`Profile creation attempt ${4 - retries} failed:`, error);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      console.error('Failed to create profile after all retries:', lastError);
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