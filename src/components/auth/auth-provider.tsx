import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types/database";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Changed from function declaration to arrow function to fix Fast Refresh error
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for ID:", userId);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        // If profile doesn't exist, create a default one
        if (error.code === "PGRST116") {
          console.log("Profile not found, creating default profile");
          const { data: newProfile, error: createError } = await supabase
            .from("user_profiles")
            .upsert({
              id: userId,
              name: "User",
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
              points: 0,
              reports: 0,
              recycling: 0,
              level: 1,
              next_level_points: 200,
              rank: 1,
            })
            .select();

          if (createError) {
            console.error("Error creating default profile:", createError);
            return null;
          }

          console.log("Created default profile:", newProfile);
          return newProfile as UserProfile;
        }
        return null;
      }

      console.log("Fetched user profile:", data);
      return data as UserProfile;
    } catch (error) {
      console.error("Exception fetching user profile:", error);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      console.log("Refreshing user profile for:", user.email);
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth state...");
        const { data } = await supabase.auth.getSession();
        const initialSession = data.session;
        console.log("Initial session:", initialSession ? "Found" : "Not found");

        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          console.log("User found in session:", currentUser.email);
          try {
            const profile = await fetchUserProfile(currentUser.id);
            setUserProfile(profile);
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        } else {
          console.log("No user found in session");
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        try {
          const profile = await fetchUserProfile(currentUser.id);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile on auth change:", error);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("Signing in user:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
    } else {
      console.log("Sign in successful:", data.user?.email);
    }

    return { error };
  };

  const signUp = async (email: string, password: string) => {
    console.log("Signing up user:", email);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("Sign up error:", error);
    } else {
      console.log("Sign up successful:", data.user?.email);

      // Create a user profile immediately after signup if we have a user
      if (data.user) {
        try {
          await fetchUserProfile(data.user.id); // This will create a profile if it doesn't exist
        } catch (profileErr) {
          console.error("Error creating profile after signup:", profileErr);
        }
      }
    }

    return { data, error };
  };

  const signOut = async () => {
    console.log("Signing out user");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
    console.log("User signed out");
  };

  const signInWithGoogle = async () => {
    console.log("Initiating Google sign in");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const value = {
    session,
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
