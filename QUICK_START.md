# Quick Start - Deploy to Vercel

## Simple 3-Step Deployment

The project includes a `vercel.json` that configures everything automatically.

## Steps to Deploy

### 1. Push to GitHub

```bash
git remote add origin https://github.com/acaztec/iGradMCP.git
git branch -M main
git push -u origin main
```

### 2. Import in Vercel

1. Go to https://vercel.com/new
2. Select your repository: `acaztec/iGradMCP`
3. **Leave all build settings as default** (Vercel will use `vercel.json`)

### 3. Add Environment Variables

```
OPENAI_API_KEY = your_openai_api_key_here
MCP_URL = http://localhost:3001/mcp
MCP_API_KEY = your_secure_key_here
NEXT_PUBLIC_SUPABASE_URL = https://nrlwfowagmrefkloncjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHdmb3dhZ21yZWZrbG9uY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg2MzAsImV4cCI6MjA3NTA5NDYzMH0.eO2DEhcyQALSqFgF-y8uUmN6kV2JrBlVBxg65DJmpN8
```

Then click **Deploy**!

## How It Works

The included `vercel.json` tells Vercel:
- Where to run the build (`apps/web`)
- Where to find the output (`apps/web/.next`)
- What commands to use

You don't need to configure anything manually - it just works!

## Expected Result

✅ Build log shows: `Detected Next.js 14.x.x`
✅ Dependencies install successfully
✅ Build completes: `✓ Compiled successfully`
✅ App deploys successfully

## After Web App Deploys

You'll also need to deploy the MCP server separately:
- Use Railway, Render, or Fly.io
- See `DEPLOYMENT.md` for MCP server deployment instructions
- Update `MCP_URL` environment variable in Vercel with your deployed MCP server URL

## Need More Help?

See detailed documentation:
- `DEPLOYMENT.md` - Complete deployment guide
- `VERCEL_FIX.md` - How the monorepo configuration works
- `README.md` - Full project documentation

## Troubleshooting

**Build fails?**
1. Check that `vercel.json` is in your repository root
2. Verify all environment variables are set
3. Look at build logs for specific errors

**Want to test locally first?**
```bash
npm run build
```
This should complete successfully.
