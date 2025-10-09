"use client";

import { useState, type ChangeEventHandler, type FormEventHandler } from "react";
import MessageList from "@/components/MessageList";
import ChatComposer from "@/components/ChatComposer";
import PathwaySelector from "@/components/PathwaySelector";
import type { ChatMessage } from "@/types/chat";

const PATHWAY_OPTIONS = [
  {
    id: "pharmacy-technician",
    label: "Pharmacy Technician",
    description: "PTCB-aligned coursework and lab practice for pharmacy teams.",
    status: "available" as const,
  },
  {
    id: "cbcs",
    label: "Certified Coding and Billing Specialist (CBCS)",
    description: "Coding accuracy, claims management, and revenue cycle skills.",
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

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
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

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationForRequest.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { reply?: string };
      const assistantText = data?.reply?.trim()
        ? data.reply.trim()
        : "I'm sorry—something went wrong processing that. Please try again.";

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    void sendMessage(input);
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
            <MessageList messages={messages} />
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
