import { indexProject } from '../project.mjs';
import { attribute, classGroups, fileTokens, parseCss, parseToken, projectDocuments, simpleParts, specificity, styledSheets, stylesheetText, subjectCompound } from '../styles.mjs';

const RULE = 'faceup-focus-not-visible';
const MESSAGE = 'Keyboard users cannot see which control they are on, because the focus outline is removed here and nothing replaces it.';
const FOCUSABLE_TAGS = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary', 'iframe']);
const MOUSE_ONLY = /:not\(\s*(:focus-visible|\.focus-visible|\[data-focus-visible[^\]]*\])\s*\)/;
const FOCUS = /:focus(?!-within)/;
const OTHER_STATE = /:(hover|active|disabled|visited|checked|target|focus-within|invalid|placeholder-shown)\b/;
const MARKER_PROP = /^(outline|outline-color|outline-style|outline-width|box-shadow|border|border-[\w-]+|background|background-color|text-decoration[\w-]*)$/;
const NO_VALUE = /^(none|0|0px|initial|unset|inherit|transparent)$/;
const REMOVE_UTILITY = /^outline-(none|0|hidden)$/;
const MARKER_UTILITY = /^(outline(-(?!none$|0$|hidden$|offset)\S+)?|ring(?!-0$|-offset)(-\S+)?|border(-\S+)?|shadow(?!-none$)(-\S+)?|bg-\S+|underline|decoration-\S+)$/;
const OWN_FOCUS_VARIANT = /^(focus|focus-visible|focus-within|data-\[focus[\w-]*(=[\w-]+)?\]|data-focus[\w-]*|has-\[:focus[\w-]*\]|\[&:focus[\w-]*\])$/;

function removesOutline(decl) {
  const value = decl.value.replace(/!important/, '').trim().toLowerCase();
  if (decl.prop === 'outline') return /^(0|0px)(\s|$)/.test(value) || /\b(none|transparent)\b/.test(value);
  if (decl.prop === 'outline-style') return value === 'none';
  if (decl.prop === 'outline-width') return /^0(px)?$/.test(value);
  if (decl.prop === 'outline-color') return value === 'transparent';
  return false;
}

const isMarkerDecl = (decl) => MARKER_PROP.test(decl.prop) && !removesOutline(decl) && !NO_VALUE.test(decl.value.replace(/!important/, '').trim().toLowerCase());
const removalKind = (token) => {
  if (!REMOVE_UTILITY.test(token.utility)) return null;
  if (!token.variants.length) return 'base';
  return token.variants.every((v) => v === 'focus' || v === 'focus-visible') ? 'focus' : null;
};
const isFocusMarker = (token, variant) => MARKER_UTILITY.test(token.utility) && token.variants.some((v) => variant.test(v));
const subset = (small, big) => small.every((p) => big.includes(p));

function cssPool(sheets) {
  const restorers = [];
  const removals = [];
  let order = 0;
  for (const sheet of sheets) {
    for (const rule of sheet.rules) {
      order += 1;
      const applied = rule.applies.flatMap((a) => a.tokens.map((raw) => ({ ...parseToken(raw), line: a.line, important: raw.startsWith('!') || raw.endsWith('!') })));
      const markers = [
        ...rule.decls.filter(isMarkerDecl).map((d) => ({ outline: d.prop.startsWith('outline'), important: /!important/.test(d.value) })),
        ...applied.filter((t) => !t.variants.length && MARKER_UTILITY.test(t.utility)).map((t) => ({ outline: t.utility.startsWith('outline'), important: t.important })),
      ];
      const focusApplies = applied.some((t) => isFocusMarker(t, OWN_FOCUS_VARIANT));
      for (const selector of rule.selectors) {
        const compound = subjectCompound(selector);
        if (MOUSE_ONLY.test(compound)) continue;
        if ((FOCUS.test(compound) && markers.length) || focusApplies) {
          restorers.push({ parts: simpleParts(compound), outline: !focusApplies && markers.every((m) => m.outline), important: markers.some((m) => m.important), spec: specificity(selector), order, file: sheet.file });
        }
      }
      const removing = [
        ...rule.decls.filter(removesOutline).map((d) => ({ line: d.line, focus: false })),
        ...applied.filter(removalKind).map((t) => ({ line: t.line, focus: removalKind(t) === 'focus' })),
      ];
      for (const removal of removing) removals.push({ ...removal, rule, order, file: sheet.file, markers });
    }
  }
  return { restorers, removals };
}

