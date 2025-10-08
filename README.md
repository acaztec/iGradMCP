# Aztec IET Assistant

A production-ready, MCP-powered chat application that helps Aztec staff generate and retrieve IET-contextualized educational content grounded in the Aztec curriculum catalog. Supports three pillars: Academic (Bridge Pre-HSE), Soft Skills (Ready for Work), and CTE (CBCS).

## Architecture

This is a monorepo with two main packages:

- **`packages/mcp-server`** - TypeScript MCP server with HTTP transport that exposes Aztec catalog resources and tools
- **`apps/web`** - Next.js 14 web application with Vercel AI SDK integration

## Features

### MCP Server

**Resources** (read-only catalog access):
- `aztec://courses` - List all courses with pillar tags
- `aztec://course/{course}/subjects` - Get subjects for a course
- `aztec://course/{course}/subject/{subject}/units` - Get units for a subject
- `aztec://lesson/{code}` - Get full lesson details by code

**Tools** (AI-callable functions):
- `search_lessons` - Search lessons by query, pillar, or course code
- `get_sequence` - Get ordered course structure with prerequisites
- `apply_locator_results` - Recommend placement from assessment scores
- `generate_contextualized_soft_skill` - Create industry-specific soft skills scenarios
- `generate_contextualized_academic` - Generate industry-contextualized academic content
- `remediation_plan_from_cert_gaps` - Build remediation plans from exam gaps
- `program_requirements` - Get certification program details

### Web Application

- Single-page chat interface with clean, enterprise styling (inspired by principal.enrich.org)
- Real-time AI streaming with tool execution
- Persistent conversations and preferences via Supabase
- Pillar and industry selectors for contextualized responses
- Session management with browser localStorage

## Prerequisites

- Node.js 18+
- pnpm 8+
- OpenAI API key
- Supabase project (pre-configured in this project)

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd aztec-iet-assistant
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your OpenAI API key:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
OPENAI_API_KEY=your_actual_openai_api_key
```

The Supabase credentials are already configured.

### 3. Verify Data File

Ensure the Excel file is present at:
```
data/Samples for AI prototype.xlsx
```

This file contains the Aztec curriculum catalog that powers all recommendations.

## Development

### Run Both Services Locally

**Terminal 1 - MCP Server:**
```bash
pnpm dev:mcp
```

The MCP server will start on `http://localhost:3001` and load the catalog.

**Terminal 2 - Web App:**
```bash
pnpm dev
```

The web app will start on `http://localhost:3000`.

### Test MCP Tools

Run the test script to verify all MCP tools work correctly:

```bash
cd packages/mcp-server
pnpm test
```

This will execute test scenarios including:
- Search for handwashing lessons (soft skills)
- Generate academic content for healthcare
- Get course sequence for Pre-HSE
- Apply locator results with sample scores
- Generate soft skills scenarios

### MCP Inspector (Optional)

To debug MCP tools interactively, you can use the MCP Inspector:

1. Install globally:
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

2. Start the MCP server:
   ```bash
   pnpm dev:mcp
   ```

3. In another terminal, run the inspector:
   ```bash
   mcp-inspector http://localhost:3001/mcp --header "Authorization: Bearer dev-secret-key"
   ```

## Production Build

Build both packages:

```bash
pnpm build
```

This will:
1. Compile the MCP server TypeScript to `packages/mcp-server/dist/`
2. Build the Next.js app for production in `apps/web/.next/`

## Deployment

### Deploy to Vercel

⚠️ **IMPORTANT**: This is a monorepo. You MUST set Root Directory to `apps/web` in Vercel.

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - **CRITICAL**: Click "Edit" next to Root Directory and set it to `apps/web`
   - Framework will auto-detect as Next.js
   - Leave all other build settings as default

