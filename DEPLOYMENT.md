# Deployment Guide

## Push to GitHub

```bash
# Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/acaztec/iGradMCP.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Deploy to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `acaztec/iGradMCP`
3. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: Leave as default (/)
   - **Build Command**: Will use the one from `vercel.json`
4. Add environment variables:
   ```
   OPENAI_API_KEY=your_openai_key_here
   MCP_URL=http://localhost:3001/mcp  (will update after MCP server is deployed)
   MCP_API_KEY=your_secure_key_here   (change from dev-secret-key)
   NEXT_PUBLIC_SUPABASE_URL=https://nrlwfowagmrefkloncjv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHdmb3dhZ21yZWZrbG9uY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg2MzAsImV4cCI6MjA3NTA5NDYzMH0.eO2DEhcyQALSqFgF-y8uUmN6kV2JrBlVBxg65DJmpN8
   ```
5. Click **Deploy**

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

## Deploy MCP Server

The MCP server needs to be hosted separately. Here are your options:

### Option A: Railway

```bash
cd packages/mcp-server

# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Add environment variables
railway variables set PORT=3001
railway variables set MCP_API_KEY=your_secure_key_here

# Deploy
railway up
```

After deployment, Railway will give you a URL like: `https://your-app.railway.app`

### Option B: Render

1. Go to [render.com](https://render.com)
2. Create a **New Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `packages/mcp-server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     PORT=10000
     MCP_API_KEY=your_secure_key_here
     ```
5. Click **Create Web Service**

After deployment, Render will give you a URL like: `https://your-app.onrender.com`

### Option C: Fly.io

```bash
cd packages/mcp-server

# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and launch
fly auth login
fly launch --name aztec-mcp-server

# Set environment variables
fly secrets set MCP_API_KEY=your_secure_key_here

# Deploy
fly deploy
```

After deployment, Fly will give you a URL like: `https://aztec-mcp-server.fly.dev`

## Update MCP_URL in Vercel

After deploying the MCP server:

1. Go to your Vercel project dashboard
2. Go to **Settings** > **Environment Variables**
3. Update `MCP_URL` to your deployed MCP server URL + `/mcp`:
   - Railway: `https://your-app.railway.app/mcp`
   - Render: `https://your-app.onrender.com/mcp`
   - Fly: `https://aztec-mcp-server.fly.dev/mcp`
4. Redeploy your Vercel app for the changes to take effect

## Verification

### Test MCP Server

```bash
# Health check
curl https://your-mcp-server-url/health

# Should return:
# {"status":"ok","lessons":XXX,"courses":X}
```

### Test Web App

1. Visit your Vercel URL
2. Select a pillar and industry
3. Try a test prompt: "Search for lessons about reading comprehension"
4. Verify the AI responds with lesson codes from the catalog

## Troubleshooting

**Build fails on Vercel:**
- Check that `vercel.json` is present in the repo
- Verify all environment variables are set correctly

**MCP server connection fails:**
- Verify `MCP_URL` points to your deployed MCP server + `/mcp`
- Check `MCP_API_KEY` matches on both server and client
- Test the MCP server health endpoint

**No lessons found:**
- Verify the Excel file `data/Samples for AI prototype.xlsx` is in the repo
- Check MCP server logs for any data loading errors

## Security Notes

- Change `MCP_API_KEY` from `dev-secret-key` to a secure value in production
- Keep your OpenAI API key secure
- The Supabase database has open RLS policies for demo purposes - restrict in production
