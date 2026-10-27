import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { walk, jsxName, isComponentName } from '../ast.mjs';
import { indexProject } from '../project.mjs';

const RULES = {
  lang: 'faceup-lang-missing',
  title: 'faceup-page-title-generic',
  headings: 'faceup-heading-order',
  links: 'faceup-vague-link-text',
};
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'build', 'out', 'coverage']);
const LANGUAGES = new Set(
  'aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'.split(' '),
);
export const PLACEHOLDER_TITLES = new Set([
  'react app',
  'create react app',
  'vite app',
  'vite + react',
  'vite + react + ts',
  'vite + ts',
  'vite + vue',
  'vite + vue + ts',
  'vite + svelte',
  'vite + svelte + ts',
  'vite + preact',
  'vite + preact + ts',
  'vite + lit',
  'create next app',
  'document',
  'untitled',
  'untitled document',
]);
const VAGUE_LINKS = new Set(['click here', 'read more', 'learn more', 'here', 'more', 'this link']);
const TITLE_HOOK = /^use\w*(Title|Head|SeoMeta|Meta)$/;
const HEADING_TAG = /^h([1-6])$/;
const LINK_ELEMENT = /^(a|Link|NavLink|[A-Z]\w*Link)$|\.Link$/;
const MAY_RENDER_HEADING = /Heading|Title|Header/;
const OPAQUE_NAME = /^children$|(Children|Content|Section|Slot)$/;

const at = (node) => ({ line: node.loc.start.line, column: node.loc.start.column + 1 });
const squash = (text) => text.replace(/\s+/g, ' ').trim();
const normaliseLink = (text) => squash(text).toLowerCase().replace(/^[\s→»›>….!:·-]+|[\s→»›>….!:·-]+$/g, '');
const quote = (text) => (text.length > 60 ? `${text.slice(0, 57)}...` : text);

function validLang(value) {
  const match = value.trim().match(/^([a-zA-Z]{2,3})(-[a-zA-Z0-9]{1,8})*$/);
  if (!match) return false;
  return match[1].length === 3 || LANGUAGES.has(match[1].toLowerCase());
}

