import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { listSources, looksGenerated, parseSource } from './ast.mjs';
import { listDocuments, readDocument } from './styles.mjs';
import { loadRules, SEVERITY_RANK } from './rules.mjs';
import { stateBranches } from './checks/state-branches.mjs';
import { controlName } from './checks/control-name.mjs';
import { divButton } from './checks/div-button.mjs';
import { pageStructure } from './checks/page-structure.mjs';
import { focusVisible } from './checks/focus-visible.mjs';
import { reducedMotion } from './checks/reduced-motion.mjs';

export const CHECKS = [
  { check: stateBranches },
  { check: controlName, canFailBuild: true },
  { check: divButton, canFailBuild: true },
  { check: pageStructure, rules: ['faceup-heading-order', 'faceup-vague-link-text'] },
  { check: focusVisible },
  { check: reducedMotion },
];

const enabledRules = (entry) => entry.rules ?? entry.check.rules;

const display = (path, cwd) => relative(cwd, path).split(sep).join('/');

function packageRoot(file, fallback, cache) {
  const seen = [];
  let dir = dirname(file);
  while (!cache.has(dir)) {
    seen.push(dir);
    if (existsSync(join(dir, 'package.json'))) {
      cache.set(dir, dir);
      break;
    }
    if (dir === dirname(dir) || dir === fallback) {
      cache.set(dir, fallback);
      break;
    }
    dir = dirname(dir);
  }
  const root = cache.get(dir);
  seen.forEach((d) => cache.set(d, root));
  return root;
}

function byLocation(a, b) {
  return a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column || a.rule.localeCompare(b.rule);
}

export function scan(paths, { rulesUrl, cwd = process.cwd() } = {}) {
  const rules = loadRules(rulesUrl);
  for (const entry of CHECKS) {
    for (const id of enabledRules(entry)) {
      if (!rules.has(id)) throw new Error(`Check ${entry.check.name} reports ${id}, which is not in the catalogue.`);
      if (!entry.check.rules.includes(id)) throw new Error(`Check ${entry.check.name} does not report ${id}.`);
    }
  }

  const seen = new Set();
  const roots = new Map();
  const projects = new Map();
  const files = [];
  const parseErrors = [];
  const skipped = [];
  const project = (root) => {
    if (!projects.has(root)) projects.set(root, { files: [], documents: [] });
    return projects.get(root);
  };
  for (const path of paths) {
    const base = resolve(cwd, path);
    if (statSync(base).isDirectory()) {
      for (const doc of listDocuments(base)) {
        if (seen.has(doc)) continue;
        seen.add(doc);
        project(packageRoot(doc, base, roots)).documents.push(readDocument(doc));
      }
    }
    for (const file of listSources(base)) {
      if (seen.has(file)) continue;
      seen.add(file);
      const src = readFileSync(file, 'utf8');
      if (looksGenerated(src)) {
        skipped.push(display(file, cwd));
        continue;
      }
      try {
        const parsed = { path: file, src, ast: parseSource(src) };
        const root = packageRoot(file, base, roots);
        files.push(parsed);
        project(root).files.push(parsed);
      } catch (error) {
        parseErrors.push({ file: display(file, cwd), message: error.message });
      }
    }
  }

  const findings = [];
  const notAssessed = [];
  const canFailBuild = new Set();
  for (const entry of CHECKS) {
    const enabled = new Set(enabledRules(entry));
    if (entry.canFailBuild) enabled.forEach((id) => canFailBuild.add(id));
    for (const scope of projects.values()) {
      const result = entry.check.run(scope);
      findings.push(...result.findings.filter((f) => enabled.has(f.rule)).map((f) => ({ ...f, file: display(f.file, cwd) })));
      notAssessed.push(...result.notAssessed.filter((n) => enabled.has(n.rule)).map((n) => ({ ...n, file: display(n.file, cwd) })));
    }
  }
  findings.sort(byLocation);
  notAssessed.sort((a, b) => a.file.localeCompare(b.file) || (a.component ?? '').localeCompare(b.component ?? ''));

  return { rules, checks: CHECKS.map((c) => c.check.name), canFailBuild, filesScanned: files.length + [...projects.values()].reduce((n, p) => n + p.documents.length, 0), skipped, parseErrors, findings, notAssessed };
}

export function gatingFindings(result, failOn) {
  if (failOn === 'none') return [];
  const threshold = SEVERITY_RANK[failOn];
  return result.findings.filter((f) => {
    const rule = result.rules.get(f.rule);
    return !f.page && result.canFailBuild.has(f.rule) && rule.gateable && SEVERITY_RANK[rule.severity] >= threshold;
  });
}
