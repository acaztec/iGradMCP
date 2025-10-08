# Vercel Deployment Fix - Output Directory Solution

## Problem History

Initial deployment failures:
1. First: `Error: No Next.js version detected`
2. Then: `Error: No Output Directory named "public" found`

## Root Cause

This is a **monorepo structure** issue:
- Root directory: `/` runs the build script from `package.json`
- Build script executes in: `/apps/web`
- Output is created in: `/apps/web/.next`
- Vercel by default looks for output in `/public` or root

## Solution: Use vercel.json Configuration

The project includes a `vercel.json` file that solves this:

```json
{
  "buildCommand": "cd apps/web && npm install && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm install"
}
```

### What This Does

1. **installCommand**: Installs root dependencies (minimal)
2. **buildCommand**:
   - Changes to `apps/web` directory
   - Installs Next.js dependencies there
   - Builds the Next.js application
3. **outputDirectory**: Tells Vercel the build output is in `apps/web/.next`

### Deployment Steps

1. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/acaztec/iGradMCP.git
   git branch -M main
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - **Leave all build settings as default** - Vercel will use `vercel.json`
   - Add environment variables (see below)
   - Click Deploy

3. **Environment Variables:**
   ```
   OPENAI_API_KEY=your_openai_key
   OPENAI_MODEL=gpt-4o-mini
   NEXT_PUBLIC_SUPABASE_URL=https://nrlwfowagmrefkloncjv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHdmb3dhZ21yZWZrbG9uY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg2MzAsImV4cCI6MjA3NTA5NDYzMH0.eO2DEhcyQALSqFgF-y8uUmN6kV2JrBlVBxg65DJmpN8
   ```

### Expected Build Output

```
✓ Compiled successfully
✓ Generating static pages (5/5)
Route (app)                              Size     First Load JS
┌ ○ /                                    55.1 kB         142 kB
├ ○ /_not-found                          873 B          88.2 kB
└ ƒ /api/chat                            0 B                0 B
```

## Key Points

✅ The `vercel.json` file is **required** for this monorepo structure
✅ Don't modify build settings in Vercel dashboard - it uses `vercel.json`
✅ Don't set Root Directory in dashboard - it should be `/` (root)
✅ The configuration handles everything automatically

## Alternative Approach (Not Recommended)

You could move all Next.js files from `apps/web/` to root `/`, but this:
- Loses the monorepo structure
- Mixes concerns in one directory

## Troubleshooting

**If build still fails:**

1. Check that `vercel.json` exists in repository root
2. Verify environment variables are set correctly
3. Check build logs for specific error messages
4. Ensure the commit with `vercel.json` is pushed to GitHub

**To verify locally:**
```bash
npm run build
# Should complete successfully
```

## After Deployment

Once deployed, confirm the catalog spreadsheet is present and that chat responses cite real lesson codes.
