# Environment Variables Configuration Guide

## For Vercel Deployment

### Required Variables

#### 1. OpenAI API Key
```
OPENAI_API_KEY=sk-proj-your_actual_openai_key_here
```

**Where to get it:**
- Go to https://platform.openai.com/api-keys
- Create a new API key
- Copy and paste it

---

#### 2. Supabase Configuration

**Your Supabase Project ID:** `nqfrgrkamvrkoyssgtbx`

```
NEXT_PUBLIC_SUPABASE_URL=https://nqfrgrkamvrkoyssgtbx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your_actual_anon_key...
```

**Where to get your anon key:**
1. Go to: https://supabase.com/dashboard/project/nqfrgrkamvrkoyssgtbx/settings/api
2. Under "Project API keys"
3. Copy the **`anon`** **`public`** key (starts with `eyJ`)

**Important Notes:**
- ✅ You already ran the migration, so your database is ready
- ✅ The URL uses your project ID: `nqfrgrkamvrkoyssgtbx`
- ✅ The anon key is safe to expose in frontend code (it's public)
- ✅ Don't confuse it with the `service_role` key (keep that secret!)

---

### Optional Variables (Model & Catalog Overrides)

#### 3. OpenAI Model (optional)

``` 
# Defaults to gpt-4o-mini if not set
OPENAI_MODEL=gpt-4o-mini
```

Use this if your OpenAI account has access to a specific model (for example, `gpt-4.1` or an enterprise model). If the provided model is unavailable at runtime, the app automatically falls back to `gpt-4o-mini` so end users can continue chatting.

#### 4. Catalog Path Override (optional)

```
# Only needed if you store the spreadsheet in a custom location
CATALOG_PATH=/var/task/data/Samples for AI prototype.xlsx
```

By default the chat API automatically searches for `data/Samples for AI prototype.xlsx` relative to the deployed project. Set `CATALOG_PATH` to an absolute or relative path if you keep the spreadsheet elsewhere or inject it at runtime.

### Built-in Catalog Data

The Aztec curriculum spreadsheet (`data/Samples for AI prototype.xlsx`) ships with the app and is parsed directly inside the Vercel serverless function. No additional environment variables are required to enable catalog search—just keep the file in the repository when you deploy.

---

## How to Add Variables in Vercel

### Method 1: During Initial Setup

1. Go to https://vercel.com/new
2. Import your repository
3. **IMPORTANT:** Set Root Directory to `apps/web`
4. Click "Environment Variables"
5. Add each variable:
   - Variable name (e.g., `OPENAI_API_KEY`)
   - Value (e.g., `sk-proj-abc123...`)
   - Environment: Production, Preview, Development (check all)
6. Click "Add"
7. Repeat for all variables
8. Click "Deploy"

### Method 2: Add to Existing Project

1. Go to your project dashboard on Vercel
2. Click "Settings"
3. Click "Environment Variables" in the left sidebar
4. For each variable:
   - Click "Add New"
   - Enter name and value
   - Select environments (Production, Preview, Development)
   - Click "Save"
5. After adding all variables, go to "Deployments"
6. Click "..." on latest deployment
7. Click "Redeploy"

---

## Complete Variable List for Copy/Paste

**For Vercel:**
```
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
CATALOG_PATH=optional/custom/path.xlsx
NEXT_PUBLIC_SUPABASE_URL=https://nqfrgrkamvrkoyssgtbx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

---

## For Local Development

Create a `.env` file in the root directory:

```bash
# Copy from .env.example
cp .env.example .env

# Then edit .env with your actual values
```

**Local `.env` file:**
```
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
CATALOG_PATH=optional/custom/path.xlsx
NEXT_PUBLIC_SUPABASE_URL=https://nqfrgrkamvrkoyssgtbx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

---

## Common Issues

### Issue: "Invalid API Key"
- Check OpenAI key starts with `sk-proj-` or `sk-`
- Verify it's not expired
- Check for extra spaces or quotes

### Issue: "Failed to connect to Supabase"
- Verify project ID in URL: `nqfrgrkamvrkoyssgtbx`
- Check anon key starts with `eyJ`
- Make sure you're using `NEXT_PUBLIC_` prefix (required for Next.js)

### Issue: "Catalog search returned no matches"
- Confirm the wording of your prompt contains the keywords you expect
- Verify `data/Samples for AI prototype.xlsx` includes the lessons you need
- If you recently updated the spreadsheet, redeploy so the new file ships with the build

---

## Testing Your Configuration

After setting variables:

1. **Check build logs:**
   - Should show "✓ Compiled successfully"
   - No errors about missing environment variables

2. **Test the app:**
   - Open your deployed URL
   - Try sending a chat message
   - Check browser console for errors

3. **Verify Supabase:**
   - Open browser dev tools → Network tab
   - Send a message
   - Look for requests to `supabase.co`
   - Should see 200 status codes

---

## Security Notes

### ✅ Safe to Expose (Frontend)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are prefixed with `NEXT_PUBLIC_` because they're used in the browser. The anon key is designed to be public and is protected by Row Level Security (RLS) in Supabase.

### ❌ Keep Secret (Backend Only)
- `OPENAI_API_KEY`
- Supabase `service_role` key (not used in this project)

These are only used in server-side code and never exposed to the browser.

---

## Next Steps

1. ✅ Get your Supabase anon key from the dashboard
2. ✅ Add the 3 required variables to Vercel
3. ✅ Deploy or redeploy
4. ✅ Test the app
5. 🎉 Enjoy catalog-grounded answers with just the built-in Excel file
