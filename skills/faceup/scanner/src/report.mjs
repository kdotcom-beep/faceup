import { SEVERITY_LABELS } from './rules.mjs';

const HONESTY = 'Findings are against the Face Up catalogue only. Zero findings is not a claim of WCAG conformance.';
const SARIF_LEVEL = { failure: 'error', 'ux-failure': 'warning', smell: 'note' };

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function formatText(result) {
  const out = [];
  let currentFile = null;
  for (const f of result.findings) {
    const rule = result.rules.get(f.rule);
    if (f.file !== currentFile) {
      currentFile = f.file;
      out.push('', f.file);
    }
    out.push(`  ${f.selector ?? `${f.line}:${f.column}`}  ${f.rule}  ${SEVERITY_LABELS[rule.severity]}`);
    out.push(`    ${f.message}`);
    if (f.places) out.push(`    Also at: ${f.places.slice(1, 4).map((p) => p.selector).join(', ')}${f.count > 4 ? `, and ${f.count - 4} more` : ''}`);
    out.push(`    ${rule.title}${rule.url ? `: ${rule.url}` : ''}`);
  }
  const files = new Set(result.findings.map((f) => f.file)).size;
  out.push('');
  out.push(`${plural(result.findings.length, 'finding')} in ${plural(files, result.browser ? 'location' : 'file')}.`);
  if (result.filesScanned) out.push(`Scanned ${plural(result.filesScanned, 'file')} with ${result.checks.join(', ')}.`);
  else if (!result.browser) out.push('No React, JavaScript, TypeScript, HTML or CSS files were found, so nothing was scanned. This is not a clean result.');
  if (result.browser) {
    out.push(`Checked ${plural(result.browser.pages.length, 'page')} in ${result.browser.name} with axe ${result.browser.axeVersion ?? ''} and Face Up's browser checks.`);
    if (result.browser.axeOther.length) out.push(`axe also found ${plural(result.browser.axeOther.length, 'problem')} outside the Face Up catalogue. The JSON output lists them.`);
    if (result.browser.axeIncomplete.length) out.push(`axe could not decide ${plural(result.browser.axeIncomplete.reduce((n, i) => n + i.nodes, 0), 'place')} for checks outside the Face Up catalogue, such as text over a picture. A person needs to check them. The JSON output lists each one.`);
    for (const e of result.browser.pageErrors) out.push(`Could not check ${e.page}: ${e.message}`);
  }
  if (result.notAssessed.length) out.push(`${plural(result.notAssessed.length, 'place')} not assessed because the scan could not decide them. The JSON output lists each one with the reason.`);
  if (result.skipped.length) out.push(`Skipped ${plural(result.skipped.length, 'generated file')}.`);
  if (result.parseErrors.length) out.push(`Could not parse ${plural(result.parseErrors.length, 'file')}: ${result.parseErrors.map((e) => e.file).join(', ')}.`);
  out.push('Each finding is for a person to review.');
  out.push(HONESTY);
  return `${out.join('\n')}\n`;
}

export function formatJson(result) {
  const used = [...new Set(result.findings.map((f) => f.rule))].sort();
  return `${JSON.stringify(
    {
      note: HONESTY,
      checks: result.checks,
      filesScanned: result.filesScanned,
      browser: result.browser ?? null,
      rules: Object.fromEntries(used.map((id) => [id, result.rules.get(id)])),
      findings: result.findings,
      notAssessed: result.notAssessed,
      skipped: result.skipped,
      parseErrors: result.parseErrors,
    },
    null,
    2,
  )}\n`;
}

export function formatSarif(result) {
  const ids = [...new Set(result.findings.map((f) => f.rule))].sort();
  const driverRules = ids.map((id) => {
    const rule = result.rules.get(id);
    return {
      id,
      name: id,
      shortDescription: { text: rule.title },
      ...(rule.url ? { helpUri: rule.url } : {}),
      defaultConfiguration: { level: SARIF_LEVEL[rule.severity] },
      properties: { severity: rule.severity, tier: rule.tier, wcag: rule.wcag },
    };
  });
  const results = result.findings.map((f) => ({
    ruleId: f.rule,
    ruleIndex: ids.indexOf(f.rule),
    level: SARIF_LEVEL[result.rules.get(f.rule).severity],
    message: { text: f.message },
    locations: [{ physicalLocation: { artifactLocation: { uri: f.file }, ...(f.line ? { region: { startLine: f.line, startColumn: f.column } } : {}) } }],
  }));
  return `${JSON.stringify(
    {
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      version: '2.1.0',
      runs: [{ tool: { driver: { name: 'faceup', rules: driverRules } }, results, properties: { note: HONESTY } }],
    },
    null,
    2,
  )}\n`;
}
