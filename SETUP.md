# Local setup — Windows (one-time)

Follow these steps once on your laptop. After that, you can run the app
any time by double-clicking `RUN-ME.bat`.

## 1. Install Node.js 22 LTS

Download and install from <https://nodejs.org/en/download> (any "LTS"
build dated 2024-10 or later — must report `node -v` >= `v22.17`).

Verify in a fresh PowerShell window:

```powershell
node -v
npm -v
```

## 2. Get the project

Either:

- **Clone from GitHub** (recommended):
  ```powershell
  git clone https://github.com/ahmar-akram-com/testing_AI_Pro.git
  cd testing_AI_Pro
  ```
- **OR** unzip the project folder you already have.

## 3. Add your Figma access token

Open `.env.local` (or create it from `.env.example`) and paste your
Figma personal access token on the `FIGMA_ACCESS_TOKEN=` line:

```
FIGMA_ACCESS_TOKEN=<your-figma-personal-access-token>
GEMINI_API_KEY=
PORT=3000
```

A Figma token is generated under
**Figma → Account settings → Personal access tokens → Generate new token**
with at least *file_content:read* scope.

## 4. One-click setup

Double-click `RUN-ME.bat`. It will:

1. Verify Node.js >= 22.
2. Create `.env.local` (if missing).
3. Run `npm install` (cleaning any partial installs).
4. Install Playwright Chromium for headless capture.
5. Type-check and build the app.
6. Start the dev server and open `http://localhost:3000` in your browser.

If anything fails, the script prints the exact error and the last 60 lines
of stdout/stderr from `npm run dev`.

> *PowerShell tip:* if Windows complains about script execution, you can
> run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or rely
> on `RUN-ME.bat` which already passes `-ExecutionPolicy Bypass`.

## 5. Day-to-day usage

| Action | Command |
| --- | --- |
| Launch the app | `RUN-ME.bat` (or `npm run dev`) |
| Run both QA scenarios (network) | `TEST.bat` or `npm run test:qa` |
| Run offline scenarios (fixtures) | `npm run test:qa:offline` |
| Production build | `npm run build` then `npm run preview` |
| Type-check only | `npm run lint` |

## 6. Run a comparison

1. Open `http://localhost:3000`.
2. Click **Start Comparison** on the Hero.
3. Paste:
   - Figma URL: `https://www.figma.com/design/uhOgd0xWwp9xyfglEBM5P6/homepage-final-3?node-id=0-28751`
   - Target Page URL: `https://www.aocsolutions.com/` (positive) or `https://fourtrees.ca/` (negative)
4. Click **Start Comparison**.

The positive scenario should produce `designMatch.status: "matched"` and a
list of component-level issues; the negative scenario should produce
`designMatch.status: "mismatch"` and stop without false issues.

## 7. Common issues

| Symptom | Fix |
| --- | --- |
| `Node.js >= 22 is required` | Install Node 22 LTS, then restart PowerShell. |
| `Figma API 401 Unauthorized` | Token is wrong or expired — regenerate in Figma. |
| `Figma API 403 Forbidden` | Token does not have access to the Figma file — re-share the file with the token owner. |
| Playwright Chromium fails to install | Run `npx playwright install chromium --force` from the project folder. |
| Port 3000 in use | Edit `PORT=` in `.env.local` or run `start-local.ps1 -Port 4000`. |
| Browser does not open | Manually visit `http://localhost:3000/`. |

## 8. What changed in this drop

- `RUN-ME.bat` + `TEST.bat` — Windows double-click launchers.
- `scripts/setup-local.ps1` — fully scripted setup with logging.
- `scripts/start-local.ps1` — health-checked launcher.
- `scripts/test-runner.mjs` — live positive + negative QA scenarios.
- `scripts/test-runner-offline.mjs` — fixture-based proof runner.
- Hero, Header, QAWorkspace, App — refreshed UI (gradient orbs, sticky
  glassmorphism header, numbered config sections, lifted dashboard cards).
- `TEST_RESULTS.md` — recorded PASS/PASS for both scenarios.
