"use client";

import { useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/types/chat";

type RenderableMessage = ChatMessage & { markdownContent?: string };

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

  const renderMessages = useMemo<RenderableMessage[]>(() => {
    return messages.map((message) => {
      if (message.role !== "assistant") {
        return message;
      }

      const markdownContent = message.content
        .replace(/\r\n/g, "\n")
        .replace(/^\s*•\s?/gm, "- ")
        .replace(/:\n-\s/g, ":\n\n- ")
        .replace(/\n{3,}/g, "\n\n");

      return {
        ...message,
        markdownContent,
      };
    });
  }, [messages]);

  return (
    <div className="space-y-6 px-4 py-6">
      {renderMessages.map((message) => (
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
            {message.role === "assistant" && "markdownContent" in message ? (
              <ReactMarkdown
                className="space-y-3 text-sm leading-relaxed text-neutral-900"
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="whitespace-pre-wrap leading-relaxed">{children}</p>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  ul: ({ children }) => (
                    <ul className="ml-5 list-disc space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="ml-5 list-decimal space-y-1">{children}</ol>
                  ),
                }}
              >
                {message.markdownContent}
              </ReactMarkdown>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
            )}
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
      {isBusy && (
        <div className="flex justify-start">
          <div className="max-w-3xl rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-purple-500" />
              Aztec IET is thinking…
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
