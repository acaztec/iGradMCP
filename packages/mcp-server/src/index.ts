import express from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ListResourcesRequestSchema, ReadResourceRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadCatalog } from "./data-loader.js";
import { registerResources } from "./resources.js";
import { createTools } from "./tools.js";

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.MCP_API_KEY || "dev-secret-key";

console.log("Loading Aztec IET catalog...");
const catalog = loadCatalog();
console.log(`Loaded ${catalog.lessons.length} lessons from ${catalog.courses.size} courses`);

const resources = registerResources(catalog);
const tools = createTools(catalog);

const server = new Server(
  {
    name: "aztec-iet-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.values(resources).map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  for (const resource of Object.values(resources)) {
    if (uri === resource.uri || uri.match(new RegExp(resource.uri.replace(/\{[^}]+\}/g, "[^/]+")))) {
      return resource.handler(uri);
    }
  }

  throw new Error(`Resource not found: ${uri}`);
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = tools[name as keyof typeof tools];
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  const parsed = tool.inputSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments: ${parsed.error.message}`);
  }

  const result = await tool.handler(parsed.data as any);
  return result;
});

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

await server.connect(transport);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    lessons: catalog.lessons.length,
    courses: catalog.courses.size,
  });
});

app.all("/mcp*", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP endpoint: POST http://localhost:${PORT}/mcp`);
});
