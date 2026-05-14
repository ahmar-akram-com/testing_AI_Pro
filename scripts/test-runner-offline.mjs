#!/usr/bin/env node
// Offline test runner that proves both positive and negative scenarios end-to-end
// by feeding the engine controlled fixtures. Used when the host machine cannot
// reach Figma directly (e.g. behind a corporate proxy or in a sandbox).

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { MappingEngine } = await import('../src/services/mappingEngine.ts');
const { ComparisonEngine } = await import('../src/services/comparisonEngine.ts');

// Hand-crafted Figma tree representing the AOC Solutions homepage hero/header.
// The IDs and structure mirror what the Figma API would return for the
// node-id=0:28751 frame.
const figmaNodes = [
  {
    id: 'figma:0:28751', name: 'AOC Homepage Hero', type: 'FRAME',
    layout: { x: 0, y: 0, width: 1440, height: 900 }, styles: {},
    children: [
      { id: 'figma:logo', name: 'AOC Solutions Logo', type: 'IMAGE',
        layout: { x: 64, y: 32, width: 180, height: 48 }, styles: {},
        text: 'aoc solutions' },
      { id: 'figma:nav-products', name: 'Nav-Products', type: 'TEXT',
        layout: { x: 320, y: 44, width: 80, height: 20 }, styles: { fontSize: 14, fontWeight: 500, lineHeight: 20 },
        text: 'Products' },
      { id: 'figma:nav-services', name: 'Nav-Services', type: 'TEXT',
        layout: { x: 420, y: 44, width: 80, height: 20 }, styles: { fontSize: 14, fontWeight: 500, lineHeight: 20 },
        text: 'Services' },
      { id: 'figma:nav-company', name: 'Nav-Company', type: 'TEXT',
        layout: { x: 520, y: 44, width: 80, height: 20 }, styles: { fontSize: 14, fontWeight: 500, lineHeight: 20 },
        text: 'Company' },
      { id: 'figma:hero-eyebrow', name: 'Hero-Eyebrow', type: 'TEXT',
        layout: { x: 96, y: 180, width: 600, height: 24 }, styles: { fontSize: 14, fontWeight: 600, lineHeight: 24 },
        text: 'B2B Payments Platform' },
      { id: 'figma:hero-headline', name: 'Hero-Headline', type: 'TEXT',
        layout: { x: 96, y: 220, width: 760, height: 96 }, styles: { fontSize: 56, fontWeight: 700, lineHeight: 64 },
        text: 'Automate accounts payable with AOC Solutions' },
      { id: 'figma:hero-sub', name: 'Hero-Subhead', type: 'TEXT',
        layout: { x: 96, y: 340, width: 640, height: 56 }, styles: { fontSize: 18, fontWeight: 400, lineHeight: 28 },
        text: 'Connecting issuers, suppliers and buyers for faster, smarter B2B payments.' },
      { id: 'figma:cta', name: 'Primary CTA Button', type: 'INSTANCE',
        layout: { x: 96, y: 420, width: 200, height: 56 }, styles: { backgroundColor: '#1d4ed8', borderRadius: '8px' },
        text: 'Request a Demo' },
    ],
  },
];

// HTML samples - small fixtures captured from each site (just enough markup
// for the identity engine to do its work). Replace with full fetched HTML to
// exercise the buildTargetSnapshotFromHtml path verbatim.
const aocHtml = `
  <html><head><title>AOC Solutions | B2B Payments Automation</title></head>
  <body>
    <header>
      <a href="/" class="logo"><img src="/static/aoc-solutions-logo.svg" alt="AOC Solutions" /></a>
      <nav>
        <a href="/products">Products</a>
        <a href="/services">Services</a>
        <a href="/company">Company</a>
      </nav>
    </header>
    <main>
      <p class="eyebrow">B2B Payments Platform</p>
      <h1>Automate accounts payable with AOC Solutions</h1>
      <p>Connecting issuers, suppliers and buyers for faster, smarter B2B payments.</p>
      <a href="/demo" class="button button--primary">Request a Demo</a>
    </main>
  </body></html>
`;

const fourTreesHtml = `
  <html><head><title>Four Trees Strata - Vancouver Property Management</title></head>
  <body>
    <header>
      <a href="/"><img src="/wp-content/uploads/four-trees-logo.png" alt="Four Trees Strata" /></a>
      <nav>
        <a href="/about">About</a>
        <a href="/services">Strata Management</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
    <main>
      <h1>Modern strata management for Vancouver buildings</h1>
      <p>Boutique BC-licensed strata management - financial reporting, AGMs, maintenance, and 24/7 emergency response.</p>
      <a href="/quote" class="cta">Request a Quote</a>
    </main>
  </body></html>
`;

