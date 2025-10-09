# Aztec IET Assistant

This repository hosts a lightweight demo of Aztec's Integrated Education & Training assistant. The experience mirrors the desired scholarship-style interface: learners are greeted by Aztec IET, choose from four pathway buttons, and walk through a scripted conversation for the Certified Billing and Coding Specialist (CBCS) track while the other pathways remain placeholders.

## Architecture Overview

- **apps/web** – Next.js 14 application deployed on Vercel. The `/api/chat` route contains a deterministic conversation engine—no OpenAI calls, spreadsheets, or external services.
- **UI components** – Tailwind-powered layout that matches the provided mock (hero card with four pathway buttons, chat transcript, and composer).

## Key Features

- 🎯 **Guided CBCS flow** – Collects diploma status, soft-skill focus, and returns a curated set of lessons and next steps.
- 🎨 **Mock-aligned UI** – Hero card, purple-accent buttons, and rounded chat surfaces that match the reference screenshot.
- 🚀 **Zero external dependencies** – Works out of the box with Node.js and npm; no Supabase, MCP server, or Excel catalog required.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000 to interact with the demo.

## Deployment

1. Push changes to your repository.
2. Import the project into Vercel (Root Directory: `apps/web`).
3. Deploy—no environment variables are required for the scripted demo.

## Customisation Tips

- Update `PATHWAY_OPTIONS` in `apps/web/src/app/page.tsx` to adjust the button copy or enable additional pathways.
- Modify the deterministic responses in `apps/web/src/app/api/chat/route.ts` to refine lesson recommendations or extend the conversation.

## Testing

From the repository root:

```bash
cd apps/web
npm run lint -- --max-warnings=0
```

---

Built for quick CBCS demos while the broader IET experience evolves.
