"use client";

import { useState, useEffect } from "react";
import { useChat } from "ai/react";
import ChatHeader from "@/components/ChatHeader";
import MessageList from "@/components/MessageList";
import ChatComposer from "@/components/ChatComposer";
import {
  getOrCreatePreferences,
  updatePreferences,
  createConversation,
} from "@/lib/db";

export default function Home() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pillar, setPillar] = useState("academic");
  const [industry, setIndustry] = useState("healthcare");
  const [userId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("aztec_user_id");
      if (!id) {
        id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("aztec_user_id", id);
      }
      return id;
    }
    return "anonymous";
  });

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      conversationId,
      pillar,
      industry,
    },
  });

  useEffect(() => {
    async function initializePreferences() {
      try {
        const prefs = await getOrCreatePreferences(userId);
        setPillar(prefs.pillar);
        setIndustry(prefs.industry);
      } catch (error) {
        console.error("Failed to load preferences:", error);
      }
    }
    initializePreferences();
  }, [userId]);

  useEffect(() => {
    async function initializeConversation() {
      if (!conversationId) {
        try {
          const conv = await createConversation(userId, pillar, industry);
          setConversationId(conv.id);
          await updatePreferences(userId, { last_conversation_id: conv.id });
        } catch (error) {
          console.error("Failed to create conversation:", error);
        }
      }
    }
    initializeConversation();
  }, [conversationId, userId, pillar, industry]);

  const handlePillarChange = async (newPillar: string) => {
    setPillar(newPillar);
    try {
      await updatePreferences(userId, { pillar: newPillar });
    } catch (error) {
      console.error("Failed to update pillar:", error);
    }
  };

  const handleIndustryChange = async (newIndustry: string) => {
    setIndustry(newIndustry);
    try {
      await updatePreferences(userId, { industry: newIndustry });
    } catch (error) {
      console.error("Failed to update industry:", error);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <ChatHeader
        pillar={pillar}
        industry={industry}
        onPillarChange={handlePillarChange}
        onIndustryChange={handleIndustryChange}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          <MessageList messages={messages} />
        </div>
      </div>
      <ChatComposer
        input={input}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
