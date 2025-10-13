"use client";

import { useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/types/chat";

type RenderableMessage = ChatMessage & { markdownContent?: string };

interface MessageListProps {
  messages: ChatMessage[];
  onQuickReplySelect?: (option: string, question: string) => void;
  onQuickReplySubmit?: (question: string) => void;
  activeQuickReplyQuestion?: string | null;
  selectedQuickReplyOptions?: string[];
  isBusy?: boolean;
}

export default function MessageList({
  messages,
  onQuickReplySelect,
  onQuickReplySubmit,
  activeQuickReplyQuestion,
  selectedQuickReplyOptions = [],
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
              <div className="space-y-3 text-neutral-900">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl font-semibold text-blue-900">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold text-blue-900">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold text-blue-900">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-sm font-semibold text-blue-900">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-900">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-neutral-900">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="text-neutral-900">{children}</em>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm leading-relaxed text-neutral-900">
                        {children}
                      </li>
                    ),
                    ul: ({ children }) => (
                      <ul className="ml-5 list-disc space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="ml-5 list-decimal space-y-1">
                        {children}
                      </ol>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-blue-700 underline"
                      >
                        {children}
                      </a>
                    ),
                    hr: () => <hr className="border-neutral-200" />,
                  }}
                >
                  {message.markdownContent}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
            )}
            {message.role === "assistant" &&
              message.quickReplies &&
              message.quickReplies.options.length > 0 && (
                <div className="mt-3 space-y-3">
                  {message.quickReplies.selectionMode === "multiple" ? (
                    <div className="space-y-2">
                      {message.quickReplies.options.map((option) => {
                        const isActiveQuickReply =
                          !!activeQuickReplyQuestion &&
                          activeQuickReplyQuestion ===
                            message.quickReplies!.question;
                        const isSelected =
                          isActiveQuickReply &&
                          selectedQuickReplyOptions.includes(option);

                        return (
                          <label
                            key={option}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                              isSelected
                                ? "border-orange-400 bg-orange-50 text-orange-900"
                                : "border-blue-100 bg-white text-neutral-900"
                            } ${
                              !isActiveQuickReply || isBusy
                                ? "opacity-60"
                                : "hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                onQuickReplySelect?.(
                                  option,
                                  message.quickReplies!.question
                                )
                              }
                              disabled={!isActiveQuickReply || isBusy}
                              className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-orange-500"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() =>
                          onQuickReplySubmit?.(message.quickReplies!.question)
                        }
                        className="w-full rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={
                          !activeQuickReplyQuestion ||
                          activeQuickReplyQuestion !==
                            message.quickReplies.question ||
                          isBusy ||
                          selectedQuickReplyOptions.length === 0
                        }
                      >
                        Submit selections
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {message.quickReplies.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className="rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() =>
                            onQuickReplySelect?.(
                              option,
                              message.quickReplies!.question
                            )
                          }
                          disabled={isBusy}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
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
              <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-orange-500" />
              Aztec IET is thinking…
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