const scenarios = [
  {
    label: 'POSITIVE',
    description: 'AOC Solutions homepage (same brand as Figma)',
    pageUrl: 'https://www.aocsolutions.com/',
    html: aocHtml,
    expectedStatus: 'matched',
  },
  {
    label: 'NEGATIVE',
    description: 'Four Trees Strata homepage (unrelated brand)',
    pageUrl: 'https://fourtrees.ca/',
    html: fourTreesHtml,
    expectedStatus: 'mismatch',
  },
];

const mapping = new MappingEngine();
const comparison = new ComparisonEngine();
const reports = [];
const RUN_AT = new Date().toISOString();

for (const scenario of scenarios) {
  console.log('\n' + '='.repeat(70));
  console.log('> ' + scenario.label + ' : ' + scenario.description);
  console.log('  Target: ' + scenario.pageUrl);
  console.log('  Expects status=' + scenario.expectedStatus);
  console.log('='.repeat(70));

  const start = Date.now();
  const targetSnapshot = buildTargetSnapshotFromHtml(scenario.html, scenario.pageUrl);
  const identity = analyzeSignalIdentity(figmaNodes, targetSnapshot.nodes, scenario.pageUrl);
  let matches = [];
  let results = [];
  if (identity.status === 'matched') {
    matches = mapping.matchNodes(figmaNodes, targetSnapshot.nodes);
    results = comparison.compare(matches);
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  const verdict = identity.status === scenario.expectedStatus ? 'PASS' : 'FAIL';
  const overall = identity.status === 'matched'
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / Math.max(results.length, 1))
    : 0;
  const matchedComponents = results.filter((r) => r.domNode).length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  console.log('\n  Status:    ' + identity.status + '  (expected ' + scenario.expectedStatus + ') -> ' + verdict);
  console.log('  Duration:  ' + duration + 's');
  console.log('  Identity:  ' + identity.score + '% - ' + identity.message);
  const sig = identity.matchedSignals || [];
  console.log('  Signals:   ' + (sig.length ? sig.slice(0, 5).join(' | ') : '<none>'));
  console.log('  Overall:   ' + overall + '%');
  console.log('  Components matched: ' + matchedComponents + ' / ' + flattenNodes(figmaNodes).length);
  console.log('  Issues:    ' + totalIssues);

  reports.push({
    scenario,
    verdict,
    duration,
    designMatch: identity,
    overallScore: overall,
    summary: {
      totalComponents: flattenNodes(figmaNodes).length,
      matchedComponents,
      totalIssues,
      passCount: results.filter((r) => r.score >= 90).length,
      failCount: results.filter((r) => r.score < 90).length,
    },
    topIssues: results.filter((r) => r.issues.length).slice(0, 12).map((r) => ({
      component: r.figmaNode?.name,
      score: r.score,
      issues: r.issues.slice(0, 4).map((issue) => ({
        type: issue.type, property: issue.property, severity: issue.severity,
        expected: issue.expected, actual: issue.actual,
      })),
    })),
  });
}

const outDir = resolve(__dirname, '..', 'reports');
mkdirSync(outDir, { recursive: true });
const stamp = RUN_AT.replace(/[:.]/g, '-');
const jsonPath = resolve(outDir, 'offline-qa-run-' + stamp + '.json');
const mdPath = resolve(outDir, 'offline-qa-run-' + stamp + '.md');
writeFileSync(jsonPath, JSON.stringify({ generatedAt: RUN_AT, reports }, null, 2));
writeFileSync(mdPath, renderMarkdown({ generatedAt: RUN_AT, reports }));
console.log('\n' + '='.repeat(70));
console.log('JSON   : ' + jsonPath);
console.log('Report : ' + mdPath);
console.log('='.repeat(70));

const failed = reports.filter((r) => r.verdict !== 'PASS');
process.exit(failed.length === 0 ? 0 : 1);

// ----- helpers extracted from src/lib/designQaRunner.ts (offline-safe copy)

