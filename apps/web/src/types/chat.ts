export type ChatMessageRole = "assistant" | "user";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  quickReplies?: {
    question: string;
    options: string[];
    selectionMode?: "single" | "multiple";
    helperText?: string | null;
  } | null;
}
