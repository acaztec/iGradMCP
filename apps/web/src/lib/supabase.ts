import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase() {
  if (typeof window === "undefined" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

export const supabase = getSupabase()!;

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  pillar: string;
  industry: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  structured_data?: any;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  pillar: string;
  industry: string;
  last_conversation_id?: string;
  updated_at: string;
}
