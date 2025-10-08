# Quick Start - Deploy to Vercel

## The One Thing You Must Do

⚠️ **Set Root Directory to `apps/web` in Vercel** ⚠️

This is a monorepo project. If you don't set the Root Directory, deployment will fail with:
```
Error: No Next.js version detected
```

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
3. You'll see the configuration screen

### 3. Set Root Directory (CRITICAL!)

```
┌──────────────────────────────────────────────┐
│ Configure Project                             │
├──────────────────────────────────────────────┤
│                                               │
│ Framework Preset: Next.js                    │
│                                               │
│ Root Directory: ./  [Edit] ← CLICK HERE!     │
│                     ↓                         │
│                   Change to: apps/web         │
│                                               │
│ Build Command: (leave default)               │
│ Output Directory: (leave default)            │
│ Install Command: (leave default)             │
│                                               │
└──────────────────────────────────────────────┘
```

**What to do:**
1. Click the **[Edit]** button next to "Root Directory"
2. Type: `apps/web`
3. Click Save

### 4. Add Environment Variables

Click on "Environment Variables" and add:

```
OPENAI_API_KEY = your_openai_api_key_here
MCP_URL = http://localhost:3001/mcp
MCP_API_KEY = your_secure_key_here
NEXT_PUBLIC_SUPABASE_URL = https://nrlwfowagmrefkloncjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHdmb3dhZ21yZWZrbG9uY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg2MzAsImV4cCI6MjA3NTA5NDYzMH0.eO2DEhcyQALSqFgF-y8uUmN6kV2JrBlVBxg65DJmpN8
```

### 5. Deploy

Click **Deploy** button!

## Expected Result

✅ Build log shows: `Detected Next.js 14.x.x`
✅ Dependencies install successfully
✅ Build completes without errors
✅ App deploys successfully

## If It Still Fails

Double-check that Root Directory is set to `apps/web`:
1. Go to your project settings in Vercel
2. Navigate to **General**
3. Look for **Root Directory**
4. It should show: `apps/web`
5. If not, edit and change it

Then trigger a new deployment.

## Need More Help?

See detailed documentation:
- `DEPLOYMENT.md` - Complete deployment guide
- `VERCEL_FIX.md` - Troubleshooting Vercel issues
- `README.md` - Full project documentation

## After Web App Deploys

You'll also need to deploy the MCP server separately:
- Use Railway, Render, or Fly.io
- See `DEPLOYMENT.md` for MCP server deployment instructions
- Update `MCP_URL` environment variable in Vercel with your deployed MCP server URL
