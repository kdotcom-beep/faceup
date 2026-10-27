import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { jsxName, looksGenerated } from './ast.mjs';

const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'build', 'out', 'coverage']);
const TRANSPARENT_AT_RULES = new Set(['media', 'supports', 'layer', 'container', 'document', 'scope']);
const STYLED_TAGS = new Set(['css', 'keyframes', 'createGlobalStyle', 'injectGlobal', 'global']);
const IGNORED_VARIANTS = /^(sm|md|lg|xl|2xl|dark|rtl|ltr|print|max-[\w-]+|min-\[.*\]|max-\[.*\]|@[\w-]+|supports-.*)$/;

export function packageRoot(file) {
  let dir = dirname(file);
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  return null;
}

export function listDocuments(dir, out = []) {
  for (const entry of readdirSync(dir).sort()) {
    if (SKIPPED_DIRS.has(entry) || entry.startsWith('.')) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) listDocuments(path, out);
    else if (['.css', '.html'].includes(extname(entry)) && !entry.endsWith('.min.css')) out.push(path);
  }
  return out;
}

export const readDocument = (path) => ({ path, root: packageRoot(path), src: readFileSync(path, 'utf8') });

export function projectDocuments(project) {
  if (project.documents) return project.documents.filter((doc) => !looksGenerated(doc.src));
  const roots = new Set(project.files.map((f) => packageRoot(f.path)).filter(Boolean));
  const paths = new Set();
  for (const root of roots) listDocuments(root, []).forEach((p) => paths.add(p));
  return [...paths]
    .sort()
    .map(readDocument)
    .filter((doc) => !looksGenerated(doc.src));
}

export const blank = (text) => text.replace(/[^\n]/g, ' ');

export function stylesheetText(doc) {
  if (doc.path.endsWith('.css')) return doc.src;
  const html = doc.src.replace(/<!--[\s\S]*?-->/g, blank);
  let text = '';
  let last = 0;
  for (const match of html.matchAll(/(<style\b[^>]*>)([\s\S]*?)<\/style>/gi)) {
    const start = match.index + match[1].length;
    text += blank(html.slice(last, start)) + match[2];
    last = start + match[2].length;
  }
  return text + blank(html.slice(last));
}

export function splitTopLevel(text, separator) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(' || ch === '[') depth += 1;
    if (ch === ')' || ch === ']') depth -= 1;
    if (ch === separator && depth === 0) {
      parts.push(current);
      current = '';
    } else current += ch;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function nestSelectors(parents, prelude) {
  const children = splitTopLevel(prelude.replace(/\s+/g, ' '), ',');
  if (!parents.length) return children.map((c) => c.replace(/&/g, ''));
  return parents.flatMap((p) => children.map((c) => (c.includes('&') ? c.replace(/&/g, p) : `${p} ${c}`)));
}

function closingBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    if (text[i] === '}') depth -= 1;
    if (depth === 0) return i;
  }
  return text.length - 1;
}

