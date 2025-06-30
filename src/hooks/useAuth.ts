import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, DatabaseProfile } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        
        // Set a timeout for session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Session check timeout')), 10000);
        });

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (timeoutId) clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Session check error:', error);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          console.log('✅ Found existing session for user:', session.user.id);
          setUser(session.user);
          
          // Fetch profile with timeout
          await fetchProfile(session.user.id, session.user);
        } else {
          console.log('ℹ️ No existing session found');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;

        try {
          if (event === 'SIGNED_OUT' || !session?.user) {
            console.log('👋 User signed out');
            setUser(null);
            setProfile(null);
          } else if (session?.user) {
            console.log('👤 User signed in:', session.user.id);
            setUser(session.user);
            await fetchProfile(session.user.id, session.user);
          }
        } catch (error) {
          console.error('❌ Error handling auth state change:', error);
        } finally {
          if (mounted && initialized) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, user?: User) => {
    let timeoutId: NodeJS.Timeout;
    
    try {
      console.log('🔍 Fetching profile for user:', userId);
      
      // Set timeout for profile fetch
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Profile fetch timeout')), 8000);
      });

      const { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      if (timeoutId) clearTimeout(timeoutId);

      if (error) {
        console.error('❌ Profile fetch error:', error);
        
        // If profile doesn't exist and we have user data, create it
        if (error.code === 'PGRST116' && user) {
          console.log('📝 Profile not found, creating new profile...');
          await createProfileForUser(userId, user);
          return;
        }
        
        setProfile(null);
        return;
      }

      if (!data) {
        console.log('📝 Profile not found, creating new profile...');
        if (user) {
          await createProfileForUser(userId, user);
        }
        return;
      }

      console.log('✅ Profile fetched successfully:', data.role);
      
      // Convert database profile to typed profile
      const typedProfile: Profile = {
        id: data.id,
        role: data.role as 'citizen' | 'admin' | 'subworker',
        aadhar: data.aadhar,
        name: data.name,
        email: user?.email,
        phone: data.phone,
        ward: data.ward,
        city: data.city,
        eco_points: data.eco_points,
        status: data.status as 'available' | 'busy' | 'offline',
        created_at: data.created_at,
        updated_at: data.updated_at,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        assigned_ward: data.assigned_ward,
        current_task_id: data.current_task_id,
        task_completion_count: data.task_completion_count
      };
      
      setProfile(typedProfile);
    } catch (error) {
      console.error('❌ Profile fetch failed:', error);
      
      if (user) {
        console.log('🔄 Attempting to create profile after error...');
        await createProfileForUser(userId, user);
      } else {
        setProfile(null);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const createProfileForUser = async (userId: string, user: User) => {
    try {
      console.log('📝 Creating profile for user:', userId);
      
      if (!user) {
        console.error('❌ User object not provided for profile creation');
        return;
      }

      const now = new Date().toISOString();
      const profileData = {
        id: userId,
        role: user.user_metadata?.role || 'citizen',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        aadhar: user.user_metadata?.aadhar || null,
        phone: user.user_metadata?.phone || null,
        ward: user.user_metadata?.ward || null,
        city: user.user_metadata?.city || null,
        address: user.user_metadata?.address || null,
        latitude: user.user_metadata?.latitude || null,
        longitude: user.user_metadata?.longitude || null,
        assigned_ward: user.user_metadata?.assigned_ward || null,
        current_task_id: null,
        task_completion_count: 0,
        eco_points: 0,
        status: 'available',
        created_at: now,
        updated_at: now
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('❌ Profile creation failed:', error);
        
        // If it's a duplicate key error, try to fetch existing profile
        if (error.code === '23505') {
          console.log('🔄 Profile already exists, fetching...');
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (existingProfile) {
            const typedProfile: Profile = {
              id: existingProfile.id,
              role: existingProfile.role as 'citizen' | 'admin' | 'subworker',
              aadhar: existingProfile.aadhar,
              name: existingProfile.name,
              email: user.email,
              phone: existingProfile.phone,
              ward: existingProfile.ward,
              city: existingProfile.city,
              eco_points: existingProfile.eco_points,
              status: existingProfile.status as 'available' | 'busy' | 'offline',
              created_at: existingProfile.created_at,
              updated_at: existingProfile.updated_at,
              address: existingProfile.address,
              latitude: existingProfile.latitude,
              longitude: existingProfile.longitude,
              assigned_ward: existingProfile.assigned_ward,
              current_task_id: existingProfile.current_task_id,
              task_completion_count: existingProfile.task_completion_count
            };
            setProfile(typedProfile);
          }
        }
        return;
      }

      console.log('✅ Profile created successfully:', data);
      
      const typedProfile: Profile = {
        id: data.id,
        role: data.role as 'citizen' | 'admin' | 'subworker',
        aadhar: data.aadhar,
        name: data.name,
        email: user.email,
        phone: data.phone,
        ward: data.ward,
        city: data.city,
        eco_points: data.eco_points,
        status: data.status as 'available' | 'busy' | 'offline',
        created_at: data.created_at,
        updated_at: data.updated_at,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        assigned_ward: data.assigned_ward,
        current_task_id: data.current_task_id,
        task_completion_count: data.task_completion_count
      };
      
      setProfile(typedProfile);
    } catch (error) {
      console.error('❌ Error in createProfileForUser:', error);
    }
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    aadhar: string;
    phone?: string;
  }) => {
    try {
      console.log('📝 Starting signup process...');
      setLoading(true);
      
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
        console.error('❌ Signup error:', error);
        throw error;
      }

      console.log('✅ Signup successful:', data);
      return { data, error: null };
    } catch (error: unknown) {
      console.error('❌ Signup failed:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting signin process...');
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Signin error:', error);
        throw error;
      }

      console.log('✅ Signin successful:', data);
      
      // Profile will be fetched automatically by auth state change listener
      return { data, error: null };
    } catch (error: unknown) {
      console.error('❌ Signin failed:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('👋 Signing out...');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setProfile(null);
      
      console.log('✅ Signed out successfully');
      return { error: null };
    } catch (error: unknown) {
      console.error('❌ Signout error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    profile,
    loading: loading || !initialized,
    signUp,
    signIn,
    signOut,
  };
};