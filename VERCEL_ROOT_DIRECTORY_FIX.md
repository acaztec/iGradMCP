# Root Directory Configuration

When importing the project into Vercel, set the **Root Directory** to `apps/web`. This tells Vercel to treat the Next.js app as the deployment target and prevents it from scanning the repository root for unrelated tooling.

If a deployment fails because the wrong directory was selected, update the setting in the Vercel dashboard and redeploy. No other adjustments are required.
