# Quick Start - Deploy to Vercel

## 🚨 CRITICAL: Set Root Directory to `apps/web`

This is the #1 most important step. If you skip this, you'll get 404 errors.

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
3. **STOP! Don't click Deploy yet!**

### 3. Set Root Directory (CRITICAL!)

Before deploying, you MUST configure this:

1. Look for **Root Directory** setting
2. Click **Edit** button next to it
3. Change from `./` to `apps/web`
4. Framework Preset will auto-detect as "Next.js"

**Visual Guide:**
```
┌──────────────────────────────────────┐
│ Configure Project                     │
├──────────────────────────────────────┤
│ Framework Preset: Next.js            │
│                                       │
│ Root Directory: ./  [Edit] ← CLICK!  │
│                     ↓                 │
│                 apps/web ← TYPE THIS │
└──────────────────────────────────────┘
```

### 4. Add Environment Variables

```
OPENAI_API_KEY = your_openai_api_key_here
OPENAI_MODEL = gpt-4o-mini
NEXT_PUBLIC_SUPABASE_URL = https://nrlwfowagmrefkloncjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHdmb3dhZ21yZWZrbG9uY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg2MzAsImV4cCI6MjA3NTA5NDYzMH0.eO2DEhcyQALSqFgF-y8uUmN6kV2JrBlVBxg65DJmpN8
```

### 5. Deploy

Now click **Deploy**!

## Expected Result

✅ Build log shows: `Detected Next.js 14.x.x`
✅ Build completes: `✓ Compiled successfully`
✅ App deploys successfully
✅ All routes work (not just home page)

## If You Get 404 Errors

This means Root Directory is NOT set correctly.

**Fix it:**
1. Go to Project Settings in Vercel
2. Find **Root Directory** under General
3. Click **Edit** and set to `apps/web`
4. Save and redeploy

See `VERCEL_ROOT_DIRECTORY_FIX.md` for detailed troubleshooting.

## Why This Is Required

Your project structure:
```
/ (root)
├── apps/
│   └── web/          ← Next.js app is HERE
│       └── package.json (with "next")
└── package.json      ← Root (no "next")
```

Vercel needs to know the Next.js app is in `apps/web/`, not root `/`.

## After Web App Deploys

- Send a test message (e.g., "I want to be a pharmacy tech")
- Confirm the assistant cites real lesson codes pulled from the spreadsheet
- If no matches are shown, double-check the catalog file in the `data/` directory

## Need More Help?

- `VERCEL_ROOT_DIRECTORY_FIX.md` - Detailed 404 fix guide
- `DEPLOYMENT.md` - Complete deployment guide
- `README.md` - Full project documentation
