import { walk, jsxName } from '../ast.mjs';
import { attribute, blank, projectDocuments } from '../styles.mjs';

const RULE = 'faceup-autoplay-media-no-control';
const MESSAGES = {
  audio: 'This audio starts playing by itself when the page opens, and there are no controls to stop it or turn it down.',
  sound: 'This video starts playing with sound by itself when the page opens, and there are no controls to pause it or turn it down.',
  silent: 'This video starts moving by itself when the page opens, and there are no controls to pause it.',
};

function flag(attr) {
  if (!attr) return false;
  if (!attr.value) return true;
  if (attr.value.type === 'StringLiteral') return attr.value.value !== 'false';
  const expr = attr.value.expression;
  if (expr?.type === 'BooleanLiteral') return expr.value;
  if (expr?.type === 'StringLiteral') return expr.value !== 'false';
  return null;
}

function judge({ tag, autoplay, controls, muted, source, spread }) {
  if (autoplay === false || controls === true) return null;
  if (autoplay === null) return { reason: 'whether it starts by itself depends on a value set while the page runs' };
  if (controls === null || spread) return { reason: 'whether it has player controls depends on values passed in while the page runs' };
  if (!source) return { reason: 'its media is attached by script, for example a live camera preview, so its source and length are unknown' };
  if (tag === 'audio') return { message: MESSAGES.audio };
  return { message: muted === true ? MESSAGES.silent : MESSAGES.sound };
}

function jsxMedia(file) {
  const out = [];
  walk(file.ast, (node) => {
    if (node.type !== 'JSXElement') return;
    const opening = node.openingElement;
    const tag = jsxName(opening.name).split('.').pop();
    if (tag !== 'video' && tag !== 'audio') return;
    const children = node.children.some((c) => c.type === 'JSXElement' && jsxName(c.openingElement.name) === 'source');
    out.push({
      tag,
      line: opening.loc.start.line,
      column: opening.loc.start.column + 1,
      autoplay: flag(attribute(opening, 'autoPlay') ?? attribute(opening, 'autoplay')),
      controls: flag(attribute(opening, 'controls')),
      muted: flag(attribute(opening, 'muted')),
      source: Boolean(attribute(opening, 'src')) || children,
      spread: opening.attributes.some((a) => a.type === 'JSXSpreadAttribute'),
    });
  });
  return out;
}

function htmlMedia(src) {
  const html = src.replace(/<!--[\s\S]*?-->/g, blank);
  const out = [];
  for (const match of html.matchAll(/<(video|audio)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const attrs = match[2];
    const has = (name) => new RegExp(`(^|\\s)${name}(\\s|=|/|$)`, 'i').test(attrs);
    out.push({
      tag: match[1].toLowerCase(),
      line: html.slice(0, match.index).split('\n').length,
      column: match.index - html.lastIndexOf('\n', match.index - 1),
      autoplay: has('autoplay'),
      controls: has('controls'),
      muted: has('muted'),
      source: has('src') || /<source\b/i.test(match[3]),
      spread: false,
    });
  }
  return out;
}

export const autoplayMedia = {
  name: 'autoplay-media',
  rules: [RULE],
  run(project) {
    const findings = [];
    const notAssessed = [];
    const documents = projectDocuments(project).filter((doc) => doc.path.endsWith('.html'));
    const sources = [...project.files.map((f) => ({ file: f.path, media: jsxMedia(f) })), ...documents.map((d) => ({ file: d.path, media: htmlMedia(d.src) }))];
    for (const { file, media } of sources) {
      for (const item of media) {
        const verdict = judge(item);
        if (verdict?.message) findings.push({ file, rule: RULE, line: item.line, column: item.column, message: verdict.message });
        if (verdict?.reason) notAssessed.push({ file, rule: RULE, reason: verdict.reason });
      }
    }
    return { findings, notAssessed };
  },
};
