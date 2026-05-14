#!/usr/bin/env node
// DesignQA-AI test runner - exercises both positive and negative scenarios
// against the live runDesignQA() pipeline. Writes a JSON + Markdown report.
//
// Usage:
//   npm run test:qa            (uses FIGMA_ACCESS_TOKEN from .env.local)
//
// The serverless code-path is forced (no Playwright required) so the runner
// is portable. To run the full Playwright capture, drop VERCEL=1 above.

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cli = parseArgs(process.argv.slice(2));

if (cli.mode !== 'browser') process.env.VERCEL = '1';

const { runDesignQA } = await import('../src/lib/designQaRunner.ts');

const FIGMA_URL = cli.figmaUrl || 'https://www.figma.com/design/uhOgd0xWwp9xyfglEBM5P6/homepage-final-3?node-id=0-28751&t=kgTr1OK68tEwYVWs-0';
const FIGMA_TOKEN = cli.figmaToken || process.env.FIGMA_ACCESS_TOKEN;

if (!FIGMA_TOKEN) {
  console.error('FIGMA_ACCESS_TOKEN missing. Add it to .env.local before running tests.');
  process.exit(2);
}

const scenarios = [
  {
    label: 'POSITIVE',
    description: 'AOC Solutions homepage (same site that Figma represents)',
    pageUrl: cli.positiveUrl || 'https://www.aocsolutions.com/',
    expectedStatus: 'matched',
    rationale: 'Both inputs refer to the same brand - the engine should report a design-identity match.',
  },
  {
    label: 'NEGATIVE',
    description: 'Four Trees Strata homepage (unrelated site)',
    pageUrl: cli.negativeUrl || 'https://fourtrees.ca/',
    expectedStatus: 'mismatch',
    rationale: 'Different brand and content - the engine must short-circuit and refuse to produce a misleading comparison.',
  },
];

const RUN_AT = new Date().toISOString();
const reports = [];

for (const scenario of scenarios) {
  console.log('\n' + '='.repeat(70));
  console.log('> ' + scenario.label + ' : ' + scenario.description);
  console.log('  Figma : ' + FIGMA_URL);
  console.log('  Target: ' + scenario.pageUrl);
  console.log('  Expects status=' + scenario.expectedStatus);
  console.log('='.repeat(70));

  const start = Date.now();
  try {
    const report = await runDesignQA({
      figmaUrl: FIGMA_URL,
      pageUrl: scenario.pageUrl,
      viewport: '1440',
      preset: 'none',
      figmaToken: FIGMA_TOKEN,
    });

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    const actual = report.designMatch?.status || 'unknown';
    const verdict = actual === scenario.expectedStatus ? 'PASS' : 'FAIL';

    console.log('\n  Status:    ' + actual + '  (expected ' + scenario.expectedStatus + ') -> ' + verdict);
    console.log('  Duration:  ' + duration + 's');
    console.log('  Overall:   ' + report.overallScore + '%');
    console.log('  Identity:  ' + (report.designMatch?.score || 0) + '% - ' + (report.designMatch?.message || ''));
    const matched = report.designMatch?.matchedSignals || [];
    console.log('  Signals:   ' + (matched.length ? matched.slice(0, 5).join(' | ') : '<none>'));
    console.log('  Issues:    ' + report.summary.totalIssues + ' across ' + report.summary.matchedComponents + '/' + report.summary.totalComponents + ' components');

    reports.push({ scenario, verdict, duration, report: pickSummary(report) });
  } catch (error) {
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.error('\n  ERROR after ' + duration + 's: ' + (error.message || error));
    reports.push({ scenario, verdict: 'ERROR', duration, error: String(error.message || error) });
  }
}

const outDir = resolve(__dirname, '..', 'reports');
mkdirSync(outDir, { recursive: true });
const stamp = RUN_AT.replace(/[:.]/g, '-');
const jsonPath = resolve(outDir, 'qa-run-' + stamp + '.json');
const mdPath = resolve(outDir, 'qa-run-' + stamp + '.md');

writeFileSync(jsonPath, JSON.stringify({ generatedAt: RUN_AT, figmaUrl: FIGMA_URL, reports }, null, 2));
writeFileSync(mdPath, renderMarkdown({ generatedAt: RUN_AT, figmaUrl: FIGMA_URL, reports }));

console.log('\n' + '='.repeat(70));
console.log('JSON   : ' + jsonPath);
console.log('Report : ' + mdPath);
console.log('='.repeat(70));

const failed = reports.filter((r) => r.verdict !== 'PASS');
process.exit(failed.length === 0 ? 0 : 1);

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) out[camel(match[1])] = match[2];
  }
  return out;
}

function camel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function pickSummary(report) {
  return {
    id: report.id,
    pageUrl: report.pageUrl,
    overallScore: report.overallScore,
    designMatch: report.designMatch,
    summary: report.summary,
    topIssues: (report.matches || [])
      .filter((match) => match.issues && match.issues.length)
      .slice(0, 12)
      .map((match) => ({
        component: match.figmaNode?.name,
        score: match.score,
        issues: match.issues.slice(0, 4).map((issue) => ({
          type: issue.type,
          property: issue.property,
          severity: issue.severity,
          expected: issue.expected,
          actual: issue.actual,
        })),
      })),
  };
}

function renderMarkdown(payload) {
  const { generatedAt, figmaUrl, reports } = payload;
  const lines = [];
  lines.push('# DesignQA-AI Run Report');
  lines.push('');
  lines.push('- **Generated:** ' + generatedAt);
  lines.push('- **Figma URL:** ' + figmaUrl);
  lines.push('');

  for (const entry of reports) {
    const { scenario, verdict, duration } = entry;
    lines.push('## ' + scenario.label + ' - ' + scenario.description);
    lines.push('');
    lines.push('- **Target URL:** ' + scenario.pageUrl);
    lines.push('- **Expected status:** `' + scenario.expectedStatus + '`');
    lines.push('- **Verdict:** ' + verdict);
    lines.push('- **Duration:** ' + duration + 's');
    lines.push('- **Rationale:** ' + scenario.rationale);
    lines.push('');
    if (entry.error) {
      lines.push('> ERROR: ' + entry.error);
      lines.push('');
      continue;
    }
    const summary = entry.report;
    lines.push('- **Design status:** `' + (summary.designMatch?.status || 'unknown') + '` (' + (summary.designMatch?.score || 0) + '%)');
    lines.push('- **Overall score:** ' + summary.overallScore + '%');
    lines.push('- **Message:** ' + (summary.designMatch?.message || ''));
    lines.push('- **Components total / matched:** ' + summary.summary.totalComponents + ' / ' + summary.summary.matchedComponents);
    lines.push('- **Issues found:** ' + summary.summary.totalIssues);
    if (summary.topIssues && summary.topIssues.length) {
      lines.push('');
      lines.push('### Top issues');
      lines.push('');
      for (const item of summary.topIssues) {
        lines.push('- **' + item.component + '** (' + item.score + '%)');
        for (const issue of item.issues) {
          lines.push('  - `' + issue.severity + '` ' + issue.type + ' - ' + issue.property + ': expected `' + truncate(issue.expected) + '` vs actual `' + truncate(issue.actual) + '`');
        }
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

function truncate(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value == null ? '' : value);
  return text.length > 80 ? text.slice(0, 77) + '...' : text;
}