const templated = (value) => /\{\{|\{%|<%|%[A-Z_]+%|\$\{/.test(value);

function packageRoot(file) {
  let dir = dirname(file);
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  return null;
}

function listHtml(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    if (SKIPPED_DIRS.has(entry) || entry.startsWith('.')) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...listHtml(path));
    else if (extname(entry) === '.html') out.push(path);
  }
  return out;
}

function blank(src, pattern) {
  return src.replace(pattern, (m) => m.replace(/[^\n]/g, ' '));
}

function parseAttrs(text) {
  const attrs = new Map();
  for (const m of text.matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attrs.set(m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

const decode = (text) =>
  text
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&rarr;|&raquo;|&rsaquo;|&gt;/g, '>')
    .replace(/&hellip;/g, '…')
    .replace(/&[a-z]+;|&#\d+;/g, ' ');

function blankIgnored(text) {
  let out = text;
  for (const open of text.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*\sdata-faceup-ignore\b[^>]*>/g)) {
    const tags = new RegExp(`<(/?)${open[1]}\\b[^>]*>`, 'gi');
    tags.lastIndex = open.index + open[0].length;
    let depth = 1;
    let end = text.length;
    for (let m = tags.exec(text); m; m = tags.exec(text)) {
      depth += m[1] ? -1 : 1;
      if (!depth) {
        end = m.index + m[0].length;
        break;
      }
    }
    out = out.slice(0, open.index) + out.slice(open.index, end).replace(/[^\n]/g, ' ') + out.slice(end);
  }
  return out;
}

function parseHtml(src) {
  const clean = blankIgnored(blank(blank(src, /<!--[\s\S]*?-->/g), /<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi));
  const lineStarts = [0];
  for (let i = 0; i < src.length; i += 1) if (src[i] === '\n') lineStarts.push(i + 1);
  const position = (offset) => {
    let line = lineStarts.length - 1;
    while (lineStarts[line] > offset) line -= 1;
    return { line: line + 1, column: offset - lineStarts[line] + 1 };
  };
  const tags = [...clean.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g)].map((m) => ({
    closing: m[1] === '/',
    name: m[2].toLowerCase(),
    attrs: parseAttrs(m[3]),
    start: m.index,
    end: m.index + m[0].length,
  }));
  const inner = (open) => {
    const close = tags.find((t) => t.closing && t.name === open.name && t.start > open.start);
    const body = close ? clean.slice(open.end, close.start) : '';
    const alts = [...body.matchAll(/<img\b([^>]*)>/gi)].map((m) => parseAttrs(m[1]).get('alt') ?? '');
    return squash(decode(`${body.replace(/<[^>]*>/g, ' ')} ${alts.join(' ')}`));
  };
  return { tags, position, inner, scripted: /<script\b/i.test(src) };
}

function staticText(node) {
  let text = '';
  let dynamic = false;
  walk(node, (n, parent) => {
    if (n === node) return undefined;
    if (n.type === 'JSXText') text += ` ${n.value}`;
    else if (n.type === 'JSXExpressionContainer' && parent?.type !== 'JSXAttribute') {
      const e = n.expression;
      if (e.type === 'StringLiteral') text += ` ${e.value}`;
      else if (e.type === 'TemplateLiteral' && !e.expressions.length) text += ` ${e.quasis[0].value.cooked}`;
      else if (e.type !== 'JSXEmptyExpression') dynamic = true;
      return false;
    } else if (n.type === 'JSXAttribute') {
      const owner = parent?.name && jsxName(parent.name);
      if (owner === 'img' && n.name.name === 'alt' && n.value?.type === 'StringLiteral') text += ` ${n.value.value}`;
      return false;
    }
    return undefined;
  });
  return { text: squash(text), dynamic };
}

function attr(opening, name) {
  const found = opening.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === name);
  if (!found) return undefined;
  if (!found.value) return { literal: '' };
  if (found.value.type === 'StringLiteral') return { literal: found.value.value };
  const e = found.value.expression;
  if (e?.type === 'StringLiteral') return { literal: e.value };
  if (e?.type === 'TemplateLiteral' && !e.expressions.length) return { literal: e.quasis[0].value.cooked };
  return { literal: null };
}

const hasSpread = (opening) => opening.attributes.some((a) => a.type === 'JSXSpreadAttribute');

function nextDocumentHtml(ast) {
  const names = new Set();
  for (const s of ast.program.body) {
    if (s.type === 'ImportDeclaration' && s.source.value === 'next/document') {
      s.specifiers.forEach((sp) => sp.type === 'ImportSpecifier' && (sp.imported.name ?? sp.imported.value) === 'Html' && names.add(sp.local.name));
    }
  }
  return names;
}

function langMessage(value) {
  if (value === undefined || value.trim() === '') return 'The page does not say what language it is written in, so a screen reader may read it aloud with the wrong voice and pronunciation.';
  return `The page gives its language as "${quote(value)}", which is not a valid language code, so a screen reader may read it aloud with the wrong voice and pronunciation.`;
}

function checkLangJsx(file, ast, findings, notAssessed, i18nRoots) {
  const nextHtml = nextDocumentHtml(ast);
  walk(ast, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    const name = jsxName(node.name);
    if (name !== 'html' && !nextHtml.has(name)) return;
    const lang = attr(node, 'lang');
    const base = { file: file.path, rule: RULES.lang };
    if (lang === undefined && hasSpread(node)) notAssessed.push({ ...base, reason: 'the language may be set by spread attributes' });
    else if (lang === undefined && nextHtml.has(name) && i18nRoots.has(packageRoot(file.path))) notAssessed.push({ ...base, reason: 'Next.js i18n routing may add the language' });
    else if (lang && lang.literal === null) notAssessed.push({ ...base, reason: 'the language is set from a value only known when the page runs' });
    else if (lang === undefined || !validLang(lang.literal)) findings.push({ ...base, ...at(node), message: langMessage(lang?.literal) });
  });
}

function checkLangHtml(path, html, findings, notAssessed) {
  const tag = html.tags.find((t) => !t.closing && t.name === 'html');
  if (!tag) return;
  const value = tag.attrs.get('lang');
  const base = { file: path, rule: RULES.lang };
  if (value !== undefined && templated(value)) notAssessed.push({ ...base, reason: 'the language is filled in by a template' });
  else if (value === undefined || !validLang(value)) findings.push({ ...base, ...html.position(tag.start), message: langMessage(value) });
}

function titleSitesJsx(file, ast) {
  const sites = [];
  const add = (node, text) => sites.push({ file: file.path, ...at(node), text: text === null ? null : squash(text) });
  walk(ast, (node, parent) => {
    if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && node.left.property.name === 'title') {
      const object = node.left.object;
      const isDocument = (object.type === 'Identifier' && object.name === 'document') || (object.type === 'MemberExpression' && object.property.name === 'document');
      if (isDocument) add(node, node.right.type === 'StringLiteral' ? node.right.value : null);
    }
    const inSvg = parent?.type === 'JSXElement' && jsxName(parent.openingElement.name) === 'svg';
    if (node.type === 'JSXElement' && jsxName(node.openingElement.name) === 'title' && !inSvg) {
      const { text, dynamic } = staticText(node);
      add(node, dynamic ? null : text);
    }
    if (node.type === 'JSXOpeningElement' && jsxName(node.name) === 'Helmet' && ['title', 'titleTemplate', 'defaultTitle'].some((a) => attr(node, a))) add(node, null);
    if (node.type === 'CallExpression') {
      const callee = node.callee;
      if (callee.type === 'Identifier' && TITLE_HOOK.test(callee.name)) add(node, null);
      if (callee.type === 'MemberExpression' && callee.property.name === 'setTitle') add(node, null);
    }
    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      const decl = node.declaration;
      if (decl.type === 'FunctionDeclaration' && ['generateMetadata', 'meta'].includes(decl.id?.name)) add(node, null);
      if (decl.type === 'VariableDeclaration') {
        for (const d of decl.declarations) {
          const name = d.id.name;
          if (name === 'generateMetadata' || name === 'meta') add(node, null);
          if (name !== 'metadata' || d.init?.type !== 'ObjectExpression') continue;
          const title = d.init.properties.find((p) => p.type === 'ObjectProperty' && (p.key.name ?? p.key.value) === 'title');
          if (!title) continue;
          const v = title.value;
          const def = v.type === 'ObjectExpression' && v.properties.find((p) => p.type === 'ObjectProperty' && p.key.name === 'default');
          const hasTemplate = v.type === 'ObjectExpression' && v.properties.some((p) => p.type === 'ObjectProperty' && p.key.name === 'template');
          const literal = v.type === 'StringLiteral' ? v.value : def?.value?.type === 'StringLiteral' && !hasTemplate ? def.value.value : null;
          add(title, literal);
        }
      }
    }
  });
  return sites;
}

