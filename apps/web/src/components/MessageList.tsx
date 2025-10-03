"use client";

import { useEffect, useRef } from "react";
import type { Message } from "ai";

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-neutral-900">
            Welcome to Aztec IET Assistant
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Ask about lessons, generate contextualized content, or get
            placement recommendations.
          </p>
        </div>
      </div>
    );
  }

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
