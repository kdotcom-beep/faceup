import { classGroups, packageRoot, parseCss, parseToken, projectDocuments, simpleParts, splitTopLevel, stylesheetText, subjectCompound } from '../styles.mjs';

const RULE = 'faceup-reduced-motion-ignored';
const SHEET_MESSAGE = 'Things on this page move or animate, and nothing in the styles turns this movement off for people who have asked their device for less motion.';
const CLASS_MESSAGE = 'This element moves or animates, and nothing turns the movement off for people who have asked their device for less motion.';
const MOVING_PROP = /^(transform|translate|scale|rotate|top|left|right|bottom|inset|margin|margin-[\w-]+|width|height|max-height|max-width)$/;
const MOVING_KEYFRAME = /(^|[\s;{])(transform|translate|scale|rotate|top|left|right|bottom|inset|margin[\w-]*|offset-distance|background-position)\s*:/;
const NO_MOTION = /^(none|initial|inherit|unset|0s?)$/;
const TIMING = /^(\d|\.|ease|linear|step|cubic-bezier|var\(|inherit|initial)/;

function tailwindMotion(tokens) {
  if (tokens.some((t) => t.variants.some((v) => v === 'motion-reduce' || v === 'motion-safe'))) return false;
  const utilities = tokens.map((t) => t.utility);
  const transforms = utilities.some((u) => /^(translate|scale|rotate|skew)-/.test(u));
  return utilities.some((u) => {
    if (/^animate-(in|out)$/.test(u)) return utilities.some((o) => /^(slide|zoom|spin)-(in|out)/.test(o));
    if (/^animate-/.test(u)) return !/^animate-(none|pulse|spin)$/.test(u);
    return /^transition(-all|-transform)?$/.test(u) && transforms;
  });
}

function movesInTransition(value, transforms) {
  return splitTopLevel(value.toLowerCase(), ',').some((item) => {
    const first = item.split(/\s+/)[0];
    if (TIMING.test(first) || first === 'all') return transforms;
    return MOVING_PROP.test(first);
  });
}

function onlyRotates(body) {
  const decls = [...body.matchAll(/([\w-]+)\s*:\s*([^;{}]+)/g)].map(([, prop, value]) => [prop.toLowerCase(), value.trim().toLowerCase()]);
  const moving = decls.filter(([prop]) => MOVING_KEYFRAME.test(`;${prop}:`));
  return moving.length > 0 && moving.every(([prop, value]) => prop === 'rotate' || (prop === 'transform' && /^(rotate[xyz]?\([^)]*\)\s*)+$/.test(value)));
}

function movesInAnimation(value, keyframes) {
  if (NO_MOTION.test(value.trim().toLowerCase())) return false;
  const names = splitTopLevel(value, ',').flatMap((item) => item.split(/\s+/)).filter((w) => keyframes.has(w));
  return !names.length || names.some((n) => MOVING_KEYFRAME.test(keyframes.get(n)) && !onlyRotates(keyframes.get(n)));
}

const withoutState = (selector) => selector.replace(/:(hover|focus-visible|focus-within|focus|active)(?![\w-])/g, '').trim();
const inMotionQuery = (rule) => rule.media.some((m) => /prefers-reduced-motion/i.test(m));

function calmedSelectors(parsed) {
  return parsed.rules
    .filter((r) => r.media.some((m) => /prefers-reduced-motion\s*:\s*reduce/i.test(m)) && r.decls.some((d) => /^(animation|transition|transform)/.test(d.prop)))
    .flatMap((r) => r.selectors.map(withoutState));
}

// A transition of transform whose element is only ever rotated, such as a chevron that flips, turns in place.
function onlyTurns(rule, value, parsed) {
  const items = splitTopLevel(value.toLowerCase(), ',').map((item) => item.trim().split(/\s+/)[0]);
  if (items.some((p) => MOVING_PROP.test(p) && !/^(transform|rotate)$/.test(p))) return false;
  const subjects = rule.selectors.map((s) => simpleParts(subjectCompound(s)));
  const shares = (selector) => simpleParts(subjectCompound(selector)).some((p) => subjects.some((parts) => parts.includes(p)));
  const moves = parsed.rules
    .filter((r) => r !== rule && r.selectors.some(shares))
    .flatMap((r) => r.decls.filter((d) => /^(transform|translate|scale|rotate)$/.test(d.prop) && !NO_MOTION.test(d.value.trim())));
  return moves.length > 0 && moves.every((d) => d.prop === 'rotate' || (d.prop === 'transform' && /^(rotate[xyz]?\([^)]*\)\s*)+$/.test(d.value.trim().toLowerCase())));
}

function firstMotion(parsed, keyframes, calmed) {
  const decls = parsed.rules.flatMap((r) => r.decls);
  const transforms = decls.some((d) => /^(transform|translate|scale|rotate)$/.test(d.prop) && !NO_MOTION.test(d.value.trim()));
  for (const rule of parsed.rules) {
    if (inMotionQuery(rule) || (rule.selectors.length && rule.selectors.every((s) => calmed.has(withoutState(s))))) continue;
    for (const decl of rule.decls) {
      if ((decl.prop === 'animation' || decl.prop === 'animation-name') && movesInAnimation(decl.value, keyframes)) return decl.line;
      if ((decl.prop === 'transition' || decl.prop === 'transition-property') && movesInTransition(decl.value, transforms) && !onlyTurns(rule, decl.value, parsed)) return decl.line;
    }
    const applied = rule.applies.find((a) => tailwindMotion(a.tokens.map(parseToken)));
    if (applied) return applied.line;
  }
  return null;
}

const isUniversalReset = (rule) => rule.media.some((m) => /prefers-reduced-motion\s*:\s*reduce/.test(m)) && rule.selectors.some((s) => s.includes('*')) && rule.decls.some((d) => /^(animation|transition)/.test(d.prop));

export const reducedMotion = {
  name: 'reduced-motion',
  rules: [RULE],
  run(project) {
    const findings = [];
    const sheets = projectDocuments(project).map((doc) => ({ ...doc, parsed: parseCss(stylesheetText(doc)) }));
    const keyframes = new Map();
    const coveredRoots = new Set();
    const calmed = new Map();
    for (const sheet of sheets) {
      sheet.parsed.keyframes.forEach((body, name) => keyframes.set(name, body));
      if (sheet.parsed.rules.some(isUniversalReset)) coveredRoots.add(sheet.root);
      if (!calmed.has(sheet.root)) calmed.set(sheet.root, new Set());
      calmedSelectors(sheet.parsed).forEach((s) => calmed.get(sheet.root).add(s));
    }
    for (const sheet of sheets) {
      if (coveredRoots.has(sheet.root)) continue;
      const line = firstMotion(sheet.parsed, keyframes, calmed.get(sheet.root));
      if (line) findings.push({ file: sheet.path, rule: RULE, line, column: 1, message: SHEET_MESSAGE });
    }
    for (const file of project.files) {
      if (coveredRoots.has(packageRoot(file.path))) continue;
      for (const group of classGroups(file)) {
        if (tailwindMotion(group.tokens)) findings.push({ file: file.path, rule: RULE, line: group.line, column: group.column, message: CLASS_MESSAGE });
      }
    }
    return { findings, notAssessed: [] };
  },
};
