import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Use environment variables if available, otherwise fallback to hardcoded values
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://tpcaqzkzglrddxqjwpbt.supabase.co";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwY2Fxemt6Z2xyZGR4cWp3cGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDQwMzIsImV4cCI6MjA1ODIyMDAzMn0.dWICiWvvlyR1HKbtF9hQj3NMD67wPFumtwa5NgQuwDw";

console.log("Initializing Supabase client with URL:", supabaseUrl);

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

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
