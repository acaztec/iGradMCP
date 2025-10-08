import { streamText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { saveMessage, updateConversationTitle } from "@/lib/db";
import {
  type Pillar,
  type LessonRecord,
  searchLessons,
} from "@/lib/catalog";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_MODEL = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

function isModelNotFoundError(error: unknown): boolean {
  const errorWithData = error as { data?: { error?: { code?: string } } };
  return errorWithData?.data?.error?.code === "model_not_found";
}

function isValidPillar(value: string): value is Pillar {
  return value === "academic" || value === "soft" || value === "cte";
}

function normalizeContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object" && "text" in entry) {
          const textValue = (entry as { text?: unknown }).text;
          return typeof textValue === "string" ? textValue : "";
        }
        return "";
      })
      .join(" ")
      .trim();
  }

  if (content && typeof content === "object" && "text" in content) {
    const textValue = (content as { text?: unknown }).text;
    if (typeof textValue === "string") {
      return textValue;
    }
  }

  return "";
}

function getLastUserMessageContent(messages: CoreMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role === "user") {
      return normalizeContent(message.content);
    }
  }
  return "";
}

function formatLessonsForPrompt(lessons: LessonRecord[]): string {
  if (lessons.length === 0) {
    return "No catalog matches were found for the latest request.";
  }

  return lessons
    .map(
      (lesson) =>
        `• ${lesson.code}: ${lesson.lesson} — ${lesson.course} / ${lesson.subject} / ${lesson.unit}\n  Description: ${lesson.description}`
    )
    .join("\n");
}

function getCatalogContext(
  query: string,
  pillar: string
): { summary: string; matches: LessonRecord[] } {
  const normalizedQuery = query.trim();
  const pillarFilter = isValidPillar(pillar) ? (pillar as Pillar) : undefined;

  if (!normalizedQuery) {
    return {
      summary:
        "No user query text was available to perform a catalog search. Inform the user if you cannot provide grounded lessons.",
      matches: [],
    };
  }

  const matches = searchLessons(normalizedQuery, { pillar: pillarFilter }).slice(0, 10);

  if (matches.length === 0) {
    return {
      summary: `Catalog search for "${normalizedQuery}" returned no results. Be explicit about the lack of matches instead of guessing.`,
      matches,
    };
  }

  return {
    summary: `Catalog search for "${normalizedQuery}"${
      pillarFilter ? ` within the ${pillarFilter} pillar` : ""
    } produced ${matches.length} match(es). Prioritize these when responding and cite their codes.\n${formatLessonsForPrompt(
      matches
    )}`,
    matches,
  };
}

function generateSystemPrompt(
  pillar: string,
  industry: string,
  catalogSummary: string
): string {
  const pillarContextMap = {
    academic:
      "Bridge Pre-HSE (Academic) - Focus on foundational reading, math, and language skills for adult learners preparing for high school equivalency exams.",
    soft: "Ready for Work (Soft Skills) - Emphasize workplace readiness, professional communication, teamwork, and industry-specific soft skills.",
    cte: "CBCS/CTE (Career Technical Education) - Concentrate on certification preparation, technical competencies, and career-specific training.",
  } as const;

  const pillarContext =
    pillarContextMap[pillar as keyof typeof pillarContextMap] ??
    pillarContextMap.academic;

  return `You are the Aztec IET Assistant, helping staff create and retrieve educational content from Aztec's curriculum catalog.

CURRENT CONTEXT:
- Pillar: ${pillar} (${pillarContext})
- Target Industry: ${industry}

INSTRUCTIONS:
1. All recommendations and content must be grounded in Aztec lesson codes from the catalog
2. When generating scenarios or content, make them realistic and specific to ${industry}
3. Always cite lesson codes (e.g., "CBCS-101") when recommending materials
4. Keep responses concise and actionable
5. For ${industry} contexts, use industry-appropriate terminology and realistic scenarios
6. When students need placement or remediation, use the catalog to recommend specific entry points
7. Use the catalog context provided below to justify every recommendation. If the context indicates there were no matches, clearly state that you could not find a relevant lesson instead of fabricating one.

CATALOG CONTEXT FOR THE LATEST USER REQUEST:
${catalogSummary}

Always prioritize accuracy and cite specific lesson codes in your recommendations.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages: rawMessages,
      conversationId,
      pillar = "academic",
      industry = "healthcare",
    } = body;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500 }
      );
    }

    const messages: CoreMessage[] = Array.isArray(rawMessages)
      ? rawMessages.map((message: CoreMessage) => {
          if (
            message.role === "user" ||
            message.role === "assistant" ||
            message.role === "system"
          ) {
            return {
              ...message,
              content: normalizeContent(message.content),
            };
          }

          return message;
        })
      : [];

    const latestUserText = getLastUserMessageContent(messages);
    const { summary: catalogSummary } = getCatalogContext(latestUserText, pillar);

    const createStream = async (modelName: string) =>
      streamText({
        model: openai(modelName),
        system: generateSystemPrompt(pillar, industry, catalogSummary),
        messages,
        onFinish: async ({ text }) => {
          if (conversationId) {
            const userContent = latestUserText || messages[messages.length - 1]?.content || "";
            await saveMessage(conversationId, "user", userContent);
            await saveMessage(conversationId, "assistant", text);

            if (messages.length === 1) {
              const title = text.substring(0, 60) + (text.length > 60 ? "..." : "");
              await updateConversationTitle(conversationId, title);
            }
          }
        },
      });

    let result: Awaited<ReturnType<typeof createStream>>;

    try {
      result = await createStream(OPENAI_MODEL);
    } catch (error) {
      if (isModelNotFoundError(error) && OPENAI_MODEL !== DEFAULT_OPENAI_MODEL) {
        console.warn(
          `Model "${OPENAI_MODEL}" is unavailable. Falling back to "${DEFAULT_OPENAI_MODEL}".`
        );
        result = await createStream(DEFAULT_OPENAI_MODEL);
      } else {
        throw error;
      }
    }

    return result.toDataStreamResponse();
  } catch (error) {
    if (isModelNotFoundError(error)) {
      const attemptedModelMessage =
        OPENAI_MODEL !== DEFAULT_OPENAI_MODEL
          ? `Tried "${OPENAI_MODEL}" and fallback "${DEFAULT_OPENAI_MODEL}".`
          : `Tried "${DEFAULT_OPENAI_MODEL}".`;

      console.error("Chat API error: configured OpenAI model is unavailable", error);
      return new Response(
        JSON.stringify({
          error: `The configured OpenAI model is unavailable. ${attemptedModelMessage} Update OPENAI_MODEL or ensure your account has access to at least one supported model.`,
        }),
        { status: 502 }
      );
    }

    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
