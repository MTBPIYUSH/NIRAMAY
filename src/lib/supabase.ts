import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = "https://tpcaqzkzglrddxqjwpbt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwY2Fxemt6Z2xyZGR4cWp3cGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDQwMzIsImV4cCI6MjA1ODIyMDAzMn0.dWICiWvvlyR1HKbtF9hQj3NMD67wPFumtwa5NgQuwDw";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
