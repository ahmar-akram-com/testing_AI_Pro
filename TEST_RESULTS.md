# DesignQA-AI — Test Results

**Generated:** 2026-05-14
**Engine:** `runDesignQA` (serverless code-path)
**Figma file:** `https://www.figma.com/design/uhOgd0xWwp9xyfglEBM5P6/homepage-final-3?node-id=0-28751`

---

## Executive summary

| # | Scenario | Target URL | Expected status | Actual status | Verdict |
|---|----------|------------|-----------------|---------------|---------|
| 1 | POSITIVE | https://www.aocsolutions.com/ | `matched` | `matched` | **PASS** |
| 2 | NEGATIVE | https://fourtrees.ca/ | `mismatch` | `mismatch` | **PASS** |

Both scenarios behave exactly as designed:

- The engine **proceeds with full component-level comparison** only when the
  Figma frame and the live page share enough distinctive identity signals
  (logo, brand text, hero headline).
- Otherwise it **short-circuits with `overallScore: 0`** and a clear
  `designMatch.message` so the operator is never shown a misleading
  similarity score.

---

## 1. POSITIVE scenario — AOC Solutions

- **Figma frame:** `homepage-final-3 / 0:28751` (AOC Solutions homepage hero)
- **Target URL:** `https://www.aocsolutions.com/`
- **Rationale:** Both inputs represent the same brand. The engine should
  detect identity, run the full comparison, and produce a per-component
  issue list.

### Outcome

| Property | Value |
|---|---|
| `designMatch.status` | `matched` |
| `designMatch.score` | 100% |
| `designMatch.message` | "Both Figma design file and target URL matched. Test comparison begins." |
| Overall score | 66% |
| Components total / matched | 9 / 7 |
| Issues found | 9 |

### Matched identity signals

`aoc solutions`, `aoc solutions logo`, `b2b payments platform`,
`automate accounts payable with aoc solutions`,
`connecting issuers suppliers and buyers for faster smarter b2b payments`,
`products`, `services`, `company`.

### Sample component findings

| Component | Score | Severity | Type | Property | Expected → Actual |
|---|---|---|---|---|---|
| AOC Homepage Hero | 0% | high | presence | exists | `true` → `false` |
| AOC Solutions Logo | 0% | high | presence | exists | `true` → `false` |
| Nav-Products | 85% | medium | layout | dimensions | `80x20` → `64x24` |
| Nav-Services | 85% | medium | layout | dimensions | `80x20` → `64x24` |
| Nav-Company | 85% | medium | layout | dimensions | `80x20` → `56x24` |
| Hero-Eyebrow | 85% | medium | layout | dimensions | `600x24` → `168x24` |
| Hero-Headline | 85% | medium | layout | dimensions | `760x96` → `352x24` |
| Hero-Subhead | 85% | medium | layout | dimensions | `640x56` → `592x24` |
| Primary CTA Button | 85% | medium | layout | dimensions | `200x56` → `112x24` |

(Each row is automatically converted into a one-click GitHub issue draft
by the **Issue Backlog** panel.)

---

## 2. NEGATIVE scenario — Four Trees Strata

- **Figma frame:** Same AOC Solutions homepage hero
- **Target URL:** `https://fourtrees.ca/`
- **Rationale:** Different brand, different content. The engine must refuse
  to produce a similarity score because the two inputs are unrelated.

### Outcome

| Property | Value |
|---|---|
| `designMatch.status` | `mismatch` |
| `designMatch.score` | 0% |
| `designMatch.message` | "Figma design file and target URL are not the same. Comparison was stopped." |
| Overall score | 0% |
| Components total / matched | 9 / 0 |
| Issues found | 0 |

### Figma vs Target signal sets (top entries)

| Figma frame (AOC) | Target page (Four Trees) |
|---|---|
| connecting issuers suppliers and buyers for faster smarter b2b payments | boutique bc licensed strata management financial reporting agms maintenance and 24 7 emergency response |
| automate accounts payable with aoc solutions | modern strata management for vancouver buildings |
| b2b payments platform | four trees strata four trees logo |
| aoc solutions logo | request a quote |
| aoc solutions | strata management |

No overlap → identity check fails → comparison is halted → no false issues
are emitted.

---

## How to reproduce

```bash
# 1. Install dependencies (FIGMA token already in .env.local)
npm install

# 2a. Run live tests (requires outbound network to api.figma.com + targets)
npm run test:qa

# 2b. Run offline test (uses captured fixtures, proves engine behavior)
npm run test:qa:offline
```

Reports are written to `./reports/` as both JSON and Markdown.

---

## Design upgradation highlights

- **Hero** — Gradient ambient orbs, animated brand-mark pulse, three feature
  cards explaining Figma sourcing / live capture / smart diffing.
- **Header** — Sticky glassmorphism bar with logo-mark badge, route
  underline, and pill-shaped icon buttons that elevate on hover.
- **Configuration form** — Numbered "Sources / Comparison rules" sections,
  gradient submit button with sheen animation.
- **Dashboard stats** — Gradient-accented stat cards with hover lift and
  shadow elevation.
- **Page background** — Multi-orb ambient gradient that respects light /
  dark mode.

All upgrades are pure Tailwind utilities — no new dependencies and the
existing component API is unchanged.
