import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { saveMessage, updateConversationTitle } from "@/lib/db";
import { getLocalTools } from "@/lib/local-tools";

const MCP_URL = process.env.MCP_URL || "http://localhost:3001/mcp";
const MCP_API_KEY = process.env.MCP_API_KEY || "dev-secret-key";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_MODEL = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

async function getMCPTools(): Promise<Record<string, any>> {
  const client = new Client(
    {
      name: "aztec-web-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  const transport = new StreamableHTTPClientTransport(
    new URL(MCP_URL),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${MCP_API_KEY}`,
        },
      },
    }
  );

  let connected = false;

  try {
    await client.connect(transport);
    connected = true;

    const toolsResult = await client.listTools();
    const tools: Record<string, any> = {};

    for (const tool of toolsResult.tools) {
      tools[tool.name] = {
        description: tool.description,
        parameters: tool.inputSchema,
        execute: async (args: any) => {
          const result = await client.callTool({
            name: tool.name,
            arguments: args,
          });
          return result;
        },
      };
    }

    return tools;
  } catch (error) {
    console.error("Failed to load MCP tools:", error);
    return {};
  } finally {
    if (connected) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Failed to close MCP client:", closeError);
      }
    }
  }
}

function isModelNotFoundError(error: unknown): boolean {
  const errorWithData = error as { data?: { error?: { code?: string } } };
  return errorWithData?.data?.error?.code === "model_not_found";
}

function generateSystemPrompt(
  pillar: string,
  industry: string,
  toolSource: "mcp" | "local"
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

  const toolExpectation =
    toolSource === "mcp"
      ? "Use the MCP tools to ground every recommendation in verified catalog data."
      : "You are running in catalog fallback mode. The only available knowledge comes from the embedded Aztec catalog tools—call `search_lessons` (and any other relevant tool) before you answer so every recommendation is backed by real lesson codes. If the tools do not return supporting lessons, clearly tell the user you could not find a match instead of guessing.";

  return `You are the Aztec IET Assistant, helping staff create and retrieve educational content from Aztec's curriculum catalog.

CURRENT CONTEXT:
- Pillar: ${pillar} (${pillarContext})
- Target Industry: ${industry}
- Tool mode: ${toolSource === "mcp" ? "Model Context Protocol (remote server)" : "Local catalog fallback"}

INSTRUCTIONS:
1. All recommendations and content must be grounded in Aztec lesson codes from the catalog
2. When generating scenarios or content, make them realistic and specific to ${industry}
3. Always cite lesson codes (e.g., "CBCS-101") when recommending materials
4. Keep responses concise and actionable
5. For ${industry} contexts, use industry-appropriate terminology and realistic scenarios
6. When students need placement or remediation, use the catalog to recommend specific entry points
7. ${toolExpectation}

AVAILABLE TOOLS:
- search_lessons: Find lessons by topic, pillar, or code
- get_sequence: Get ordered course structure with prerequisites
- apply_locator_results: Recommend placement based on assessment scores
- generate_contextualized_soft_skill: Create industry-specific soft skills scenarios
- generate_contextualized_academic: Create industry-contextualized academic content
- remediation_plan_from_cert_gaps: Build remediation plans from certification exam gaps
- program_requirements: Get certification program details

Always prioritize accuracy and cite specific lesson codes in your recommendations.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, conversationId, pillar = "academic", industry = "healthcare" } = body;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500 }
      );
    }

    const mcpTools = await getMCPTools();
    const hasMcpTools = Object.keys(mcpTools).length > 0;
    const toolSource: "mcp" | "local" = hasMcpTools ? "mcp" : "local";
    const tools = hasMcpTools ? mcpTools : getLocalTools();

    if (!hasMcpTools) {
      console.warn(
        "Falling back to embedded catalog tools because MCP server is unavailable."
      );
    }

    const createStream = async (modelName: string) =>
      streamText({
        model: openai(modelName),
        system: generateSystemPrompt(pillar, industry, toolSource),
        messages,
        tools,
        maxSteps: 5,
        onFinish: async ({ text }) => {
          if (conversationId) {
            await saveMessage(
              conversationId,
              "user",
              messages[messages.length - 1].content
            );
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
