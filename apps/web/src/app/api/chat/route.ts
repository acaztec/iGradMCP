import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { saveMessage, updateConversationTitle } from "@/lib/db";

const MCP_URL = process.env.MCP_URL || "http://localhost:3001/mcp";
const MCP_API_KEY = process.env.MCP_API_KEY || "dev-secret-key";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

  await client.connect(transport);

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

  await client.close();
  return tools;
}

function generateSystemPrompt(pillar: string, industry: string): string {
  const pillarContext = {
    academic:
      "Bridge Pre-HSE (Academic) - Focus on foundational reading, math, and language skills for adult learners preparing for high school equivalency exams.",
    soft: "Ready for Work (Soft Skills) - Emphasize workplace readiness, professional communication, teamwork, and industry-specific soft skills.",
    cte: "CBCS/CTE (Career Technical Education) - Concentrate on certification preparation, technical competencies, and career-specific training.",
  }[pillar];

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

    const result = await streamText({
      model: openai("gpt-4-turbo"),
      system: generateSystemPrompt(pillar, industry),
      messages,
      tools: mcpTools,
      maxSteps: 5,
      onFinish: async ({ text, finishReason }) => {
        if (conversationId) {
          await saveMessage(conversationId, "user", messages[messages.length - 1].content);
          await saveMessage(conversationId, "assistant", text);

          if (messages.length === 1) {
            const title = text.substring(0, 60) + (text.length > 60 ? "..." : "");
            await updateConversationTitle(conversationId, title);
          }
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
