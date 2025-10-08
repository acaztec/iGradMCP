# Production Deployment Guide

Follow these steps to deploy the Aztec IET Assistant to Vercel with the self-contained catalog search experience.

## 1. Prepare the Repository

```bash
git remote add origin https://github.com/acaztec/iGradMCP.git
git branch -M main
git push -u origin main
```

## 2. Import the Project into Vercel

1. Go to https://vercel.com/new
2. Import the repository `acaztec/iGradMCP`
3. When prompted for **Root Directory**, enter `apps/web`
4. Leave the build and install commands as defaults (Vercel detects Next.js automatically)

## 3. Configure Environment Variables

Add these variables in the Vercel dashboard (Production, Preview, and Development):

```
OPENAI_API_KEY = your_openai_api_key
OPENAI_MODEL = gpt-4o-mini
NEXT_PUBLIC_SUPABASE_URL = https://nrlwfowagmrefkloncjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHdmb3dhZ21yZWZrbG9uY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg2MzAsImV4cCI6MjA3NTA5NDYzMH0.eO2DEhcyQALSqFgF-y8uUmN6kV2JrBlVBxg65DJmpN8
```

(Replace the anon key with your actual Supabase anon key.)

## 4. Deploy

Click **Deploy**. Vercel will install dependencies inside `apps/web`, build the Next.js app, and bundle the Excel catalog automatically.

## 5. Post-Deployment Checklist

- Visit your Vercel URL and send a prompt such as “I want to be a pharmacy tech.”
- Confirm the assistant responds with real lesson codes (e.g., `CBCS-201`).
- If the response says no matches were found, verify that `data/Samples for AI prototype.xlsx` exists in the repository and redeploy if the file was updated.

## Troubleshooting

- **404 Errors:** Ensure the Root Directory is set to `apps/web`.
- **Missing catalog file:** The build logs will show a warning if the Excel file cannot be found. Double-check the `data/` folder path.
- **Model errors:** If a custom `OPENAI_MODEL` is unavailable, the API falls back to `gpt-4o-mini`. Update the env var if necessary.

Once everything checks out, your team can rely on the hosted assistant without maintaining any additional services or localhost-only tooling.
