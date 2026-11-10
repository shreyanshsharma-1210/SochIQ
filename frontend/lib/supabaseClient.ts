import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

export const supabase = (supabaseUrl && !supabaseUrl.includes("placeholder"))
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export async function getOrCreateAnonymousSession(): Promise<string | null> {
  if (!supabase) {
    // In local development or testing without remote Supabase credentials
    return null;
  }
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.access_token) {
      return sessionData.session.access_token;
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn("Supabase anonymous sign-in error:", error.message);
      return null;
    }
    return data.session?.access_token || null;
  } catch (err) {
    console.warn("Supabase auth error:", err);
    return null;
  }
}

