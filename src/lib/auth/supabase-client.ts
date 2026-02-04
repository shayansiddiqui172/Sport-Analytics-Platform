import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("[YOUR")) {
    // Return a mock client when Supabase is not configured
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