function checkTitles(codeSites, htmlSites, findings) {
  const isPlaceholder = (s) => s.text !== null && PLACEHOLDER_TITLES.has(s.text.toLowerCase());
  if (codeSites.some((s) => !isPlaceholder(s))) return;
  for (const s of [...codeSites, ...htmlSites].filter(isPlaceholder)) {
    findings.push({
      file: s.file,
      line: s.line,
      column: s.column,
      rule: RULES.title,
      message: `Every view shows the placeholder title "${s.text}" in the browser tab and nothing in the code changes it, so people cannot tell which page they are on.`,
    });
  }
}

function styledHeadings(ast) {
  const levels = new Map();
  walk(ast, (node) => {
    if (node.type !== 'VariableDeclarator' || node.id.type !== 'Identifier' || !node.init) return;
    let tag = node.init.type === 'TaggedTemplateExpression' ? node.init.tag : node.init;
    while (tag?.type === 'CallExpression' && tag.callee.type === 'MemberExpression') tag = tag.callee.object;
    if (tag?.type === 'MemberExpression' && tag.object.name === 'styled' && HEADING_TAG.test(tag.property.name)) levels.set(node.id.name, Number(tag.property.name[1]));
    if (tag?.type === 'CallExpression' && tag.callee.name === 'styled' && tag.arguments[0]?.type === 'StringLiteral') {
      const m = tag.arguments[0].value.match(HEADING_TAG);
      if (m) levels.set(node.id.name, Number(m[1]));
    }
  });
  return levels;
}

function headingLevel(opening, styled) {
  const as = attr(opening, 'as');
  const asMatch = as?.literal?.match(HEADING_TAG);
  if (asMatch) return Number(asMatch[1]);
  const name = jsxName(opening.name);
  const m = name.match(HEADING_TAG);
  if (m) return Number(m[1]);
  return styled.get(name) ?? null;
}

function makeHeadingOracle(index, styledByFile) {
  const memo = new Map();
  function componentMayRender(entry) {
    if (memo.has(entry.key)) return memo.get(entry.key);
    memo.set(entry.key, false);
    let may = false;
    const styled = styledByFile.get(entry.file) ?? new Map();
    walk(entry.fn.body, (node) => {
      if (may || node.type !== 'JSXOpeningElement') return;
      if (headingLevel(node, styled)) may = true;
      else if (elementMayRender(entry.file, node, styled)) may = true;
    });
    memo.set(entry.key, may);
    return may;
  }
  function elementMayRender(file, opening, styled) {
    const name = jsxName(opening.name);
    if (!isComponentName(name) || styled.has(name)) return false;
    const target = index.resolveName(file, name.split('.')[0]);
    if (!target) return MAY_RENDER_HEADING.test(name);
    return componentMayRender(target);
  }
  return elementMayRender;
}

