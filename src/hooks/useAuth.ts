import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set a maximum loading time of 1.5 seconds
    const loadingTimeout = setTimeout(() => {
      console.log('Auth loading timeout, setting loading to false');
      setLoading(false);
    }, 1500);

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Session error (expected if not configured):', error.message);
          setLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }

        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.log('Auth initialization error (expected if not configured):', error);
      } finally {
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    getInitialSession();

    // Listen for auth changes
    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        }
      );
      subscription = data.subscription;
    } catch (error) {
      console.log('Auth listener error (expected if not configured):', error);
      setLoading(false);
    }

    return () => {
      clearTimeout(loadingTimeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('Profile fetch error (expected if not configured):', error.message);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.log('Profile fetch error (expected if not configured):', error);
    }
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    aadhar: string;
    phone?: string;
  }) => {
    try {
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

      if (error) throw error;

      // Create profile after successful auth signup
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              role: 'citizen',
              name: userData.name,
              aadhar: userData.aadhar,
              phone: userData.phone,
              points: 0
            }
          ]);

        if (profileError) {
          console.log('Profile creation error:', profileError.message);
        }
      }

      return { data, error: null };
    } catch (error: any) {
      console.log('SignUp error:', error.message);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.log('SignIn error:', error.message);
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
    } catch (error: any) {
      console.log('SignOut error:', error.message);
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