# 🚨 CRITICAL FIX: 404 NOT_FOUND Error

## The Problem

You're getting `404: NOT_FOUND` errors when accessing the deployed site because Vercel doesn't know where your Next.js app is located.

## The Solution

**You MUST set Root Directory to `apps/web` in Vercel Dashboard.**

This is a **monorepo** - your Next.js app is in `apps/web/`, not in the root directory.

## How to Fix (2 Options)

### Option 1: Fix Existing Deployment

1. Go to your project in Vercel Dashboard
2. Click **Settings**
3. Scroll to **Root Directory**
4. Click **Edit**
5. Enter: `apps/web`
6. Click **Save**
7. Go to **Deployments** tab
8. Click the **...** menu on latest deployment
9. Click **Redeploy**

### Option 2: Reimport with Correct Settings

1. Delete the current project from Vercel
2. Go to https://vercel.com/new
3. Import your repository again
4. **CRITICAL STEP**: Click **Edit** next to Root Directory
5. Change from `./` to `apps/web`
6. Vercel will auto-detect Next.js
7. Add environment variables
8. Deploy

## Why This Happens

```
Your Repository Structure:
├── apps/
│   └── web/          ← Next.js app is HERE
│       ├── package.json (with "next" dependency)
│       ├── next.config.js
│       └── src/
├── packages/
│   └── mcp-server/
├── package.json      ← Root package.json (no "next" here)
└── ...
```

When Root Directory is `/` (root):
- ❌ Vercel looks for Next.js in root
- ❌ Doesn't find `next` dependency
- ❌ Treats it as static site
- ❌ Results in 404 errors

When Root Directory is `apps/web`:
- ✅ Vercel looks in `apps/web/`
- ✅ Finds `next` dependency
- ✅ Auto-detects as Next.js app
- ✅ Deploys correctly with routing

## Verification

After setting Root Directory to `apps/web` and redeploying:

1. Build logs should show:
   ```
   Detected Next.js version 14.x.x
   ✓ Compiled successfully
   ```

2. The app should load at your Vercel URL

3. All routes should work (not just `/`)

## Environment Variables

Make sure these are set in Vercel:

```
OPENAI_API_KEY=your_openai_key
MCP_URL=http://localhost:3001/mcp
MCP_API_KEY=your_secure_key
NEXT_PUBLIC_SUPABASE_URL=https://nrlwfowagmrefkloncjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHdmb3dhZ21yZWZrbG9uY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg2MzAsImV4cCI6MjA3NTA5NDYzMH0.eO2DEhcyQALSqFgF-y8uUmN6kV2JrBlVBxg65DJmpN8
```

## Summary

**The fix is simple: Set Root Directory to `apps/web` in Vercel Dashboard settings.**

No `vercel.json` needed. No custom build commands. Just set the Root Directory and Vercel handles everything else automatically.
