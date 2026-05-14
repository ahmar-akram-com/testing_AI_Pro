const DEFAULT_QA_TIMEOUT_MS = process.env.VERCEL ? 25000 : 180000;
const QA_TIMEOUT_MS = Number(process.env.QA_TIMEOUT_MS || DEFAULT_QA_TIMEOUT_MS);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!req.body?.figmaUrl || !req.body?.pageUrl) {
    res.status(400).json({ error: 'Figma URL and Page URL are required' });
    return;
  }

  let timeoutHandle: any;
  const timeout = new Promise((resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      if (process.env.VERCEL) {
        resolve(createTimeoutUnknownReport(req.body || {}));
        return;
      }
      reject(new Error(`TIMEOUT: The analysis took longer than ${Math.round(QA_TIMEOUT_MS / 1000)} seconds. Use a specific Figma frame/node URL, reduce the target page size, or run the local version for large pages.`));
    }, QA_TIMEOUT_MS);
  });

  try {
    process.env.PLAYWRIGHT_BROWSERS_PATH ||= '0';
    if (process.env.VERCEL) {
      // Hard caps tuned to fit inside a single 30s Vercel function invocation.
      process.env.MAX_VISUAL_MATCHES ||= '0';
      process.env.MAX_LOGO_CANDIDATES ||= '0';
      process.env.FIGMA_REQUEST_TIMEOUT_MS ||= '8000';
      process.env.FIGMA_REQUEST_RETRIES ||= '1';
      process.env.MAX_FIGMA_NODES ||= '70';
      process.env.MAX_DOM_NODES ||= '180';
      process.env.TARGET_HTML_TIMEOUT_MS ||= '5000';
      process.env.FIGMA_FILE_DEPTH ||= '2';
    }
    const { runDesignQA } = await import('../../src/lib/designQaRunner.js');
    const report = await Promise.race([runDesignQA(req.body || {}), timeout]);
    clearTimeout(timeoutHandle);
    res.status(200).json(report);
  } catch (error: any) {
    clearTimeout(timeoutHandle);
    console.error('QA Run failed:', error);
    res.status(error.message?.startsWith('TIMEOUT') ? 504 : error.statusCode || 500).json({
      error: error.message || 'QA run failed',
    });
  }
}

function createTimeoutUnknownReport(body: any) {
  return {
    id: Math.random().toString(36).slice(2, 11),
    timestamp: new Date().toISOString(),
    figmaFileId: extractFigmaFileId(String(body?.figmaUrl || '')),
    pageUrl: String(body?.pageUrl || ''),
    overallScore: 0,
    designMatch: {
      status: 'unknown',
      score: 0,
      message: 'The deployed analysis ran out of time before producing a verdict. Try the local CLI runners (npm run test:qa) for full results.',
      checkName: 'Deployed runtime budget',
      reason: 'The Vercel function reached its maximum runtime before the Figma API + target HTML round-trips finished. Re-run with a smaller Figma frame, a faster target URL, or run the desktop version which has no time budget.',
      figmaSignals: [],
      targetSignals: [],
      matchedSignals: [],
    },
    matches: [],
    screenshot: '',
    summary: {
      totalComponents: 0,
      