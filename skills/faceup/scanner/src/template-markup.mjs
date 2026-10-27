import { parseSource, walk } from './ast.mjs';

// Plain JavaScript apps often build their markup in template strings, set with innerHTML or returned
// from render functions. This rewrites each such template as JSX in place, keeping every line where it
// was, so the JSX checks can read that markup and report it at the right line.

const VOID = /<(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)\b([^<>]*?)\/?>/gi;
const RENAMED = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength', minlength: 'minLength', contenteditable: 'contentEditable', autocomplete: 'autoComplete', autofocus: 'autoFocus', colspan: 'colSpan', rowspan: 'rowSpan', srcset: 'srcSet', crossorigin: 'crossOrigin', inputmode: 'inputMode', enterkeyhint: 'enterKeyHint' };
const MARK = '\u0001';
const lineBreaks = (text) => '\n'.repeat((text.match(/\n/g) ?? []).length);

function markupTemplates(ast) {
  const found = [];
  walk(ast.program, (node, parent) => {
    if (node.type !== 'TemplateLiteral') return;
    const tagged = parent?.type === 'TaggedTemplateExpression' && parent.quasi === node;
    if (tagged && !(parent.tag.type === 'Identifier' && parent.tag.name === 'html')) return;
    if (!tagged && !/^\s*<[a-zA-Z]/.test(node.quasis[0].value.raw)) return;
    found.push({ node, replace: tagged ? parent : node });
  });
  return found.sort((a, b) => a.replace.start - b.replace.start);
}

function fixTags(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, (c) => lineBreaks(c))
    .replace(/<[a-zA-Z][^<>]*>/g, (tag) => tag
      .replace(/(\s)([@.?]?)([a-zA-Z][\w:-]*)(?=[\s=/>]|$)/g, (all, space, prefix, name) => {
        if (prefix === '.') return space;
        if (prefix === '@') return `${space}on${name[0].toUpperCase()}${name.slice(1)}`;
        const lower = name.toLowerCase();
        if (RENAMED[lower]) return `${space}${RENAMED[lower]}`;
        if (/^on[a-z]+$/.test(lower)) return `${space}on${lower[2].toUpperCase()}${lower.slice(3)}`;
        return `${space}${name}`;
      }))
    .replace(VOID, '<$1$2/>');
}

function convert(src, templates, start, end) {
  let out = '';
  let pos = start;
  for (const t of templates) {
    if (t.replace.start < pos || t.replace.end > end) continue;
    out += src.slice(pos, t.replace.start) + toJsx(src, templates, t.node);
    pos = t.replace.end;
  }
  return out + src.slice(pos, end);
}

function toJsx(src, templates, node) {
  let text = '';
  node.quasis.forEach((q, i) => {
    text += q.value.raw.replace(/[{}]/g, ' ');
    if (i < node.expressions.length) text += `${MARK}${i}${MARK}`;
  });
  const fixed = fixTags(text);
  let out = '';
  let inTag = false;
  let quote = null;
  for (let i = 0; i < fixed.length; i++) {
    const ch = fixed[i];
    if (ch === MARK) {
      const close = fixed.indexOf(MARK, i + 1);
      const expr = node.expressions[Number(fixed.slice(i + 1, close))];
      const code = src.slice(expr.start, expr.end);
      const before = out.trimEnd();
      if (!inTag) out += `{${convert(src, templates, expr.start, expr.end)}}`;
      else if (quote) out += `x${lineBreaks(code)}`;
      else out += `${before.endsWith('=') ? '{0}' : ''}${lineBreaks(code)}`;
      i = close;
      continue;
    }
    if (inTag && quote && ch === quote) quote = null;
    else if (inTag && !quote && (ch === '"' || ch === "'")) quote = ch;
    else if (!quote && ch === '<') inTag = true;
    else if (!quote && ch === '>') inTag = false;
    out += ch;
  }
  return `<>${out}</>`;
}

const parses = (src) => {
  try {
    return parseSource(src).errors?.length ? null : parseSource(src);
  } catch {
    return null;
  }
};

// Returns the source and AST with markup templates rewritten as JSX, plus how many templates could not be read.
export function withTemplateMarkup(src, ast) {
  const templates = markupTemplates(ast);
  if (!templates.length) return null;
  const outer = templates.filter((t) => !templates.some((o) => o !== t && o.replace.start <= t.replace.start && o.replace.end >= t.replace.end));
  const whole = convert(src, templates, 0, src.length);
  const parsed = parses(whole);
  if (parsed) return { src: whole, ast: parsed, unread: 0 };
  let kept = [];
  for (const t of outer) {
    const trial = [...kept, t];
    const inner = templates.filter((x) => trial.some((o) => o.replace.start <= x.replace.start && o.replace.end >= x.replace.end));
    if (parses(convert(src, inner, 0, src.length))) kept = trial;
  }
  if (!kept.length) return { src, ast, unread: outer.length };
  const inner = templates.filter((x) => kept.some((o) => o.replace.start <= x.replace.start && o.replace.end >= x.replace.end));
  const partial = convert(src, inner, 0, src.length);
  return { src: partial, ast: parseSource(partial), unread: outer.length - kept.length };
}
