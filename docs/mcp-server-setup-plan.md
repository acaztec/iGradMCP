# MCP Server Setup and Integration Plan

This document outlines a practical path to get the Model Context Protocol (MCP) server running so the chat experience can pull authoritative lesson data instead of falling back to the embedded catalog. The plan covers local setup, validation, deployment, and observability so we can diagnose the missing lesson output the user reported.

## Goals

1. Stand up the MCP server locally to confirm the tool contract and lesson outputs match expectations.
2. Integrate the running server with the Next.js chat API (`apps/web/src/app/api/chat/route.ts`) via the `MCP_URL` environment variable.
3. Validate streaming behaviour to ensure lesson tool responses surface in the UI.
4. Package and deploy the MCP server so staging/production environments can use it consistently.
5. Establish troubleshooting steps in case the web app falls back to the embedded catalog again.

## 1. Prepare the Environment

- **Dependencies**: Ensure Node.js 18+, pnpm 8+, and an OpenAI API key are available. These match the requirements already captured in the project README.
- **Data File**: Confirm `data/Samples for AI prototype.xlsx` exists (the catalog loader in both the MCP server and fallback relies on this exact path).
- **Environment Variables**: Copy `.env.example` to `.env` at the repo root and add at minimum `OPENAI_API_KEY`. Leave `MCP_URL` unset initially so the web app logs make it clear when it enters fallback mode.

## 2. Run the MCP Server Locally

1. From the repo root, install dependencies if you have not already: `pnpm install`.
2. Start the MCP server:
   ```bash
   pnpm dev:mcp
   ```
   - This executes `packages/mcp-server/src/index.ts` with ts-node-dev.
   - The server listens on `http://localhost:3001/mcp` by default and reads the Excel catalog via `packages/mcp-server/src/data-loader.ts`.
   - Watch the terminal for a startup log confirming the catalog row counts; this ensures the spreadsheet loaded correctly.
3. (Optional) Use MCP Inspector for manual verification:
   ```bash
   mcp-inspector http://localhost:3001/mcp --header "Authorization: Bearer dev-secret-key"
   ```
   - Invoke tools like `search_lessons` and confirm they return structured lesson data.

## 3. Point the Web App at the Local MCP Server

1. Set `MCP_URL=http://localhost:3001/mcp` in the root `.env`.
2. Restart the Next.js dev server if it is already running: `pnpm dev` from the repo root.
3. In the terminal running Next.js, confirm you no longer see the warning `Falling back to embedded catalog tools`.
4. Reproduce the user flow:
   - Open the chat UI at `http://localhost:3000`.
   - Ask "I want to be a pharmacy tech".
   - Verify that the streamed response lists concrete lesson codes (the MCP tools should surface rows such as CBCS-###). If the UI still fails to render them, open the browser dev tools console and inspect the streamed payloads; this will tell us whether the data is missing at the API layer or being dropped in the client renderer.

## 4. Debug Missing Lesson Output (If Needed)

- If the MCP tool responses look correct in the server logs but the chat UI omits them, capture the API response from `/api/chat` and compare the `toolInvocations` content while the MCP server is online vs. offline.
- Pay special attention to the format produced by `packages/mcp-server/src/tools.ts`; ensure it mirrors the schema used in `apps/web/src/lib/local-tools.ts` so the AI SDK treats both identically.
- Add temporary logging around `tools[toolInvocation.toolName].execute` in `apps/web/src/app/api/chat/route.ts` to see whether the local fallback or MCP path is being hit in practice.

## 5. Package the MCP Server for Deployment

1. Build artifacts:
   ```bash
   pnpm build:mcp
   ```
   - Confirms TypeScript compiles and produces output under `packages/mcp-server/dist`.
2. Choose a hosting target (Railway, Render, Fly.io). Each option is already outlined in the repo documentation; ensure build/start commands reference pnpm.
3. Provision environment variables on the platform:
   - `PORT` (if required by the host, default is 3001).
   - `MCP_API_KEY` (should match whatever the web app expects).
   - `CATALOG_PATH` if you intend to supply the Excel via a different location; otherwise bundle the file with the deploy artifact.
4. After deployment, note the public URL, e.g. `https://your-mcp-server.onrender.com/mcp`.

## 6. Update Downstream Environments

- In Vercel (or other hosting for the Next.js app), set `MCP_URL` to the deployed endpoint and redeploy.
- Validate the production logs: absence of the fallback warning indicates the MCP server is reachable.
- Run a sanity check conversation in the deployed UI to confirm lesson listings now appear.

## 7. Observability & Maintenance

- Implement health checks: the MCP server exposes `/health` (verify in `packages/mcp-server/src/index.ts`). Configure your hosting provider’s uptime monitoring to ping it.
- Add structured logging around tool invocations (already partially implemented) and capture them in whatever logging provider you use (e.g. Vercel, Railway logs).
- Schedule catalog refreshes if the Excel source is updated; the loader currently reads from disk on startup, so redeploying or restarting the MCP server after uploading a new spreadsheet will pick up changes.

## Next Steps After the Plan

- Execute the steps above to confirm the MCP path resolves the user’s issue.
- If the UI still fails to surface lessons while MCP data looks correct, prioritize a separate investigation into the frontend rendering or streaming reducer logic.
