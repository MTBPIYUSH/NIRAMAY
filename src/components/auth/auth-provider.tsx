import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

          try {
            // First check if the user exists in auth.users
            const { data: userData, error: userError } =
              await supabase.auth.getUser();

            if (userError) {
              console.error("Error getting user:", userError);
              return null;
            }

            if (!userData.user) {
              console.error("User not found in auth.users");
              return null;
            }

            // Create the profile
            const { data: newProfile, error: createError } = await supabase
              .from("user_profiles")
              .upsert({
                id: userId,
                name: userData.user.email
                  ? userData.user.email.split("@")[0]
                  : "User",
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
              // Try a different approach if the first one fails
              const { data: retryProfile, error: retryError } = await supabase
                .from("user_profiles")
                .insert({
                  id: userId,
                  name: userData.user.email
                    ? userData.user.email.split("@")[0]
                    : "User",
                  avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                  points: 0,
                  reports: 0,
                  recycling: 0,
                  level: 1,
                  next_level_points: 200,
                  rank: 1,
                })
                .select();

              if (retryError) {
                console.error("Retry error creating profile:", retryError);
                return null;
              }

              console.log("Created default profile (retry):", retryProfile);
              return retryProfile[0] as UserProfile;
            }

            console.log("Created default profile:", newProfile);
            return newProfile[0] as UserProfile;
          } catch (err) {
            console.error("Exception creating user profile:", err);
            return null;
          }
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
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

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
        // Ensure loading state is updated even if there's an error
        setLoading(false);
      }
    };

    // Set a timeout to ensure loading state is eventually set to false
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Auth initialization timeout - forcing loading to false");
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_IN") {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const profile = await fetchUserProfile(session.user.id);
            setUserProfile(profile);
          } catch (error) {
            console.error("Error fetching user profile on sign in:", error);
          }
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setUserProfile(null);
        console.log("User signed out");
      } else if (event === "TOKEN_REFRESHED") {
        setSession(session);
      } else if (event === "USER_UPDATED") {
        setSession(session);
        setUser(session?.user ?? null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("Signing in user:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message,
        });
        return { error };
      }

      console.log("Sign in successful:", data.user?.email);
      toast({
        title: "Signed in successfully",
        description: `Welcome back, ${data.user?.email}!`,
      });

      // Manually update state to ensure it's set immediately
      setSession(data.session);
      setUser(data.user);

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
      }

      return { error: null };
    } catch (err: any) {
      console.error("Exception during sign in:", err);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: err.message || "An unexpected error occurred",
      });
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log("Signing up user:", email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Sign up error:", error);
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: error.message,
        });
        return { data, error };
      }

      console.log("Sign up successful:", data.user?.email);
      toast({
        title: "Sign up successful",
        description: "Please check your email for a confirmation link.",
      });

      // We don't create the profile immediately after signup
      // because the user needs to confirm their email first
      // The profile will be created when they sign in after confirmation

      return { data, error: null };
    } catch (err: any) {
      console.error("Exception during signup:", err);
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: err.message || "An unexpected error occurred",
      });
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    console.log("Signing out user");
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        toast({
          variant: "destructive",
          title: "Sign out failed",
          description: error.message,
        });
        return;
      }

      // Manually clear state to ensure it happens immediately
      setUser(null);
      setSession(null);
      setUserProfile(null);

      console.log("User signed out successfully");
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });

      // Force a page reload to clear any cached state
      window.location.href = "/";
    } catch (err: any) {
      console.error("Exception during sign out:", err);
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: err.message || "An unexpected error occurred",
      });
    }
  };

  const signInWithGoogle = async () => {
    console.log("Initiating Google sign in");
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Google sign in error:", error);
        toast({
          variant: "destructive",
          title: "Google sign in failed",
          description: error.message,
        });
      } else if (!data.url) {
        console.error("Google sign in failed: No redirect URL");
        toast({
          variant: "destructive",
          title: "Google sign in failed",
          description: "Failed to get authentication URL",
        });
      }
    } catch (err: any) {
      console.error("Exception during Google sign in:", err);
      toast({
        variant: "destructive",
        title: "Google sign in failed",
        description: err.message || "An unexpected error occurred",
      });
    }
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