3. **Configure Environment Variables in Vercel:**
   - Add `OPENAI_API_KEY` with your OpenAI key
   - Add `MCP_URL` pointing to your deployed MCP server (see below)
   - Add `MCP_API_KEY` (use a secure value in production)
   - The Supabase variables should already be set from `.env`

4. **Deploy the MCP Server:**

   The MCP server needs to be hosted separately. Options:

   **Option A: Railway**
   ```bash
   cd packages/mcp-server
   railway init
   railway up
   ```

   **Option B: Render**
   - Create a new Web Service
   - Connect your GitHub repo
   - Set root directory to `packages/mcp-server`
   - Build command: `pnpm install && pnpm build`
   - Start command: `pnpm start`

   **Option C: Fly.io**
   ```bash
   cd packages/mcp-server
   fly launch
   fly deploy
   ```

5. **Update MCP_URL:**
   - After deploying the MCP server, update `MCP_URL` in Vercel to point to your hosted endpoint
   - Example: `https://your-mcp-server.railway.app/mcp`

## Database

The application uses Supabase for persistence:

- **conversations** - Chat conversation metadata
- **messages** - Individual messages with timestamps
- **user_preferences** - User pillar/industry preferences

Schema migrations are in the project and already applied. No additional setup needed.

## Acceptance Criteria Verification

All requirements met:

✅ **App deploys to Vercel with one click** - Push to GitHub, Vercel auto-deploys
✅ **Chat streams tokens with MCP tools** - Vercel AI SDK + HTTP transport
✅ **Search "CBCS revenue cycle" returns lesson codes** - `search_lessons` tool
✅ **Generate soft-skills scenarios for healthcare** - `generate_contextualized_soft_skill` with industry context
✅ **Locator placement (R=3, M=2)** - `apply_locator_results` recommends entry points
✅ **Reading remediation for CBCS** - `remediation_plan_from_cert_gaps` tool
✅ **Enterprise styling** - Clean, minimal design matching principal.enrich.org aesthetic

## Project Structure

```
aztec-iet-assistant/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   ├── components/     # React components
│       │   └── lib/            # Utilities and database functions
│       ├── package.json
│       └── next.config.js
├── packages/
│   └── mcp-server/             # MCP server
│       ├── src/
│       │   ├── index.ts        # Main server with HTTP transport
│       │   ├── data-loader.ts  # Excel ingestion
│       │   ├── resources.ts    # MCP resources
│       │   ├── tools.ts        # MCP tools
│       │   └── types.ts        # TypeScript types
│       └── package.json
├── data/
│   └── Samples for AI prototype.xlsx  # Curriculum catalog
├── package.json                # Root workspace config
├── pnpm-workspace.yaml
└── README.md
```

## Development Notes

### Styling Guidelines

The UI follows enterprise design principles:
- Neutral grayscale palette
- Inter font (system UI fallback)
- 14-16px body text, 18-20px inputs
- Focus rings and hover states
- Excellent whitespace and readability
- No cartoony or overly colorful elements

### Adding New Tools

To add a new MCP tool:

1. Add the tool definition in `packages/mcp-server/src/tools.ts`
2. Use Zod for input validation
3. Return both `content` (text) and `structuredContent` (data)
4. Always cite lesson codes in recommendations
5. Restart the MCP server - tools are auto-discovered by the web app

### Customizing System Prompts

Edit `generateSystemPrompt()` in `apps/web/src/app/api/chat/route.ts` to adjust AI behavior per pillar/industry.

## Troubleshooting

**"Unauthorized" from MCP server:**
- Verify `MCP_API_KEY` matches in both server and web app `.env`

**"No tools found":**
- Ensure MCP server is running on the correct port
- Check `MCP_URL` is correct in web app `.env`

**Excel file not found:**
- Verify `data/Samples for AI prototype.xlsx` exists
- Check file path in `packages/mcp-server/src/data-loader.ts`

**Build failures:**
- Run `pnpm install` at root to install all dependencies
- Ensure Node.js version is 18+

## License

MIT