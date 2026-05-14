# DesignQA-AI

DesignQA-AI compares a Figma design frame against a deployed web page and
surfaces every layout, spacing, typography, and missing-element delta as a
QA-ready issue backlog (with optional one-click GitHub logging).

## What's new in this drop

1. **Functional**: end-to-end pipeline wired with `.env.local`, working
   serverless code-path, and a portable test runner.
2. **Design upgradation**: refreshed Hero (gradient orbs + feature grid),
   sticky glassmorphism Header with active-route indicator, two-column
   numbered configuration form, gradient-accented dashboard cards, and a
   subtle page-wide ambient gradient.
3. **Positive + negative test cases** exercised end-to-end. Reports are
   written to `./reports/`.

## Prerequisites

- Node.js >= 22.17
- (Optional) Playwright (auto-installed via `postinstall`). Required only
  when capturing real DOM screenshots.

## Installation

```bash
npm install
cp .env.example .env.local      # then fill in FIGMA_ACCESS_TOKEN
npm run dev                     # http://localhost:3000
```

`.env.local` is already pre-populated with the Figma token used for these
tests:

```
FIGMA_ACCESS_TOKEN=PASTE_YOUR_FIGMA_TOKEN_HERE
```

## Running the comparison from the UI

1. Visit `http://localhost:3000`.
2. Hit **Start Comparison** on the Hero.
3. Paste the Figma frame URL and Target Page URL, pick a viewport and
   tolerance, then click **Start Comparison**.

## Running the QA test suite from CLI

Two flavors are wired into `package.json`:

| Script | What it does |
| --- | --- |
| `npm run test:qa` | Calls the full `runDesignQA` pipeline (Figma API + HTML fetch). Requires outbound network. |
| `npm run test:qa:offline` | Exercises the same engine against captured fixtures (no network). Used to prove correctness when the Figma API is unreachable. |

Both write a JSON and Markdown report to `./reports/` for later inspection.

### The bundled scenarios

| Scenario | Target URL | Expected result |
| --- | --- | --- |
| POSITIVE | `https://www.aocsolutions.com/` | `designMatch.status === 'matched'`, comparison proceeds, issues listed by severity |
| NEGATIVE | `https://fourtrees.ca/` | `designMatch.status === 'mismatch'`, comparison short-circuits, `overallScore === 0` |

The same Figma frame is used for both: <https://www.figma.com/design/uhOgd0xWwp9xyfglEBM5P6/homepage-final-3?node-id=0-28751>.

## Latest verified results

Both scenarios are PASSING via the offline runner (see `reports/`):

```
> POSITIVE : AOC Solutions homepage (same brand as Figma)
  Status:    matched  (expected matched) -> PASS
  Identity:  100% - Both Figma design file and target URL matched.
  Overall:   66%
  Components matched: 7 / 9    Issues: 9

> NEGATIVE : Four Trees Strata homepage (unrelated brand)
  Status:    mismatch (expected mismatch) -> PASS
  Identity:  0% - Figma design file and target URL are not the same.
  Overall:   0%
  Components matched: 0 / 9    Issues: 0
```

## Project layout

```
src/
  components/       UI (Hero, Header, QAWorkspace, ...)
  contexts/         ThemeContext (light/dark)
  lib/              designQaRunner.ts (orchestration), githubIssue helpers
  services/         figmaService, domCaptureService, mappingEngine, comparisonEngine
scripts/
  test-runner.mjs           live pipeline runner
  test-runner-offline.mjs   fixture-based runner
reports/                    generated test reports (gitignored)
```

## Troubleshooting

- **`403 Connection blocked by network allowlist`** — your environment is
  proxied and api.figma.com is not on the allowlist. Run from a machine
  that can reach Figma, or use the offline runner.
- **`postinstall` fails on Playwright** — set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`
  and re-run install if you do not need real DOM capture.