function branchPath(ancestors) {
  const path = [];
  for (let i = 0; i < ancestors.length - 1; i += 1) {
    const node = ancestors[i];
    const child = ancestors[i + 1];
    if (node.type === 'ConditionalExpression' && child !== node.test) path.push([node, child === node.consequent ? 'c' : 'a']);
    if (node.type === 'IfStatement' && child !== node.test) path.push([node, child === node.consequent ? 'c' : 'a']);
    if (node.type === 'SwitchStatement' && child !== node.discriminant) path.push([node, node.cases.indexOf(child)]);
    if (node.type === 'ReturnStatement') path.push([ancestors.slice(0, i).findLast((a) => /Function/.test(a.type)), node]);
  }
  return path;
}

const exclusive = (a, b) => a.some(([node, side]) => b.some(([n2, s2]) => n2 === node && s2 !== side));

function opaqueContent(e) {
  if (e.type === 'Identifier' || e.type === 'MemberExpression') {
    const name = e.type === 'Identifier' ? e.name : e.property.name;
    return OPAQUE_NAME.test(name ?? '');
  }
  if (e.type === 'CallExpression') {
    const callee = e.callee.type === 'MemberExpression' ? e.callee.property.name : e.callee.name;
    return /^render/i.test(callee ?? '');
  }
  return false;
}

function componentEvents(entry, styled, mayRender, nestedComponents) {
  const events = [];
  const ancestors = [];
  let inHeading = 0;
  const visit = (node) => {
    if (!node || typeof node.type !== 'string') return;
    if (node !== entry.fn && nestedComponents.has(node)) return;
    ancestors.push(node);
    if (node.type === 'JSXElement') {
      const level = headingLevel(node.openingElement, styled);
      if (level) {
        events.push({ kind: 'heading', level, text: staticText(node).text, node, path: branchPath(ancestors) });
        inHeading += 1;
      } else if (!inHeading && mayRender(entry.file, node.openingElement, styled)) {
        events.push({ kind: 'unknown', path: branchPath(ancestors) });
      }
    }
    if (!inHeading && node.type === 'JSXExpressionContainer' && ancestors[ancestors.length - 2]?.type !== 'JSXAttribute' && opaqueContent(node.expression)) {
      events.push({ kind: 'unknown', path: branchPath(ancestors) });
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra') continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child.type === 'string') visit(child);
    }
    if (node.type === 'JSXElement' && headingLevel(node.openingElement, styled)) inHeading -= 1;
    ancestors.pop();
  };
  visit(entry.fn);
  return events;
}

function headingMessage(heading, previous) {
  const label = heading.text ? `The heading "${quote(heading.text)}"` : 'A heading';
  return `${label} jumps from level ${previous} to level ${heading.level}, so people who move through the page by headings are told a level exists that is missing.`;
}

function checkHeadingEvents(events, file, component, findings, notAssessed) {
  const headings = events.filter((e) => e.kind === 'heading');
  headings.forEach((h, i) => {
    let prevIndex = -1;
    for (let j = i - 1; j >= 0; j -= 1) {
      if (!exclusive(headings[j].path, h.path)) {
        prevIndex = j;
        break;
      }
    }
    const base = { file, component, rule: RULES.headings };
    if (prevIndex === -1) {
      if (h.level > 2) notAssessed.push({ ...base, reason: `the first heading is level ${h.level}; whether a level is skipped depends on the component that renders this one` });
      return;
    }
    const prev = headings[prevIndex];
    if (h.level - prev.level <= 1) return;
    const from = events.indexOf(prev);
    const to = events.indexOf(h);
    const between = events.slice(from + 1, to).some((e) => e.kind === 'unknown' && !exclusive(e.path, h.path));
    if (between) notAssessed.push({ ...base, reason: `level ${prev.level} is followed by level ${h.level}, but content from another component sits between them and may supply the missing level` });
    else findings.push({ ...base, ...at(h.node), message: headingMessage(h, prev.level) });
  });
}

