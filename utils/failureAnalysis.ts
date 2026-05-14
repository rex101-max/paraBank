import * as fs from 'fs';
import * as path from 'path';

/**
 * Failure Analysis Report Generator
 * Parses Playwright's JSON results and produces an HTML analysis report.
 * AI-assisted pattern: reads test-results.json and summarizes failure trends.
 */

interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  error?: { message: string };
}

interface Suite {
  title: string;
  specs: { title: string; tests: TestResult[] }[];
  suites?: Suite[];
}

interface ResultsJson {
  stats: { expected: number; unexpected: number; skipped: number };
  suites: Suite[];
}

function flattenTests(suites: Suite[]): TestResult[] {
  const results: TestResult[] = [];
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        results.push({ ...test, title: `${suite.title} > ${spec.title}` });
      }
    }
    if (suite.suites) {
      results.push(...flattenTests(suite.suites));
    }
  }
  return results;
}

export function generateFailureReport(resultsJsonPath: string, outputPath: string) {
  if (!fs.existsSync(resultsJsonPath)) {
    console.warn('No test-results.json found; skipping failure report');
    return;
  }

  const raw: ResultsJson = JSON.parse(fs.readFileSync(resultsJsonPath, 'utf-8'));
  const all = flattenTests(raw.suites ?? []);
  const failed = all.filter(t => t.status === 'failed' || t.status === 'timedOut');

  // Group by error message for historical pattern analysis
  const errorGroups: Record<string, string[]> = {};
  for (const t of failed) {
    const key = t.error?.message?.split('\n')[0] ?? 'Unknown error';
    (errorGroups[key] ??= []).push(t.title);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ParaBank — Failure Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 960px; margin: 40px auto; color: #222; }
    h1   { color: #c0392b; }
    h2   { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 8px; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
    .stat { background: #f9f9f9; border-left: 4px solid #3498db; padding: 16px; border-radius: 4px; }
    .stat.fail { border-color: #c0392b; }
    .stat.pass { border-color: #27ae60; }
    .stat h3 { margin: 0 0 8px; font-size: 14px; color: #666; }
    .stat p { margin: 0; font-size: 28px; font-weight: bold; }
    .failure { background: #fff5f5; border: 1px solid #f5c6cb; border-radius: 4px; padding: 12px; margin: 8px 0; }
    .reason  { background: #eee; border-radius: 4px; padding: 8px; font-size: 12px; font-family: monospace; white-space: pre-wrap; }
    .test-name { font-weight: bold; color: #c0392b; }
  </style>
</head>
<body>
  <h1>🔍 ParaBank — AI Failure Analysis Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>

  <div class="stat-grid">
    <div class="stat pass"><h3>Total Passed</h3><p>${raw.stats?.expected ?? 0}</p></div>
    <div class="stat fail"><h3>Total Failed</h3><p>${failed.length}</p></div>
    <div class="stat">      <h3>Skipped</h3>   <p>${raw.stats?.skipped ?? 0}</p></div>
  </div>

  <h2>Failure Breakdown</h2>
  ${failed.length === 0
    ? '<p style="color:green">✅ No failures detected!</p>'
    : failed.map(t => `
      <div class="failure">
        <div class="test-name">${t.title}</div>
        <div class="reason">${t.error?.message ?? 'No error message'}</div>
      </div>`).join('')}

  <h2>Error Pattern Analysis (Historical)</h2>
  ${Object.entries(errorGroups).map(([reason, tests]) => `
    <div class="failure">
      <strong>Pattern (${tests.length}x):</strong>
      <div class="reason">${reason}</div>
      <ul>${tests.map(t => `<li>${t}</li>`).join('')}</ul>
    </div>`).join('') || '<p>No patterns found.</p>'}
</body>
</html>`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`Failure report written to: ${outputPath}`);
}

// Run directly: npx ts-node utils/failureAnalysis.ts
if (require.main === module) {
  generateFailureReport(
    path.resolve('reports/test-results.json'),
    path.resolve('reports/failure-analysis.html'),
  );
}
