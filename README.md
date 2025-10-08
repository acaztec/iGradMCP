# Aztec IET Assistant

A self-contained Next.js chat application that helps Aztec staff surface curriculum-aligned recommendations from the official catalog spreadsheet. The assistant parses `data/Samples for AI prototype.xlsx` on the server so every response stays grounded in real lesson codes across the Academic (Bridge Pre-HSE), Soft Skills (Ready for Work), and CTE (CBCS) pillars—no external MCP server required.

## Architecture Overview

- **apps/web** – Next.js 14 application deployed to Vercel. The `/api/chat` route loads the Excel catalog, augments the OpenAI system prompt with the most relevant lessons, and streams grounded responses to the UI.
- **data/Samples for AI prototype.xlsx** – Source of truth for courses, subjects, units, lessons, and CC codes. The API reads the file at runtime, so keep it in the repository when deploying.

The legacy `packages/mcp-server` directory remains in the repo for reference but is no longer part of the production flow.

## Key Features

- 📚 **Catalog-grounded answers** – Each user request triggers a spreadsheet search so the assistant cites real lesson codes instead of hallucinating.
- ⚡ **Streaming chat UX** – Powered by the Vercel AI SDK with Enter-to-send, auto-resizing composer, and message persistence via Supabase.
- 🎯 **Context controls** – Staff can pick a pillar and industry focus to tailor recommendations.
- ☁️ **Vercel-ready** – Runs entirely inside the Vercel serverless runtime; no localhost services or additional infrastructure.

## Prerequisites

- Node.js 18+
- npm 9+
- OpenAI API key with access to `gpt-4o-mini` (or another compatible model)
- Supabase project credentials (already wired in this repo)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # edit .env to add your OpenAI key and Supabase anon key
   ```

3. **Verify the catalog file**
   Ensure `data/Samples for AI prototype.xlsx` exists. The API will throw a descriptive error if it cannot find the spreadsheet during a request.

## Local Development

Start the Next.js app:
```bash
npm run dev
```
The site is available at http://localhost:3000.

## Deployment

1. Push your changes to GitHub.
2. Import the repo into Vercel (root directory `apps/web` is already configured).
3. Add the environment variables from `.env` to Vercel (OPENAI_API_KEY, optional OPENAI_MODEL override, Supabase keys).
4. Deploy. Because the Excel file lives in `data/`, Vercel automatically bundles it and the API can read it at runtime—no separate services required.

## Troubleshooting

- **Catalog not found** – Check that `data/Samples for AI prototype.xlsx` is present in the repository. The API logs an error if it cannot resolve the path.
- **Model unavailable** – The API gracefully falls back to `gpt-4o-mini` if a custom `OPENAI_MODEL` is missing. Update the env var or remove it to use the default.
- **Empty recommendations** – When the spreadsheet search returns no matches, the assistant now states that explicitly rather than guessing. Confirm the query wording or update the catalog data.

## Testing

Run the project linting checks from the web app workspace:
```bash
cd apps/web
npm run lint -- --max-warnings=0
```

---

Built for Aztec’s Integrated Education and Training initiatives—now fully hosted and searchable without any localhost-only services.