function checkHeadingsHtml(path, html, findings, notAssessed) {
  const headings = html.tags.filter((t) => !t.closing && HEADING_TAG.test(t.name)).map((t) => ({ tag: t, level: Number(t.name[1]), text: html.inner(t) }));
  const base = { file: path, rule: RULES.headings };
  headings.forEach((h, i) => {
    if (i > 0 && h.level - headings[i - 1].level > 1) findings.push({ ...base, ...html.position(h.tag.start), message: headingMessage(h, headings[i - 1].level) });
  });
  const doc = html.tags.find((t) => !t.closing && t.name === 'html');
  if (!doc || headings.some((h) => h.level === 1)) return;
  if (!headings.length && html.scripted) {
    notAssessed.push({ ...base, reason: 'the page has no headings in its file; they are added by scripts when it runs' });
    return;
  }
  const body = html.tags.find((t) => !t.closing && t.name === 'body') ?? doc;
  findings.push({ ...base, ...html.position(body.start), message: 'This page has no main (level 1) heading, so people who move through the page by headings have no top-level heading to start from.' });
}

function linkMessage(text) {
  return `The link "${quote(text)}" does not say where it goes, so it makes no sense when read on its own, for example in a screen reader's list of links.`;
}

function checkLinksJsx(file, ast, findings, notAssessed) {
  walk(ast, (node) => {
    if (node.type !== 'JSXElement') return;
    const opening = node.openingElement;
    if (!LINK_ELEMENT.test(jsxName(opening.name))) return;
    const base = { file: file.path, rule: RULES.links };
    if (attr(opening, 'aria-labelledby')) return;
    const label = attr(opening, 'aria-label');
    let name;
    if (label && label.literal !== null) name = label.literal;
    else if (label) return;
    else {
      const { text, dynamic } = staticText(node);
      if (dynamic) {
        if (VAGUE_LINKS.has(normaliseLink(text))) notAssessed.push({ ...base, reason: `the link reads "${quote(text)}" plus words only known when the page runs` });
        return;
      }
      name = text;
    }
    if (VAGUE_LINKS.has(normaliseLink(name))) findings.push({ ...base, ...at(node), message: linkMessage(squash(name)) });
  });
}

function checkLinksHtml(path, html, findings) {
  for (const tag of html.tags) {
    if (tag.closing || tag.name !== 'a' || tag.attrs.has('aria-labelledby')) continue;
    const name = tag.attrs.has('aria-label') ? tag.attrs.get('aria-label') : html.inner(tag);
    if (VAGUE_LINKS.has(normaliseLink(name))) findings.push({ file: path, rule: RULES.links, ...html.position(tag.start), message: linkMessage(squash(name)) });
  }
}

export const pageStructure = {
  name: 'page-structure',
  rules: Object.values(RULES),
  run(project) {
    const findings = [];
    const notAssessed = [];
    const roots = new Set(project.files.map((f) => packageRoot(f.path)).filter(Boolean));
    const htmlFiles = project.documents ? project.documents.map((d) => d.path).filter((p) => p.endsWith('.html')).sort() : [...new Set([...roots].flatMap(listHtml))].sort();
    const i18nRoots = new Set(
      [...roots].filter((root) => ['next.config.js', 'next.config.mjs', 'next.config.ts'].some((n) => existsSync(join(root, n)) && /\bi18n\b/.test(readFileSync(join(root, n), 'utf8')))),
    );
    const index = indexProject(project.files);
    const styledByFile = new Map(project.files.map(({ path, ast }) => [path, styledHeadings(ast)]));
    const mayRender = makeHeadingOracle(index, styledByFile);
    const componentFns = new Set(index.entries.map((e) => e.fn));
    const titleSites = [];
    const htmlTitles = [];

    for (const file of project.files) {
      checkLangJsx(file, file.ast, findings, notAssessed, i18nRoots);
      titleSites.push(...titleSitesJsx(file, file.ast));
      checkLinksJsx(file, file.ast, findings, notAssessed);
    }
    for (const entry of index.entries) {
      if (!isComponentName(entry.name)) continue;
      const events = componentEvents(entry, styledByFile.get(entry.file), mayRender, componentFns);
      checkHeadingEvents(events, entry.file, entry.name, findings, notAssessed);
    }
    for (const path of htmlFiles) {
      const src = readFileSync(path, 'utf8');
      const html = parseHtml(src);
      checkLangHtml(path, html, findings, notAssessed);
      const headEnd = html.tags.find((t) => t.closing && t.name === 'head')?.start ?? Infinity;
      const title = html.tags.find((t) => !t.closing && t.name === 'title' && t.start < headEnd);
      if (title) htmlTitles.push({ file: path, ...html.position(title.start), text: templated(html.inner(title)) ? null : html.inner(title) });
      checkHeadingsHtml(path, html, findings, notAssessed);
      checkLinksHtml(path, html, findings);
    }
    checkTitles(titleSites, htmlTitles, findings);
    return { findings, notAssessed };
  },
};
