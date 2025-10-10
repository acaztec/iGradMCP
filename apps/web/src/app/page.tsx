"use client";

import { useState, type ChangeEventHandler, type FormEventHandler } from "react";
import MessageList from "@/components/MessageList";
import ChatComposer from "@/components/ChatComposer";
import PathwaySelector from "@/components/PathwaySelector";
import type { ChatMessage } from "@/types/chat";

const PATHWAY_OPTIONS = [
  {
    id: "cbcs",
    label: "Certified Billing and Coding Specialist (CBCS)",
    description: "Claims processing, coding accuracy, and compliance preparation.",
    status: "available" as const,
  },
  {
    id: "pharmacy-technician",
    label: "Pharmacy Technician",
    description: "PTCB-aligned coursework and lab practice for pharmacy teams.",
    status: "coming-soon" as const,
  },
  {
    id: "ccma",
    label: "Certified Clinical Medical Assistant (CCMA)",
    description: "Hands-on patient care, clinical procedures, and exam preparation.",
    status: "coming-soon" as const,
  },
  {
    id: "cmaa",
    label: "Certified Medical Administrative Assistant (CMAA)",
    description: "Front-desk operations, scheduling systems, and medical records.",
    status: "coming-soon" as const,
  },
];

type QuickReply = NonNullable<ChatMessage["quickReplies"]>;

function parseAssistantMessage(content: string): {
  content: string;
  quickReplies: QuickReply | null;
} {
  const lines = content.split("\n");
  const displayLines: string[] = [];
  let quickReplies: QuickReply | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!quickReplies) {
      const trimmedLine = line.trim();

      if (trimmedLine.length > 0) {
        const questionCandidate = trimmedLine.replace(/[”"]+$/, "");
        const questionMarkIndex = questionCandidate.indexOf("?");
        const hasQuestionMark = questionMarkIndex !== -1;

        if (hasQuestionMark) {
          const questionText = questionCandidate
            .slice(0, questionMarkIndex + 1)
            .trim();
          const trailingText = questionCandidate
            .slice(questionMarkIndex + 1)
            .trim();
          const helperLineRegex = /select all that apply|check all that apply/i;

          let selectionMode: QuickReply["selectionMode"] = "single";
          const helperSegments: string[] = [];

          if (trailingText.length > 0) {
            helperSegments.push(trailingText);

            if (helperLineRegex.test(trailingText)) {
              selectionMode = "multiple";
            }
          }

          const options: string[] = [];
          const helperLinesFromMessage: string[] = [];
          let optionIndex = index + 1;

          while (optionIndex < lines.length) {
            const optionLineRaw = lines[optionIndex];
            const optionLine = optionLineRaw.trim();

            if (optionLine.length === 0) {
              optionIndex += 1;
              continue;
            }

            if (!optionLine.startsWith("•")) {
              if (helperLineRegex.test(optionLine)) {
                helperSegments.push(optionLine);
                helperLinesFromMessage.push(optionLineRaw);
                selectionMode = "multiple";
                optionIndex += 1;
                continue;
              }

              break;
            }

            const normalizedOption = optionLine.replace(/^•\s*/, "").trim();

            if (normalizedOption.length > 0) {
              options.push(normalizedOption);
            }

            optionIndex += 1;
          }

          if (
            options.length > 0 &&
            options.length <= 6 &&
            options.every((option) => option.length <= 160)
          ) {
            const normalizedHelperSegments = helperSegments
              .map((segment) => segment.trim())
              .filter(Boolean);
            const uniqueHelperSegments = Array.from(
              new Set(normalizedHelperSegments)
            );
            const combinedHelperText =
              uniqueHelperSegments.join(" ") || null;

            quickReplies = {
              question: questionText,
              options,
              selectionMode,
              helperText: combinedHelperText,
            };

            displayLines.push(line);

            for (const helperLine of helperLinesFromMessage) {
              displayLines.push(helperLine);
            }

            index = optionIndex - 1;
            continue;
          }
        }
      }
    }

    displayLines.push(line);
  }

  const cleanedContent = displayLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  return {
    content: cleanedContent,
    quickReplies,
  };
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQuickReply, setPendingQuickReply] = useState<QuickReply | null>(
    null
  );
  const [selectedQuickReplyOptions, setSelectedQuickReplyOptions] = useState<
    string[]
  >([]);

  const sendMessage = async (
    content: string,
    context?: { question?: string }
  ) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isLoading) {
      return;
    }

    const timestamp = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: `user-${timestamp}`,
      role: "user",
      content: trimmedContent,
      createdAt: timestamp,
    };

    const conversationForRequest = [...messages, userMessage];
    setMessages(conversationForRequest);
    setInput("");
    setIsLoading(true);
    setPendingQuickReply(null);
    setSelectedQuickReplyOptions([]);

    const requestMessages = conversationForRequest.map((message) => ({
      role: message.role,
      content:
        message.id === userMessage.id && context?.question
          ? `${context.question}\n${trimmedContent}`
          : message.content,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: requestMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { reply?: string };
      const assistantText = data?.reply?.trim()
        ? data.reply.trim()
        : "I'm sorry—something went wrong processing that. Please try again.";

      const parsedAssistant = parseAssistantMessage(assistantText);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: parsedAssistant.content,
        createdAt: new Date().toISOString(),
        quickReplies: parsedAssistant.quickReplies,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setPendingQuickReply(parsedAssistant.quickReplies ?? null);
      setSelectedQuickReplyOptions([]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const assistantMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        content:
          "I couldn't reach the assistant just now. Please check your connection and try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setPendingQuickReply(null);
      setSelectedQuickReplyOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    void sendMessage(
      input,
      pendingQuickReply ? { question: pendingQuickReply.question } : undefined
    );
  };

  const handleQuickReplySelect = (option: string, question: string) => {
    if (pendingQuickReply?.selectionMode === "multiple") {
      setSelectedQuickReplyOptions((prev) => {
        if (!pendingQuickReply || pendingQuickReply.question !== question) {
          return prev;
        }

        if (prev.includes(option)) {
          return prev.filter((value) => value !== option);
        }

        return [...prev, option];
      });
      return;
    }

    void sendMessage(option, { question });
  };

  const handleQuickReplySubmit = (question: string) => {
    if (
      !pendingQuickReply ||
      pendingQuickReply.selectionMode !== "multiple" ||
      pendingQuickReply.question !== question ||
      selectedQuickReplyOptions.length === 0
    ) {
      return;
    }

    const responseContent = selectedQuickReplyOptions.join("\n");
    setSelectedQuickReplyOptions([]);
    void sendMessage(responseContent, { question });
  };

  const handleInputChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    setInput(event.target.value);
  };

  const handlePathwaySelect = (option: (typeof PATHWAY_OPTIONS)[number]) => {
    setSelectedPathway(option.id);
    void sendMessage(option.label);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-50 via-white to-white">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <PathwaySelector
          options={PATHWAY_OPTIONS}
          selectedPathway={selectedPathway}
          isBusy={isLoading}
          onSelect={handlePathwaySelect}
        />
        <section className="flex flex-1 flex-col rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="flex-1 overflow-y-auto">
            <MessageList
              messages={messages}
              onQuickReplySelect={handleQuickReplySelect}
              onQuickReplySubmit={handleQuickReplySubmit}
              activeQuickReplyQuestion={pendingQuickReply?.question ?? null}
              selectedQuickReplyOptions={selectedQuickReplyOptions}
              isBusy={isLoading}
            />
          </div>
          <ChatComposer
            input={input}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </section>
      </main>
    </div>
  );
}
