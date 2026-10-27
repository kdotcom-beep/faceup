#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { scan, gatingFindings } from '../src/scan.mjs';
import { renderScan, STEP_KINDS } from '../src/render.mjs';
import { formatText, formatJson, formatSarif } from '../src/report.mjs';

const USAGE = `Usage: faceup-scan [paths...] [options]

Checks React source against the Face Up catalogue. Paths default to the current directory.
With --url, it also opens each page in Chrome or Edge, runs axe, and runs Face Up's browser checks.

Options:
  --url <address>                            A page to open and check in a browser, such as http://localhost:5173.
                                             Repeat it to check several pages. With only --url, no source is scanned.
  --viewport <width>                         Window width in pixels for the browser checks (default: 1280).
                                             Keyboard checks also run at 375 when the width is wider than that.
  --steps <file>                             A JSON file of screens to reach by clicking after a page loads, such as
                                             views and dialogs in a single-page app. Each is checked as its own page.
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
      viewport: { type: 'string', default: '1280' },
      steps: { type: 'string' },
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
const width = Number(values.viewport);
if (!Number.isInteger(width) || width < 200 || width > 4000) fail(`--viewport must be a width in pixels between 200 and 4000, not "${values.viewport}"`);
let states = [];
let storageState;
if (values.steps) {
  let file;
  try {
    file = JSON.parse(readFileSync(values.steps, 'utf8'));
  } catch (error) {
    fail(`could not read --steps file: ${error.message.split('\n')[0]}`);
  }
  if (!Array.isArray(file.states) || !file.states.length) fail('the --steps file needs a "states" list');
  for (const [i, state] of file.states.entries()) {
    if (typeof state.name !== 'string' || typeof state.url !== 'string' || !Array.isArray(state.steps)) fail(`state ${i + 1} in the --steps file needs a "name", a "url" and a "steps" list`);
    for (const step of state.steps) {
      const kinds = Object.keys(step).filter((k) => STEP_KINDS.includes(k));
      if (kinds.length !== 1) fail(`each step in "${state.name}" needs exactly one of ${STEP_KINDS.join(', ')}`);
    }
  }
  states = file.states;
  if (file.storageState) storageState = resolve(dirname(values.steps), file.storageState);
}
if (!FAIL_ON.includes(values['fail-on'])) fail(`unknown --fail-on value "${values['fail-on']}"`);

let result;
try {
  const urls = values.url ?? [];
  result = scan(positionals.length ? positionals : urls.length || states.length ? [] : ['.'], { rulesUrl: values['rules-url'] });
  if (urls.length || states.length) {
    const browser = await renderScan(urls, { width, states, storageState });
    result.findings.push(...browser.findings.map((f) => ({ ...f, file: f.page, line: 0, column: 0 })));
    result.notAssessed.push(...browser.notAssessed.map((n) => ({ ...n, file: n.page })));
    result.browser = { name: browser.browser, axeVersion: browser.axeVersion, pages: browser.pages, pageErrors: browser.pageErrors, axeOther: browser.axeOther, axeIncomplete: browser.axeIncomplete };
  }
} catch (error) {
  process.stderr.write(`faceup-scan: ${error.message}\n`);
  process.exit(2);
}

const gating = gatingFindings(result, values['fail-on']);
process.stdout.write(FORMATS[values.format](result, gating));
process.exit(gating.length ? 1 : 0);
