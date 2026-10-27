import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { parse } from '@babel/parser';

const SOURCE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'build', 'out', 'coverage']);

export function listSources(path) {
  if (!statSync(path).isDirectory()) return SOURCE_EXT.has(extname(path)) ? [path] : [];
  const out = [];
  for (const entry of readdirSync(path).sort()) {
    if (SKIPPED_DIRS.has(entry) || entry.startsWith('.')) continue;
    out.push(...listSources(join(path, entry)));
  }
  return out;
}

export function looksGenerated(src) {
  const lines = src.split('\n');
  return src.length > 20000 && src.length / lines.length > 250;
}

export function parseSource(src) {
  return parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'], errorRecovery: true });
}

export function walk(node, visit, parent = null) {
  if (!node || typeof node.type !== 'string') return;
  if (visit(node, parent) === false) return;
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra') continue;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => walk(c, visit, node));
    else if (child && typeof child.type === 'string') walk(child, visit, node);
  }
}

export function jsxName(nameNode) {
  if (!nameNode) return '';
  if (nameNode.type === 'JSXIdentifier') return nameNode.name;
  if (nameNode.type === 'JSXMemberExpression') return `${jsxName(nameNode.object)}.${nameNode.property.name}`;
  return '';
}

export const isComponentName = (name) => /^[A-Z]/.test(name);

export function unwrapComponent(init) {
  if (!init) return null;
  if (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') return init;
  if (init.type === 'CallExpression') return unwrapComponent(init.arguments[0]);
  return null;
}