export function parseCss(raw, root = null) {
  const text = raw.replace(/\/\*[\s\S]*?\*\//g, blank);
  const rules = [];
  const keyframes = new Map();
  const rootRule = root ? { selectors: [root], decls: [], applies: [], media: [], line: 1 } : null;
  if (rootRule) rules.push(rootRule);
  const stack = [{ selectors: root ? [root] : [], media: [], rule: rootRule }];
  let buf = '';
  let bufLine = 1;
  let line = 1;
  let parens = 0;
  let quote = null;

  const flush = () => {
    const statement = buf.trim();
    buf = '';
    const frame = stack[stack.length - 1];
    if (!statement || !frame.rule) return;
    if (statement.startsWith('@apply')) {
      frame.rule.applies.push({ tokens: statement.slice(6).trim().split(/\s+/), line: bufLine });
      return;
    }
    const colon = statement.indexOf(':');
    if (colon < 1) return;
    frame.rule.decls.push({ prop: statement.slice(0, colon).trim().toLowerCase(), value: statement.slice(colon + 1).trim(), line: bufLine });
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\n') line += 1;
    if (quote) {
      if (ch === quote && text[i - 1] !== '\\') quote = null;
      buf += ch;
      continue;
    }
    if (!buf.trim() && /\S/.test(ch)) bufLine = line;
    if (ch === '"' || ch === "'") quote = ch;
    if (ch === '(') parens += 1;
    if (ch === ')') parens = Math.max(0, parens - 1);
    if (parens > 0 || (ch !== '{' && ch !== '}' && ch !== ';')) {
      buf += ch;
      continue;
    }
    const frame = stack[stack.length - 1];
    if (ch === ';') flush();
    else if (ch === '}') {
      flush();
      if (stack.length > 1) stack.pop();
    } else {
      const prelude = buf.trim();
      buf = '';
      const at = prelude.match(/^@(-[\w]+-)?([\w-]+)/);
      if (at && at[2] === 'keyframes') {
        const end = closingBrace(text, i);
        keyframes.set(prelude.split(/\s+/)[1], text.slice(i, end));
        line += (text.slice(i + 1, end + 1).match(/\n/g) ?? []).length;
        i = end;
      } else if (at && TRANSPARENT_AT_RULES.has(at[2])) {
        stack.push({ selectors: frame.selectors, media: [...frame.media, prelude], rule: null });
      } else if (at) {
        stack.push({ selectors: [], media: frame.media, rule: null });
      } else {
        const rule = { selectors: nestSelectors(frame.selectors, prelude), decls: [], applies: [], media: frame.media, line: bufLine };
        rules.push(rule);
        stack.push({ selectors: rule.selectors, media: frame.media, rule });
      }
    }
  }
  return { rules, keyframes };
}

export function subjectCompound(selector) {
  let depth = 0;
  for (let i = selector.length - 1; i >= 0; i -= 1) {
    const ch = selector[i];
    if (ch === ')' || ch === ']') depth += 1;
    if (ch === '(' || ch === '[') depth -= 1;
    if (depth === 0 && /[\s>+~]/.test(ch)) return selector.slice(i + 1);
  }
  return selector;
}

export function simpleParts(compound) {
  const base = compound.replace(/::?[\w-]+(\((?:[^()]|\([^()]*\))*\))?/g, '');
  const parts = base.match(/^[a-zA-Z][\w-]*|[.#][\w-]+|\[[^\]]*\]/g) ?? [];
  return parts.filter((p) => p !== '*');
}

export function specificity(selector) {
  const s = selector
    .replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '')
    .replace(/:(not|is|has|matches)\(/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/\[[^\]]*\]/g, ' .attr ');
  const ids = (s.match(/#[\w-]+/g) ?? []).length;
  const elements = (s.match(/::[\w-]+/g) ?? []).length;
  const classes = (s.replace(/::[\w-]+/g, '').match(/[.:][\w-]+/g) ?? []).length;
  const types = (s.replace(/[#.:][\w-]+/g, ' ').match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) ?? []).length;
  return ids * 10000 + classes * 100 + types + elements;
}

function templateText(quasi) {
  let text = '';
  quasi.quasis.forEach((q, i) => {
    text += q.value.raw;
    const next = quasi.quasis[i + 1];
    if (next) text += `var(--x)${'\n'.repeat(next.loc.start.line - q.loc.end.line)}`;
  });
  return text.replace(/(^|[\s;{}])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)));
}

function styledTag(tag) {
  let node = tag;
  while (node.type === 'CallExpression' || (node.type === 'MemberExpression' && node.property.name === 'attrs')) {
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'styled') return { element: null };
    node = node.type === 'CallExpression' ? node.callee : node.object;
  }
  if (node.type === 'MemberExpression' && node.object.type === 'Identifier' && node.object.name === 'styled') return { element: node.property.name };
  if (node.type === 'Identifier' && STYLED_TAGS.has(node.name)) return { element: null, global: node.name !== 'css' };
  return null;
}

export function styledSheets(files) {
  const sheets = [];
  for (const { path, ast } of files) {
    let count = 0;
    const visit = (node) => {
      if (!node || typeof node.type !== 'string') return;
      if (node.type === 'TaggedTemplateExpression') {
        const tag = styledTag(node.tag);
        if (tag) {
          count += 1;
          const root = tag.global ? null : `${tag.element ?? ''}.__styled${count}`;
          const offset = node.quasi.loc.start.line - 1;
          const parsed = parseCss(templateText(node.quasi), root);
          parsed.rules.forEach((r) => {
            r.line += offset;
            r.decls.forEach((d) => (d.line += offset));
          });
          sheets.push({ file: path, ...parsed, styled: true });
        }
      }
      for (const key of Object.keys(node)) {
        if (key === 'loc') continue;
        const child = node[key];
        if (Array.isArray(child)) child.forEach(visit);
        else if (child && typeof child.type === 'string') visit(child);
      }
    };
    visit(ast.program);
  }
  return sheets;
}

export function parseToken(raw) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of raw) {
    if (ch === '[') depth += 1;
    if (ch === ']') depth -= 1;
    if (ch === ':' && depth === 0) {
      parts.push(current);
      current = '';
    } else current += ch;
  }
  const utility = current.replace(/^!|!$/g, '').replace(/^-/, '');
  return { raw, variants: parts.filter((v) => !IGNORED_VARIANTS.test(v)), utility };
}

function collectStrings(node, bindings, out, seen) {
  if (!node || typeof node.type !== 'string') return out;
  if (node.type === 'StringLiteral') out.push(node.value);
  if (node.type === 'TemplateElement') out.push(node.value.cooked ?? node.value.raw);
  if (node.type === 'Identifier' && bindings.has(node.name) && !seen.has(node.name)) {
    seen.add(node.name);
    collectStrings(bindings.get(node.name), bindings, out, seen);
  }
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'key') continue;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => collectStrings(c, bindings, out, seen));
    else if (child && typeof child.type === 'string') collectStrings(child, bindings, out, seen);
  }
  return out;
}

