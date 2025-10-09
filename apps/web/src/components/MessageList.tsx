"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat";

interface MessageListProps {
  messages: ChatMessage[];
  onQuickReplySelect?: (option: string, question: string) => void;
  isBusy?: boolean;
}

export default function MessageList({
  messages,
  onQuickReplySelect,
  isBusy = false,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-6 px-4 py-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-3xl rounded-lg px-4 py-3 ${
              message.role === "user"
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 bg-white text-neutral-900"
            }`}
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
            {message.role === "assistant" &&
              message.quickReplies &&
              message.quickReplies.options.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.quickReplies.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="rounded-full border border-purple-200 bg-purple-50 px-4 py-1 text-sm font-medium text-purple-800 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() =>
                        onQuickReplySelect?.(option, message.quickReplies!.question)
                      }
                      disabled={isBusy}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            {message.role === "assistant" && (
              <div className="mt-2 text-xs text-neutral-500">
                {new Date(message.createdAt || Date.now()).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
