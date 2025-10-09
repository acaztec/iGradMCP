# Vercel Build Fix Checklist

Use this quick list if a build fails:

1. **Root Directory** – Confirm the project in Vercel points to `apps/web`.
2. **Dependencies** – The repo includes a `package-lock.json`; allow Vercel to run `npm install` automatically.
3. **Environment Variables** – None are required for the scripted demo. Remove any stale OpenAI or Supabase keys from previous deployments.
4. **Retry** – Trigger a redeploy from the Vercel dashboard after verifying the settings above.

The app no longer depends on MCP servers, spreadsheets, or external APIs, so builds succeed as long as the Next.js project is detected correctly.