function judgeCssPart(selector, removal, restorers) {
  const compound = subjectCompound(selector);
  if (MOUSE_ONLY.test(compound) || compound.includes('::')) return 'skip';
  const focused = FOCUS.test(compound) || removal.focus;
  if (!focused && OTHER_STATE.test(compound)) return 'skip';
  const parts = simpleParts(compound);
  if (parts.some((p) => /^\[tabindex=["']?-1["']?\]$/i.test(p))) return 'skip';
  const tag = parts.find((p) => /^[a-zA-Z]/.test(p));
  const broad = parts.every((p) => /^[a-zA-Z]/.test(p));
  if (!focused && tag && !FOCUSABLE_TAGS.has(tag.toLowerCase()) && !parts.some((p) => /^\[(tabindex|contenteditable|role)/i.test(p))) return 'skip';
  if (focused && removal.markers.length) return 'pass';
  const spec = specificity(selector);
  const covering = restorers.filter((r) => subset(r.parts, parts));
  const winning = covering.filter((r) => !r.outline || r.important || r.spec > spec || (r.spec === spec && r.file === removal.file && r.order > removal.order));
  if (winning.length) return 'pass';
  if (covering.some((r) => r.spec === spec && r.file !== removal.file)) return 'partial';
  if (restorers.some((r) => subset(parts, r.parts))) return 'partial';
  if (!focused && !tag) return 'unknown';
  return broad ? 'broad' : 'fail';
}

function judgeCss(pool, tailwindFocus) {
  const findings = [];
  const notAssessed = [];
  for (const removal of pool.removals) {
    const verdicts = removal.rule.selectors.map((s) => judgeCssPart(s, removal, pool.restorers));
    const base = { file: removal.file, rule: RULE };
    if (verdicts.includes('fail') || (verdicts.includes('broad') && !tailwindFocus)) findings.push({ ...base, line: removal.line, column: 1, message: MESSAGE });
    else if (verdicts.includes('broad')) notAssessed.push({ ...base, reason: 'the outline is removed for every control of a type, and some components add their own keyboard style in class names, so it depends on each control' });
    else if (verdicts.includes('partial')) notAssessed.push({ ...base, reason: 'a keyboard focus style is added back for only some of these controls, or the stylesheet order decides which rule wins' });
    else if (verdicts.includes('unknown')) notAssessed.push({ ...base, reason: 'the outline is removed on a class name, and the styles alone do not show whether it is a control' });
  }
  return { findings, notAssessed };
}

function tagOf(name) {
  const last = name.split('.').pop();
  return /^[a-z]/.test(last) ? last : null;
}

function literalValue(attr) {
  if (!attr) return undefined;
  if (!attr.value) return true;
  if (attr.value.type === 'StringLiteral') return attr.value.value;
  const expr = attr.value.expression;
  if (expr?.type === 'NumericLiteral' || expr?.type === 'StringLiteral' || expr?.type === 'BooleanLiteral') return expr.value;
  if (expr?.type === 'UnaryExpression' && expr.operator === '-' && expr.argument.type === 'NumericLiteral') return -expr.argument.value;
  return null;
}

function judgeGroup(group, context) {
  const kinds = group.tokens.map(removalKind).filter(Boolean);
  if (!kinds.length) return 'skip';
  const kind = kinds.includes('focus') ? 'focus' : 'base';
  const opening = group.element;
  const tabIndex = literalValue(attribute(opening, 'tabIndex'));
  if (tabIndex === -1 || tabIndex === '-1') return 'skip';
  const tag = tagOf(group.name);
  if (tag === 'input' && literalValue(attribute(opening, 'type')) === 'hidden') return 'skip';
  const focusable = tag ? FOCUSABLE_TAGS.has(tag) || tabIndex !== undefined || attribute(opening, 'contentEditable') : true;
  if (!focusable && kind === 'base') return 'skip';

  if (group.tokens.some((t) => isFocusMarker(t, OWN_FOCUS_VARIANT))) return 'pass';
  if (group.ancestors.some((a) => a.tokens.some((t) => isFocusMarker(t, /focus-within|^has-\[.*focus/)))) return 'pass';
  const raws = new Set(group.tokens.map((t) => t.raw));
  const tokens = context.tokensByFile.get(group.file);
  if ([...raws].some((r) => /^(peer|group)(\/[\w-]+)?$/.test(r)) && tokens.some((t) => t.variants.some((v) => /^(peer|group)-(focus|has)/.test(v)) && (MARKER_UTILITY.test(t.utility) || /^text-/.test(t.utility)))) return 'pass';
  const matching = context.restorers.filter((r) => r.parts.length && r.parts.every((p) => (p.startsWith('.') && raws.has(p.slice(1))) || p === tag));
  if (matching.length) return 'pass';
  const universal = context.restorers.filter((r) => !r.parts.length);
  if (universal.some((r) => !r.outline || r.important)) return 'pass';
  if (universal.length) return 'order';
  if (tag) return 'fail';

  const target = group.name.includes('.') ? null : context.index.resolveName(group.file, group.name);
  if (!target) return 'unresolved';
  if (context.tokensByFile.get(target.file).some((t) => isFocusMarker(t, OWN_FOCUS_VARIANT))) return 'pass';
  return kind === 'focus' ? 'fail' : 'component';
}

const GROUP_REASONS = {
  order: 'a stylesheet adds a keyboard outline back for every control, but whether it beats this class depends on stylesheet order',
  unresolved: 'the outline is removed on a component defined elsewhere, which may draw its own focus style',
  component: 'the outline is removed on a component, and it is not clear that the component is a control',
};

export const focusVisible = {
  name: 'focus-visible',
  rules: [RULE],
  run(project) {
    const docs = projectDocuments(project);
    const sheets = [...docs.map((doc) => ({ file: doc.path, ...parseCss(stylesheetText(doc)) })), ...styledSheets(project.files)];
    const pool = cssPool(sheets);
    const tokensByFile = new Map(project.files.map((f) => [f.path, fileTokens(f)]));
    const tailwindFocus = [...tokensByFile.values()].some((tokens) => tokens.some((t) => isFocusMarker(t, OWN_FOCUS_VARIANT)));
    const { findings, notAssessed } = judgeCss(pool, tailwindFocus);
    const context = { restorers: pool.restorers, tokensByFile, index: indexProject(project.files) };
    for (const file of project.files) {
      for (const group of classGroups(file)) {
        const verdict = judgeGroup(group, context);
        const base = { file: group.file, rule: RULE };
        if (verdict === 'fail') findings.push({ ...base, line: group.line, column: group.column, message: MESSAGE });
        if (GROUP_REASONS[verdict]) notAssessed.push({ ...base, reason: GROUP_REASONS[verdict] });
      }
    }
    return { findings, notAssessed };
  },
};
