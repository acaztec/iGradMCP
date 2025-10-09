# Production Deployment Guide

Deploying the scripted demo only takes a few minutes.

## 1. Prepare the Repository

Push your changes to GitHub:

```bash
git remote add origin https://github.com/acaztec/iGradMCP.git
git branch -M main
git push -u origin main
```

## 2. Import into Vercel

1. Visit https://vercel.com/new.
2. Select the `acaztec/iGradMCP` repository.
3. When prompted for the **Root Directory**, enter `apps/web`.
4. Accept the default build and install commands (Vercel automatically detects Next.js).

## 3. Environment Variables

None are required for this demo. If you extend the app with APIs or databases later, add them in the Vercel dashboard as needed.

## 4. Deploy & Verify

Click **Deploy**. After the build completes:

- Open the live URL.
- Select the **Pharmacy Technician** pathway and walk through the prompts.
- Confirm you receive the scripted lesson recommendations and next steps.

## Troubleshooting

- **Build fails immediately:** Double-check the root directory is `apps/web`.
- **UI looks different:** Ensure Tailwind styles compiled by running `npm run build` locally or redeploy.

With those checks complete, the hosted demo mirrors the mock experience without any additional infrastructure.
