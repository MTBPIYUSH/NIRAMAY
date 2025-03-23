import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Use environment variables if available, otherwise fallback to hardcoded values
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://your-project-id.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase URL or key is missing. Please check your environment variables.",
  );
}

// Ensure we have a valid URL
if (
  supabaseUrl === "https://your-project-id.supabase.co" ||
  supabaseKey === "your-anon-key"
) {
  console.warn(
    "Using placeholder Supabase credentials. Please set proper environment variables.",
  );
}

console.log("Initializing Supabase client with URL:", supabaseUrl);

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "niramay_auth_token",
  },
});

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("Supabase connection error:", error);
  } else {
    console.log(
      "Supabase connection successful",
      data.session ? "User is logged in" : "No active session",
    );
  }
});