function bindingsOf(ast) {
  const bindings = new Map();
  const visit = (node) => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.init && !bindings.has(node.id.name)) {
      if (node.init.type !== 'ArrowFunctionExpression' && node.init.type !== 'FunctionExpression') bindings.set(node.id.name, node.init);
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc') continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child.type === 'string') visit(child);
    }
  };
  visit(ast.program);
  return bindings;
}

export function attribute(opening, name) {
  return opening.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === name);
}

export function classGroups(file) {
  const bindings = bindingsOf(file.ast);
  const groups = [];
  const visit = (node, ancestors) => {
    if (!node || typeof node.type !== 'string') return;
    let next = ancestors;
    if (node.type === 'JSXElement') {
      const opening = node.openingElement;
      const attr = attribute(opening, 'className') ?? attribute(opening, 'class');
      const tokens = attr?.value ? collectStrings(attr.value, bindings, [], new Set()).flatMap((s) => s.split(/\s+/)).filter(Boolean) : [];
      const group = { file: file.path, element: opening, name: jsxName(opening.name), tokens: tokens.map(parseToken), line: (attr ?? opening).loc.start.line, column: (attr ?? opening).loc.start.column + 1, ancestors };
      groups.push(group);
      next = [...ancestors, group];
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc') continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach((c) => visit(c, next));
      else if (child && typeof child.type === 'string') visit(child, next);
    }
  };
  visit(file.ast.program, []);
  return groups;
}

export function fileTokens(file) {
  return collectStrings(file.ast.program, new Map(), [], new Set()).flatMap((s) => s.split(/\s+/)).filter(Boolean).map(parseToken);
}
