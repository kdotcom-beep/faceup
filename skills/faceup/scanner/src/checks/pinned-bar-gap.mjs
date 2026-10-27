import { parseCss, projectDocuments, stylesheetText } from '../styles.mjs';

const RULE = 'faceup-focus-obscured-sticky';
const PINNED = /^(fixed|sticky)$/;
const BAR_NAME = /(^|[^a-z])(header|nav|navbar|banner|masthead|topbar|appbar|toolbar|bar)([^a-z]|$)/i;
const ZERO = /^(0|0px|auto|none|initial|unset)$/;
const GAP = {
  top: /^scroll-(padding|margin)(-top|-block|-block-start)?$/,
  bottom: /^scroll-(padding|margin)(-bottom|-block|-block-end)?$/,
};

const value = (rule, prop) => rule.decls.findLast((d) => d.prop === prop)?.value.trim().toLowerCase();

function pinnedEdge(rule) {
  if (!PINNED.test(value(rule, 'position') ?? '')) return null;
  if (value(rule, 'inset') !== undefined || value(rule, 'pointer-events') === 'none' || /^100(%|vh|dvh|svh|lvh)$/.test(value(rule, 'height') ?? '')) return null;
  const top = value(rule, 'top');
  const bottom = value(rule, 'bottom');
  if ((top === undefined) === (bottom === undefined)) return null;
  const fullWidth = value(rule, 'width') === '100%' || value(rule, 'width') === '100vw' || (value(rule, 'left') === '0' && value(rule, 'right') === '0') || value(rule, 'inset-inline') === '0';
  const named = rule.selectors.some((s) => BAR_NAME.test(s) && !/side/i.test(s));
  if (!named && !fullWidth) return null;
  return top !== undefined ? 'top' : 'bottom';
}

const hasGap = (rules, edge) => rules.some((r) => r.decls.some((d) => GAP[edge].test(d.prop) && !d.value.trim().split(/\s+/).every((v) => ZERO.test(v))));

export const pinnedBarGap = {
  name: 'pinned-bar-gap',
  rules: [RULE],
  run(project) {
    const findings = [];
    const sheets = projectDocuments(project).map((doc) => ({ ...doc, parsed: parseCss(stylesheetText(doc)) }));
    const byRoot = new Map();
    for (const sheet of sheets) byRoot.set(sheet.root, [...(byRoot.get(sheet.root) ?? []), ...sheet.parsed.rules]);
    for (const sheet of sheets) {
      const all = byRoot.get(sheet.root);
      for (const rule of sheet.parsed.rules) {
        if (rule.media.some((m) => /print/i.test(m))) continue;
        const edge = pinnedEdge(rule);
        if (!edge || hasGap(all, edge)) continue;
        findings.push({ file: sheet.path, rule: RULE, line: rule.line, column: 1, message: `This bar stays pinned to the ${edge} of the screen, and no scroll-padding-${edge} leaves room for it, so a control the keyboard moves to can end up hidden behind it.` });
      }
    }
    return { findings, notAssessed: [] };
  },
};