function buildTargetSnapshotFromHtml(html, pageUrl) {
  const text = decodeHtml(stripHtmlNoise(html));
  const logoImages = extractImageCandidates(html, pageUrl);
  const textNodes = extractTextNodes(html);
  const imageNodes = logoImages.map((image, index) => ({
    id: 'html-logo-' + index, name: 'img', type: 'IMAGE',
    layout: { x: 0, y: 40 + index * 20, width: 160, height: 60 }, styles: {},
    text: image.label,
  }));
  const children = [
    ...imageNodes,
    ...textNodes,
    { id: 'html-page-text', name: 'body', type: 'FRAME',
      layout: { x: 0, y: 0, width: 1440, height: 1200 }, styles: {}, text: text.slice(0, 800) },
  ];
  return {
    logoImages,
    nodes: [{ id: 'html-root', name: 'body', type: 'FRAME',
      layout: { x: 0, y: 0, width: 1440, height: 1200 }, styles: {},
      text: collectDomainSignals(pageUrl).join(' '), children }],
  };
}

function extractImageCandidates(html, pageUrl) {
  const images = [];
  const imgRegex = /<img\b[^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html))) {
    const tag = match[0];
    const src = attrValue(tag, 'src') || attrValue(tag, 'data-src') || '';
    if (!src || src.startsWith('data:')) continue;
    const label = [attrValue(tag, 'alt'), attrValue(tag, 'title'), attrValue(tag, 'class'), attrValue(tag, 'id'), src.split('/').pop()].filter(Boolean).join(' ');
    const normalized = normalizeSignal(label);
    images.push({ url: resolveUrl(src, pageUrl), label: normalized || src });
  }
  return images;
}

function extractTextNodes(html) {
  const nodes = [];
  const textRegex = /<(h1|h2|h3|p|a|button|li|span)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = textRegex.exec(html)) && nodes.length < 80) {
    const content = decodeHtml(stripTags(match[2])).replace(/\s+/g, ' ').trim();
    if (content.length < 3 || content.length > 180) continue;
    nodes.push({ id: 'html-text-' + nodes.length, name: match[1].toLowerCase(), type: 'TEXT',
      layout: { x: 0, y: 120 + nodes.length * 24, width: Math.min(900, content.length * 8), height: 24 },
      styles: {}, text: content });
  }
  return nodes;
}

function analyzeSignalIdentity(figmaNodes, targetNodes, pageUrl) {
  const figmaSignals = collectIdentitySignals(figmaNodes, 'figma');
  const targetSignals = [...collectDomainSignals(pageUrl), ...collectIdentitySignals(targetNodes, 'target')].filter(uniqueOnly);
  const importantFigmaSignals = selectDistinctiveSignals(figmaSignals);
  const importantTargetSignals = selectDistinctiveSignals(targetSignals);
  const matchedSignals = importantFigmaSignals
    .filter((s) => targetSignals.some((t) => signalsMatch(s, t)))
    .filter(uniqueOnly).slice(0, 8);
  const denominator = Math.max(1, Math.min(importantFigmaSignals.length, 8));
  const score = Math.round((matchedSignals.length / denominator) * 100);
  const hasFigmaIdentity = importantFigmaSignals.length > 0;
  const hasTargetIdentity = importantTargetSignals.length > 0;
  const status = matchedSignals.length > 0 && score >= 12 ? 'matched' : hasFigmaIdentity && hasTargetIdentity ? 'mismatch' : 'unknown';
  const message = status === 'matched'
    ? 'Both Figma design file and target URL matched. Test comparison begins.'
    : status === 'mismatch'
      ? 'Figma design file and target URL are not the same. Comparison was stopped.'
      : 'Design identity could not be confirmed. Comparison was stopped.';
  return { status, score, message, figmaSignals: importantFigmaSignals.slice(0, 8),
    targetSignals: importantTargetSignals.slice(0, 8), matchedSignals };
}

function collectIdentitySignals(nodes, source) {
  const flattened = flattenNodes(nodes);
  const signals = [];
  for (const node of flattened) {
    const y = node.layout?.y || 0;
    const name = normalizeSignal(node.name);
    const text = normalizeSignal(node.text || '');
    const isIdentityNode = /logo|brand|header|nav|site|company/i.test(node.name) || y < 360 || node.type === 'TEXT';
    if (!isIdentityNode) continue;
    if (text) signals.push(text);
    if (source === 'figma' && /logo|brand|company|site/i.test(node.name) && name) signals.push(name);
    if (source === 'target' && node.type === 'IMAGE' && name) signals.push(name);
  }
  return signals.filter((s) => s.length >= 3 && !isGenericSignal(s)).filter(uniqueOnly).slice(0, 30);
}

function selectDistinctiveSignals(signals) {
  return signals.map(normalizeSignal).filter((s) => s.length >= 3 && !isGenericSignal(s))
    .sort((a, b) => signalSpecificity(b) - signalSpecificity(a)).filter(uniqueOnly).slice(0, 16);
}

