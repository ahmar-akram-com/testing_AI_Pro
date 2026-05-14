# Deploy DesignQA-AI to Vercel

The repository is already on GitHub at <https://github.com/ahmar-akram-com/testing_AI_Pro>.
Vercel needs to import that repo, get the Figma access token, and then it
will auto-deploy on every push to `main`.

## Option A · One-click deploy via the Vercel dashboard (recommended)

1. Open <https://vercel.com/new> in your browser and sign in.
2. Click **Import Git Repository** → choose **ahmar-akram-com / testing_AI_Pro**.
   - If you do not see it, click **Adjust GitHub App Permissions** and grant
     access to the repo, then refresh.
3. On the **Configure Project** screen:
   - **Framework Preset:** `Other` (Vercel will pick up `vercel.json` automatically).
   - **Build Command:** `npm run build` (already set).
   - **Output Directory:** `dist` (already set).
   - **Install Command:** leave blank (default `npm install`).
4. Click **Environment Variables** and add:
   ```
   FIGMA_ACCESS_TOKEN = <your-figma-personal-access-token>
   ```
   (Apply to *Production*, *Preview*, and *Development*.)
5. Click **Deploy**. Wait ~60 seconds.
6. Open the production URL Vercel gives you (something like
   `https://testing-ai-pro.vercel.app`).

## Option B · Deploy from your Windows machine with the Vercel CLI

```powershell
# 1. install the CLI (once)
npm install -g vercel

# 2. log in (opens a browser)
vercel login

# 3. inside the project folder, link it to a Vercel project
cd C:\Users\ahmar\Downloads\Compressed\testing_design_qa_ai-main\testing_design_qa_ai-main
vercel link              # follow the prompts, accept defaults

# 4. push the FIGMA token to all environments
vercel env add FIGMA_ACCESS_TOKEN production
vercel env add FIGMA_ACCESS_TOKEN preview
vercel env add FIGMA_ACCESS_TOKEN development

# 5. deploy
vercel --prod
```

Or just double-click [`DEPLOY.bat`](./DEPLOY.bat) which runs the same flow.

## Option C · Auto-deploy on every push

Once the repo is linked (Option A or Option B), every `git push origin main`
triggers a fresh production build on Vercel automatically.

## How the deployed function avoids timeouts

The latest commit ships a tuned serverless code path:

- Figma API extraction and target HTML fetch are launched **in parallel**
  so their round-trip latencies overlap.
- Figma requests use a smaller `depth=2`, an 8 second timeout, and at most
  70 nodes per scan (`MAX_FIGMA_NODES=70`).
- Target HTML fetch is capped at 5 seconds (`TARGET_HTML_TIMEOUT_MS=5000`).
- The Vercel function has `maxDuration: 30` and `memory: 1024`.
- If the budget is still exceeded, the function returns an explanatory
  `designMatch.status: "unknown"` payload (rather than a generic 504).

## Smoke-test after deploy

Hit these URLs in your browser once Vercel is live:

| URL | Should show |
| --- | --- |
| `https://<your-app>.vercel.app/` | The DesignQA-AI dashboard |
| `https://<your-app>.vercel.app/api/health` | `{"status":"ok","figmaConfigured":true,...}` |

Then on the dashboard:

1. Click **Start Comparison**.
2. Paste:
   - Figma URL: `https://www.figma.com/design/uhOgd0xWwp9xyfglEBM5P6/homepage-final-3?node-id=0-28751`
   - Target URL: `https://www.aocsolutions.com/`
3. Click **Start Comparison**. You should see `designMatch.status = matched`.
4. Repeat with `https://fourtrees.ca/`. You should see
   `designMatch.status = mismatch`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Figma access token is required` | The `FIGMA_ACCESS_TOKEN` env var is missing in Vercel. Add it under *Settings → Environment Variables* and redeploy. |
| Status returns `unknown` with "budget exceeded" | The Figma file is large. Open the specific frame in Figma, copy its URL with `node-id=...`, and paste that. |
| Build fails on `npm run build` | Check the Vercel build log. Usually it's a missing env var or an outdated dependency — run `npm install && npm run build` locally first. |
| Function logs show `403 Forbidden` from Figma | Either the token is wrong or it does not have access to the file. Regenerate the token in *Figma → Settings → Personal access tokens*. |
