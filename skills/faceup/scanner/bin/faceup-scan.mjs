#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { scan, gatingFindings } from '../src/scan.mjs';
import { renderScan } from '../src/render.mjs';
import { formatText, formatJson, formatSarif } from '../src/report.mjs';

const USAGE = `Usage: faceup-scan [paths...] [options]

Checks React source against the Face Up catalogue. Paths default to the current directory.
With --url, it also opens each page in Chrome or Edge, runs axe, and runs Face Up's browser checks.

Options:
  --url <address>                            A page to open and check in a browser, such as http://localhost:5173.
                                             Repeat it to check several pages. With only --url, no source is scanned.
  --format <text|json|sarif>                 Output format (default: text)
  --fail-on <failure|ux-failure|smell|none>  Lowest severity that fails the build (default: failure).
                                             Only the two naming checks can fail it; the rest are for review.
  --rules-url <url>                          Base URL of the published catalogue, used for rule links
  -h, --help                                 Show this help
`;

const FORMATS = { text: formatText, json: formatJson, sarif: formatSarif };
const FAIL_ON = ['failure', 'ux-failure', 'smell', 'none'];

function fail(message) {
  process.stderr.write(`faceup-scan: ${message}\n\n${USAGE}`);
  process.exit(2);
}

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      url: { type: 'string', multiple: true },
      format: { type: 'string', default: 'text' },
      'fail-on': { type: 'string', default: 'failure' },
      'rules-url': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
} catch (error) {
  fail(error.message);
}

const { values, positionals } = parsed;
if (values.help) {
  process.stdout.write(USAGE);
  process.exit(0);
}
if (!FORMATS[values.format]) fail(`unknown format "${values.format}"`);
if (!FAIL_ON.includes(values['fail-on'])) fail(`unknown --fail-on value "${values['fail-on']}"`);

let result;
try {
  const urls = values.url ?? [];
  result = scan(positionals.length ? positionals : urls.length ? [] : ['.'], { rulesUrl: values['rules-url'] });
  if (urls.length) {
    const browser = await renderScan(urls);
    result.findings.push(...browser.findings.map((f) => ({ ...f, file: f.page, line: 0, column: 0 })));
    result.notAssessed.push(...browser.notAssessed.map((n) => ({ ...n, file: n.page })));
    result.browser = { name: browser.browser, axeVersion: browser.axeVersion, pages: browser.pages, pageErrors: browser.pageErrors, axeOther: browser.axeOther };
  }
} catch (error) {
  process.stderr.write(`faceup-scan: ${error.message}\n`);
  process.exit(2);
}

const gating = gatingFindings(result, values['fail-on']);
process.stdout.write(FORMATS[values.format](result, gating));
process.exit(gating.length ? 1 : 0);