function collectDomainSignals(pageUrl) {
  try {
    const host = new URL(pageUrl).hostname.replace(/^www\./, '');
    return host.split(/[.\-_]/).map(normalizeSignal).filter((s) => s.length >= 3 && !isGenericSignal(s));
  } catch { return []; }
}

function flattenNodes(nodes) {
  return nodes.flatMap((n) => [n, ...(n.children ? flattenNodes(n.children) : [])]);
}

function signalsMatch(a, b) {
  if (a === b) return true;
  if (a.length >= 4 && b.includes(a)) return true;
  if (b.length >= 4 && a.includes(b)) return true;
  const wa = new Set(a.split(' ').filter((w) => w.length >= 3));
  const wb = new Set(b.split(' ').filter((w) => w.length >= 3));
  if (wa.size === 0 || wb.size === 0) return false;
  const overlap = [...wa].filter((w) => wb.has(w)).length;
  return overlap / Math.min(wa.size, wb.size) >= 0.65;
}

function signalSpecificity(s) {
  const w = s.split(' ').filter(Boolean);
  return Math.min(s.length, 40) + Math.min(w.length, 6) * 8 + (/\d/.test(s) ? 4 : 0);
}

function normalizeSignal(v) {
  return v.toLowerCase().replace(/\.(png|jpg|jpeg|svg|webp)$/g, '').replace(/[_\-|/\\]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, ' ').trim();
}

function isGenericSignal(s) {
  const g = new Set(['logo','brand','header','footer','nav','navbar','menu','home','about','contact','services','button','image','icon','frame','group','section','container','main','body','page','website','design']);
  return g.has(s) || /^\d+$/.test(s);
}

function uniqueOnly(item, idx, arr) { return arr.indexOf(item) === idx; }

function attrValue(tag, name) {
  const m = tag.match(new RegExp(name + '\\s*=\\s*["\']([^"\']+)["\']', 'i'));
  return m ? m[1] : '';
}

function resolveUrl(value, pageUrl) {
  try { return new URL(value, pageUrl).toString(); } catch { return value; }
}

function stripHtmlNoise(html) {
  return stripTags(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')).replace(/\s+/g, ' ').trim();
}

function stripTags(value) { return value.replace(/<[^>]+>/g, ' '); }

function decodeHtml(value) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function renderMarkdown({ generatedAt, reports }) {
  const lines = ['# DesignQA-AI Offline Run Report', '', '- **Generated:** ' + generatedAt, ''];
  for (const entry of reports) {
    lines.push('## ' + entry.scenario.label + ' - ' + entry.scenario.description, '');
    lines.push('- **Target URL:** ' + entry.scenario.pageUrl);
    lines.push('- **Expected status:** `' + entry.scenario.expectedStatus + '`');
    lines.push('- **Verdict:** ' + entry.verdict);
    lines.push('- **Duration:** ' + entry.duration + 's');
    lines.push('- **Design status:** `' + entry.designMatch.status + '` (' + entry.designMatch.score + '%)');
    lines.push('- **Overall score:** ' + entry.overallScore + '%');
    lines.push('- **Message:** ' + entry.designMatch.message);
    const sig = entry.designMatch.matchedSignals || [];
    if (sig.length) lines.push('- **Matched signals:** ' + sig.join(', '));
    lines.push('- **Figma signals checked:** ' + (entry.designMatch.figmaSignals || []).slice(0, 6).join(', '));
    lines.push('- **Target signals checked:** ' + (entry.designMatch.targetSignals || []).slice(0, 6).join(', '));
    lines.push('- **Components total / matched:** ' + entry.summary.totalComponents + ' / ' + entry.summary.matchedComponents);
    lines.push('- **Issues found:** ' + entry.summary.totalIssues, '');
    if (entry.topIssues?.length) {
      lines.push('### Top issues', '');
      for (const item of entry.topIssues) {
        lines.push('- **' + item.component + '** (' + item.score + '%)');
        for (const issue of item.issues) {
          lines.push('  - `' + issue.severity + '` ' + issue.type + ' - ' + issue.property + ': expected `' + truncate(issue.expected) + '` vs actual `' + truncate(issue.actual) + '`');
        }
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

function truncate(v) {
  const t = typeof v === 'string' ? v : JSON.stringify(v == null ? '' : v);
  return t.length > 80 ? t.slice(0, 77) + '...' : t;
}
