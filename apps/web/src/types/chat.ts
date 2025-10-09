export type ChatMessageRole = "assistant" | "user";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
}
