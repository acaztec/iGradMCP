import { supabase } from "./supabase";
import type { Conversation, Message, UserPreferences } from "./supabase";

export async function getOrCreatePreferences(
  userId: string
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data) return data;

  const { data: newPrefs, error: createError } = await supabase
    .from("user_preferences")
    .insert({
      user_id: userId,
      pillar: "academic",
      industry: "healthcare",
    })
    .select()
    .single();

  if (createError) throw createError;
  return newPrefs;
}

export async function updatePreferences(
  userId: string,
  updates: Partial<Pick<UserPreferences, "pillar" | "industry" | "last_conversation_id">>
) {
  const { error } = await supabase
    .from("user_preferences")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) throw error;
}

export async function createConversation(
  userId: string,
  pillar: string,
  industry: string
): Promise<Conversation> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title: "New Conversation",
      pillar,
      industry,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
) {
  const { error } = await supabase
    .from("conversations")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) throw error;
}

export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  structuredData?: any
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      structured_data: structuredData,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}
