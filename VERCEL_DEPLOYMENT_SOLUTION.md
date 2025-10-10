# Complete Vercel Deployment Solution

With the catalog and MCP dependencies removed, deployment is straightforward. Use this checklist if you run into issues.

## Key Fixes Already Applied

- ✅ Removed legacy Turborepo/pnpm configuration so Vercel treats `apps/web` as a standalone Next.js app.
- ✅ Dropped `.npmrc` that pointed to a localhost registry.
- ✅ Simplified the chat API to script the intake and hand off the final summary to OpenAI.

## Deployment Steps

1. Push the latest code to GitHub.
2. In Vercel, import the repository and set **Root Directory** to `apps/web`.
3. Leave the default build settings (`npm install`, `npm run build`).
4. Add `OPENAI_API_KEY` (and optional `OPENAI_MODEL`/`OPENAI_BASE_URL`) to the project settings.
5. Deploy and verify the CBCS conversation renders as expected and the final response is AI-authored.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails before compiling | Confirm the root directory is `apps/web` and that `package-lock.json` is present. |
| Styles missing | Re-run `npm run build` locally to make sure Tailwind compiled, then redeploy. |
| Chat endpoint returns an error | Ensure your request body includes the `messages` array (the UI handles this automatically). |

Following this guide should get every deployment back on track without touching legacy configuration.
