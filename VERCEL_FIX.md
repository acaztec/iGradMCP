# Vercel Deployment Fix - Root Directory Solution

## Problem

The deployment failed with:
```
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".
```

## Root Cause

This is a **monorepo structure** issue:
- Root directory: `/` contains only workspace configuration
- Next.js app: `/apps/web` contains the actual Next.js application
- Vercel by default looks in root `/` for Next.js dependencies

## Solution: Set Root Directory to `apps/web`

The correct way to deploy a monorepo with Vercel is to configure the **Root Directory** setting.

### Step-by-Step Fix

1. **In Vercel Dashboard** when importing the repository:
   - Click on "Edit" next to **Root Directory**
   - Set it to: `apps/web`
   - Framework Preset will auto-detect as Next.js
   - Leave all other settings as default

2. **What this does**:
   - Vercel treats `apps/web` as the project root
   - Finds `package.json` with Next.js dependencies
   - Runs `npm install` and `next build` from that directory
   - Everything works as expected

### Important Notes

- ❌ Do NOT use custom `vercel.json` for this - it causes conflicts
- ✅ DO set Root Directory to `apps/web` in the dashboard
- ✅ Let Vercel auto-detect Next.js framework
- ✅ Use default build commands

### Environment Variables

After setting Root Directory, add these environment variables:

```
OPENAI_API_KEY=your_openai_key_here
MCP_URL=http://localhost:3001/mcp
MCP_API_KEY=your_secure_key_here
NEXT_PUBLIC_SUPABASE_URL=https://nrlwfowagmrefkloncjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHdmb3dhZ21yZWZrbG9uY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg2MzAsImV4cCI6MjA3NTA5NDYzMH0.eO2DEhcyQALSqFgF-y8uUmN6kV2JrBlVBxg65DJmpN8
```

## Visual Guide

When importing from GitHub:

```
┌─────────────────────────────────────────────┐
│ Configure Project                            │
│                                              │
│ Framework Preset: Next.js                   │
│ Root Directory: apps/web  ← SET THIS!       │
│ Build Command: (default)                    │
│ Output Directory: (default)                 │
│ Install Command: (default)                  │
└─────────────────────────────────────────────┘
```

## Verification

After deployment with Root Directory set to `apps/web`:

1. ✅ Build log shows: `Detected Next.js version X.X.X`
2. ✅ Install runs in `apps/web` directory
3. ✅ Build completes successfully
4. ✅ App deploys without errors

## Common Mistakes

❌ Leaving Root Directory as `/` (root)
❌ Using custom `vercel.json` with complex build commands
❌ Trying to install dependencies at root level

✅ Set Root Directory to `apps/web`
✅ Let Vercel auto-detect and use defaults
✅ Add environment variables only

## For Existing Projects

If you already created the project:

1. Go to Project Settings
2. Navigate to **General**
3. Find **Root Directory** setting
4. Click Edit and change to `apps/web`
5. Save and trigger a new deployment

## Alternative: Reorganize Project

If you prefer not to use Root Directory setting, you could:
1. Move everything from `apps/web/*` to root `/`
2. This makes it a standard Next.js project
3. But you lose the monorepo structure for the MCP server

**Recommended**: Keep monorepo structure and use Root Directory setting.
