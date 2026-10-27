import { PLACEHOLDER_TITLES } from './checks/page-structure.mjs';

const AXE_RULES = {
  'html-has-lang': 'faceup-lang-missing',
  'html-lang-valid': 'faceup-lang-missing',
  'document-title': 'faceup-page-title-generic',
  'target-size': 'faceup-target-too-small',
  'no-autoplay-audio': 'faceup-autoplay-media-no-control',
  'button-name': 'faceup-control-missing-name',
  'link-name': 'faceup-control-missing-name',
  'input-button-name': 'faceup-control-missing-name',
  'aria-command-name': 'faceup-control-missing-name',
  'heading-order': 'faceup-heading-order',
  'label-content-name-mismatch': 'faceup-label-not-in-name',
  'avoid-inline-spacing': 'faceup-text-spacing-clipped',
};

const AXE_MESSAGES = {
  'avoid-inline-spacing': 'This element locks its text spacing with !important, so spacing settings chosen by the person reading cannot change it.',
  'label-content-name-mismatch': 'This control shows words that its accessible name leaves out, so saying those words to voice control does not reach it.',
  'html-has-lang': 'The page does not say what language it is in, so a screen reader may read it in the wrong voice.',
  'html-lang-valid': 'The page names a language code that is not valid, so a screen reader cannot use it.',
  'document-title': 'The page has no title, so its browser tab and history entry are blank.',
  'target-size': 'This control is smaller than 24 by 24 pixels and sits too close to its neighbours to tap reliably.',
  'no-autoplay-audio': 'Audio plays by itself for more than three seconds with no way to pause or mute it.',
  'button-name': 'This button has no name a screen reader can read out.',
  'link-name': 'This link has no name a screen reader can read out.',
  'input-button-name': 'This button has no name a screen reader can read out.',
  'aria-command-name': 'This control has no name a screen reader can read out.',
  'heading-order': 'This heading skips a level, so the outline of the page no longer matches its structure.',
};

export const BROWSER_CHECKS = [
  { name: 'axe', rules: [...new Set(Object.values(AXE_RULES))] },
  { name: 'page-titles', rules: ['faceup-page-title-generic'] },
  { name: 'references', rules: ['faceup-aria-references-missing-id'] },
  { name: 'placeholder-labels', rules: ['faceup-placeholder-as-label'] },
  { name: 'autoplay-video', rules: ['faceup-autoplay-media-no-control'] },
  { name: 'field-edges', rules: ['faceup-nontext-contrast'] },
  { name: 'keyboard', rules: ['faceup-focus-not-visible', 'faceup-focus-obscured-sticky', 'faceup-keyboard-trap'] },
  { name: 'skip-links', rules: ['faceup-skip-link-missing'] },
  { name: 'text-spacing', rules: ['faceup-text-spacing-clipped'] },
  { name: 'reflow', rules: ['faceup-reflow-horizontal-scroll'] },
  { name: 'reduced-motion', rules: ['faceup-reduced-motion-ignored'] },
];

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

function installHelpers() {
  const parse = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (top, under) => ({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1,
  });
  const luminance = ({ r, g, b }) => {
    const lin = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const ratio = (x, y) => {
    const [l1, l2] = [luminance(x), luminance(y)].sort((a, b) => b - a);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const background = (el) => {
    const layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== 'none') return null;
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    return layers.reduceRight((under, top) => over(top, under), { r: 255, g: 255, b: 255, a: 1 });
  };
  const selector = (el) => {
    const root = el.getRootNode();
    const scope = root instanceof ShadowRoot ? root : document;
    const parts = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const id = n.id ? `#${CSS.escape(n.id)}` : '';
      if (id && scope.querySelectorAll(id).length === 1) {
        parts.unshift(id);
        break;
      }
      let part = n.tagName.toLowerCase() + id;
      const cls = [...n.classList].slice(0, 2).map((c) => `.${CSS.escape(c)}`).join('');
      if (cls) part += cls;
      const same = n.parentElement ? [...n.parentElement.children].filter((c) => c.tagName === n.tagName) : [];
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(n) + 1})`;
      parts.unshift(part);
      if (scope.querySelectorAll(parts.join(' > ')).length === 1) break;
    }
    return root instanceof ShadowRoot ? `${selector(root.host)} >>> ${parts.join(' > ')}` : parts.join(' > ');
  };
  const focused = () => {
    let el = document.activeElement;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
    return el;
  };
  const shown = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const lookOf = (el) => {
    const props = ['boxShadow', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'borderTopWidth', 'borderBottomWidth', 'backgroundColor', 'color', 'textDecorationLine', 'transform', 'opacity', 'visibility', 'clip', 'clipPath'];
    const pseudo = ['content', 'outlineStyle', 'boxShadow', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'opacity', 'transform'];
    const s = getComputedStyle(el);
    const before = getComputedStyle(el, '::before');
    const after = getComputedStyle(el, '::after');
    const r = el.getBoundingClientRect();
    const outline = s.outlineStyle === 'none' || parseFloat(s.outlineWidth) === 0 || parse(s.outlineColor)?.a === 0 ? 'none' : [s.outlineStyle, s.outlineWidth, s.outlineColor, s.outlineOffset].join(' ');
    return [outline, Math.round(r.width), Math.round(r.height), ...props.map((p) => s[p]), ...pseudo.map((p) => before[p]), ...pseudo.map((p) => after[p])].join('|');
  };
  const look = (el) => [el, el.parentElement, el.parentElement?.parentElement].filter((n) => n && n.nodeType === 1 && n !== document.body).map(lookOf).join('||');
  const edge = (el) => {
    const s = getComputedStyle(el);
    const behind = background(el.parentElement);
    const fill = background(el);
    if (!behind || !fill) return null;
    const sides = ['Top', 'Right', 'Bottom', 'Left'].filter((side) => s[`border${side}Style`] !== 'none' && parseFloat(s[`border${side}Width`]) > 0);
    const borders = sides.map((side) => {
      const c = parse(s[`border${side}Color`]);
      return c ? ratio(over(c, fill), behind) : 0;
    });
    const rings = s.boxShadow === 'none' ? [] : s.boxShadow.split(/,(?![^(]*\))/).map((shadow) => {
      const c = parse(shadow);
      const [x = 0, y = 0, blur = 0, spread = 0] = (shadow.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g) ?? []).map(parseFloat);
      if (!c || spread < 1 || blur > spread || x || y) return 0;
      return ratio(over(c, /inset/.test(shadow) ? fill : behind), behind);
    });
    const outlineColor = parse(s.outlineColor);
    const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 && outlineColor ? ratio(over(outlineColor, behind), behind) : 0;
    return Math.max(ratio(fill, behind), outline, ...borders, ...rings);
  };
  const pictureBehind = (el) => {
    const r = el.getBoundingClientRect();
    const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return stack.slice(stack.indexOf(el) + 1).some((n) => !n.contains(el) && (['IMG', 'PICTURE', 'VIDEO', 'CANVAS'].includes(n.tagName) || getComputedStyle(n).backgroundImage !== 'none'));
  };
  // Whether something pinned to the screen fully covers a control. A layer counts as covering when it
  // is opaque, or when it blurs what is behind it, which makes the control unreadable.
  const coverOf = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 2 || r.height <= 2) return { covered: false, frameCovered: false };
    const points = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + 2], [r.right - 2, r.top + 2], [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2]];
    const layer = (hit) => {
      let solid = ['IMG', 'VIDEO', 'CANVAS'].includes(hit.tagName);
      for (let p = hit; p && p.nodeType === 1; p = p.parentElement) {
        const st = getComputedStyle(p);
        if (Number(st.opacity) >= 0.9 && ((parse(st.backgroundColor)?.a ?? 0) >= 0.9 || (st.backdropFilter && st.backdropFilter !== 'none'))) solid = true;
        if (st.position === 'fixed' || st.position === 'sticky') return hit.tagName === 'IFRAME' ? 'frame' : solid ? 'solid' : 'see-through';
      }
      return null;
    };
    const hits = points.map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit && !el.contains(hit) && !hit.contains(el) ? layer(hit) : null;
    });
    const covered = hits.every((h) => h === 'solid');
    return { covered, frameCovered: !covered && hits.every((h) => h === 'solid' || h === 'frame') };
  };
  window.__faceup = { parse, ratio, background, selector, shown, look, edge, coverOf, pictureBehind, focused, ids: new WeakMap(), next: 1, rest: new Map(), current: null };
}

async function findingsFromAxe(page, url, out) {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const sealed = await page.evaluate(() => [...document.querySelectorAll('iframe[sandbox]')]
    .filter((f) => !/(^|\s)allow-scripts(\s|$)/.test(f.getAttribute('sandbox')))
    .map((f) => window.__faceup.selector(f)));
  let builder = new AxeBuilder({ page }).withTags(AXE_TAGS).exclude('[data-faceup-ignore]');
  for (const selector of sealed) {
    builder = builder.exclude(selector);
    out.notAssessed.push({ rule: null, page: url, selector, reason: 'This embedded frame is sandboxed without scripts, so axe cannot run inside it. Check its contents by hand.' });
  }
  const result = await builder.analyze();
  out.axeVersion = result.testEngine?.version ?? out.axeVersion;
  for (const v of result.violations) {
    const rule = AXE_RULES[v.id];
    if (!rule) {
      const wcag = v.tags.map((t) => t.match(/^wcag(\d)(\d)(\d+)$/)).filter(Boolean).map((m) => `${m[1]}.${m[2]}.${m[3]}`);
      out.axeOther.push({ page: url, axeRule: v.id, help: v.help, wcag, impact: v.impact, nodes: v.nodes.length, selectors: v.nodes.slice(0, 5).map((n) => n.target.join(' ')), helpUrl: v.helpUrl });
      continue;
    }
    for (const node of v.nodes) out.findings.push({ rule, page: url, selector: node.target.join(' '), message: AXE_MESSAGES[v.id], source: `axe ${v.id}` });
  }
  for (const v of result.incomplete) {
    const rule = AXE_RULES[v.id];
    if (!rule) {
      const wcag = v.tags.map((t) => t.match(/^wcag(\d)(\d)(\d+)$/)).filter(Boolean).map((m) => `${m[1]}.${m[2]}.${m[3]}`);
      out.axeIncomplete.push({ page: url, axeRule: v.id, help: v.help, wcag, nodes: v.nodes.length, selectors: v.nodes.slice(0, 20).map((n) => n.target.join(' ')), helpUrl: v.helpUrl });
      continue;
    }
    for (const node of v.nodes) out.notAssessed.push({ rule, page: url, selector: node.target.join(' '), reason: `axe could not decide ${v.id} here and asks a person to check it.` });
  }
}

async function findingsFromDom(page, url, out) {
  const found = await page.evaluate((placeholderTitles) => {
    const { selector, shown, edge, pictureBehind, parse } = window.__faceup;
    const ignored = (el) => Boolean(el.closest('[data-faceup-ignore]'));
    const results = [];
    const title = document.title.trim();
    if (title && placeholderTitles.includes(title.toLowerCase())) {
      results.push({ rule: 'faceup-page-title-generic', selector: 'title', message: `The page still uses the template title "${title}", so its browser tab does not say what the page is.` });
    }

    const REFS = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-errormessage', 'aria-activedescendant', 'aria-details', 'aria-flowto'];
    for (const el of document.querySelectorAll(REFS.map((a) => `[${a}]`).join(','))) {
      if (ignored(el) || el.closest('[aria-hidden="true"]') || !el.getClientRects().length) continue;
      for (const attr of REFS) {
        const value = el.getAttribute(attr);
        if (!value) continue;
        const closed = el.getAttribute('aria-expanded') === 'false' || (el.getAttribute('role') === 'tab' && el.getAttribute('aria-selected') !== 'true');
        if ((attr === 'aria-controls' || attr === 'aria-owns') && closed) continue;
        const missing = value.trim().split(/\s+/).filter((id) => !document.getElementById(id));
        if (missing.length) results.push({ rule: 'faceup-aria-references-missing-id', selector: selector(el), message: `${attr} points at ${missing.map((id) => `"${id}"`).join(', ')}, which ${missing.length === 1 ? 'is' : 'are'} not on the page.` });
      }
    }

    const TEXT_FIELD = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]):not([type=range]):not([type=color]):not([type=file]), textarea';
    const textOf = (ids) => ids.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
    for (const el of document.querySelectorAll(TEXT_FIELD)) {
      if (ignored(el) || !shown(el) || !el.getAttribute('placeholder')?.trim()) continue;
      const named = [...(el.labels ?? [])].some((l) => l.textContent.trim()) || el.getAttribute('aria-label')?.trim() || (el.getAttribute('aria-labelledby') && textOf(el.getAttribute('aria-labelledby'))) || el.getAttribute('title')?.trim();
      if (!named) results.push({ rule: 'faceup-placeholder-as-label', selector: selector(el), message: `The only name this field has is its placeholder, "${el.getAttribute('placeholder').trim()}", which disappears as soon as someone types.` });
    }

    const PAUSE = /pause|stop|play/i;
    const pauseButton = (v) => {
      const vr = v.getBoundingClientRect();
      let box = v.parentElement;
      for (let i = 0; box && box !== document.body && i < 4; box = box.parentElement, i++) {
        const near = [...box.querySelectorAll('button, [role="button"], a[href]')].some((b) => {
          const br = b.getBoundingClientRect();
          const name = [b.getAttribute('aria-label'), b.getAttribute('title'), b.textContent].join(' ');
          return shown(b) && PAUSE.test(name) && br.right > vr.left - 48 && br.left < vr.right + 48 && br.bottom > vr.top - 48 && br.top < vr.bottom + 48;
        });
        if (near) return true;
      }
      return false;
    };
    for (const v of document.querySelectorAll('video')) {
      if (ignored(v)) continue;
      const short = Number.isFinite(v.duration) && !v.loop && v.duration <= (v.muted ? 5 : 3);
      if (!v.paused && !v.controls && !short && (shown(v) || !v.muted) && !pauseButton(v)) results.push({ rule: 'faceup-autoplay-media-no-control', selector: selector(v), message: `This video plays by itself${v.muted ? ' (muted)' : ''} and has no player controls to pause it.` });
    }

    const borderOf = (el) => {
      const cs = getComputedStyle(el);
      return [cs.borderTopStyle, cs.borderTopWidth, cs.borderTopColor, cs.backgroundColor].join(' ');
    };
    const failedBorders = new Set();
    for (const el of document.querySelectorAll(TEXT_FIELD)) {
      if (ignored(el) || !shown(el) || el.closest('[aria-hidden="true"], [inert]')) continue;
      const r = el.getBoundingClientRect();
      if (r.right <= 0 || r.left >= innerWidth) continue;
      if (r.width < 12 || r.height < 12 || parse(getComputedStyle(el).color)?.a === 0) continue;
      const own = edge(el);
      if (own === null || own >= 3) continue;
      const covers = (c) => {
        const cr = c.getBoundingClientRect();
        return cr.left <= r.left + 2 && cr.right >= r.right - 2 && cr.top <= r.top + 2 && cr.bottom >= r.bottom - 2;
      };
      let best = own;
      let unknown = false;
      let hug = el.parentElement;
      for (let w = el.parentElement, i = 0; w && w !== document.body && i < 4; w = w.parentElement, i++) {
        const wr = w.getBoundingClientRect();
        if (r.top - wr.top > 16 || wr.bottom - r.bottom > 16) break;
        hug = w;
        const outlines = [...w.children].filter((c) => !c.contains(el) && getComputedStyle(c).position === 'absolute' && covers(c));
        for (const layer of [w, ...outlines]) {
          const e = edge(layer);
          if (e === null) unknown = true;
          else best = Math.max(best, e);
        }
        if (best >= 3) break;
      }
      if (best >= 3) continue;
      if (unknown || pictureBehind(el)) {
        results.push({ notAssessed: true, rule: 'faceup-nontext-contrast', selector: selector(el), reason: 'A picture or gradient sits behind this field, so its edge contrast could not be measured.' });
        continue;
      }
      const icon = [...(hug?.querySelectorAll('svg, img') ?? [])].some((i) => shown(i) && !i.contains(el));
      const measured = best >= 1.05 ? `This field's edge has a contrast of ${best.toFixed(2)}:1 against the background, below the 3:1 needed to see where the field is.` : 'The check found no border, outline or fill that marks the edge of this field against the background around it.';
      results.push({ rule: 'faceup-nontext-contrast', selector: selector(el), message: icon ? `${measured} An icon inside the field may be enough to show where it is, so check it by eye.` : measured });
      failedBorders.add(borderOf(el));
    }
    for (const el of document.querySelectorAll('select')) {
      if (ignored(el) || !shown(el) || el.closest('[aria-hidden="true"], [inert]') || !failedBorders.has(borderOf(el))) continue;
      results.push({ notAssessed: true, rule: 'faceup-nontext-contrast', selector: selector(el), reason: 'This select menu has the same border as a field that failed this check. Select menus are not measured, because the browser often draws part of their edge, so check it by eye.' });
    }
    return results;
  }, [...PLACEHOLDER_TITLES]);
  for (const { notAssessed, ...f } of found) {
    if (notAssessed) out.notAssessed.push({ ...f, page: url });
    else out.findings.push({ ...f, page: url, source: 'faceup' });
  }
  return page.evaluate(() => document.title.trim());
}

function repeatedLoop(sequence, total) {
  const n = sequence.length;
  for (let size = 1; size <= Math.min(60, Math.floor(n / 2)); size++) {
    const last = sequence.slice(n - size);
    const before = sequence.slice(n - 2 * size, n - size);
    if (last.some((k, i) => k !== before[i])) continue;
    if (last.includes('body') || last.includes('frame')) return null;
    return new Set(last).size < total ? last : null;
  }
  return null;
}

async function pixelsChangeOnFocus(page, rect) {
  const viewport = page.viewportSize();
  const x = Math.max(0, Math.floor(rect.left - 24));
  const y = Math.max(0, Math.floor(rect.top - 24));
  const clip = { x, y, width: Math.min(viewport.width, Math.ceil(rect.right + 24)) - x, height: Math.min(viewport.height, Math.ceil(rect.bottom + 24)) - y };
  if (clip.width < 4 || clip.height < 4) return 'unknown';
  const withFocus = await page.screenshot({ clip });
  await page.evaluate(() => window.__faceup.current?.blur());
  const resting = await page.screenshot({ clip });
  await page.waitForTimeout(150);
  const restingAgain = await page.screenshot({ clip });
  await page.evaluate(() => window.__faceup.current?.focus({ preventScroll: true }));
  if (!resting.equals(restingAgain)) return 'unknown';
  return withFocus.equals(resting) ? 'no' : 'yes';
}

// Moves through the page with Tab or Shift+Tab and reports controls fully covered by a pinned layer.
// Moving backwards matters because browsers scroll a control into view near the bottom of the
// window when tabbing forwards, so a header at the top rarely covers it until you go back.
async function coverPass(page, url, out, deadline, { reverse, width }) {
  const total = await page.evaluate(() => document.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]').length);
  if (!total) return 'done';
  if (reverse) await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  const seen = new Set();
  const how = `${reverse ? 'moving backwards with Shift+Tab' : 'tabbing forwards'}${width ? ` in a window ${width} pixels wide` : ''}`;
  for (let i = 0; i < total * 2 + 10; i++) {
    if (Date.now() > deadline) return 'out of time';
    await page.keyboard.press(reverse ? 'Shift+Tab' : 'Tab');
    const step = await page.evaluate(() => {
      const faceup = window.__faceup;
      const el = faceup.focused();
      if (!el || el === document.body || el === document.documentElement) return { key: 'body' };
      if (el.tagName === 'IFRAME') return { key: 'frame' };
      if (!faceup.ids.has(el)) faceup.ids.set(el, faceup.next++);
      return { key: faceup.ids.get(el), selector: faceup.selector(el), ignored: Boolean(el.closest('[data-faceup-ignore]')), ...faceup.coverOf(el) };
    });
    if (step.key === 'body') {
      if (seen.size) return 'done';
      continue;
    }
    if (step.key === 'frame') continue;
    if (seen.has(step.key)) return 'done';
    seen.add(step.key);
    if (step.ignored) continue;
    const known = out.findings.some((f) => f.rule === 'faceup-focus-obscured-sticky' && f.page === url && f.selector === step.selector);
    if (step.covered && !known) out.findings.push({ rule: 'faceup-focus-obscured-sticky', page: url, selector: step.selector, message: `When the keyboard reaches this control ${how}, something pinned to the screen covers it completely.`, source: 'faceup' });
    if (step.frameCovered) out.notAssessed.push({ rule: 'faceup-focus-obscured-sticky', page: url, selector: step.selector, reason: 'An embedded frame pinned to the screen sits over this control, and the check cannot see whether the frame is see-through.' });
  }
  return 'done';
}

// Skip links whose target is missing, or hidden at the current window size, so following them goes nowhere.
async function findingsFromSkipLinks(page, url, out, width) {
  const broken = await page.evaluate(() => {
    const { selector } = window.__faceup;
    const results = [];
    for (const link of document.querySelectorAll('a[href^="#"]')) {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      if (!id || link.closest('[data-faceup-ignore]') || !/\bskip\b|jump to (the )?(main )?content/i.test(link.textContent)) continue;
      if (!link.getClientRects().length) continue;
      const target = document.getElementById(id) ?? document.getElementsByName(id)[0];
      if (!target) results.push({ selector: selector(link), problem: 'missing', id });
      else if (!target.getClientRects().length || getComputedStyle(target).visibility === 'hidden') results.push({ selector: selector(link), problem: 'hidden', id });
    }
    return results;
  });
  for (const b of broken) {
    if (out.findings.some((f) => f.rule === 'faceup-skip-link-missing' && f.page === url && f.selector === b.selector)) continue;
    const where = width ? `in a window ${width} pixels wide` : 'on this page';
    out.findings.push({ rule: 'faceup-skip-link-missing', page: url, selector: b.selector, message: b.problem === 'missing' ? `This skip link points to #${b.id}, which is not on the page, so following it goes nowhere.` : `This skip link points to #${b.id}, which is hidden ${where}, so following it goes nowhere.`, source: 'faceup' });
  }
}

const PHONE_WIDTH = 375;

async function findingsFromPhoneKeyboard(browser, url, out, deadline) {
  const context = await browser.newContext({ viewport: { width: PHONE_WIDTH, height: 700 } });
  try {
    const page = await context.newPage();
    if (!(await openState(page, browser.target, out, `The keyboard check at ${PHONE_WIDTH} pixels wide`))) return 'done';
    await page.waitForTimeout(300);
    await page.evaluate(installHelpers);
    await findingsFromSkipLinks(page, url, out, PHONE_WIDTH);
    if ((await coverPass(page, url, out, deadline, { reverse: false, width: PHONE_WIDTH })) === 'out of time') return 'out of time';
    return await coverPass(page, url, out, deadline, { reverse: true, width: PHONE_WIDTH });
  } finally {
    await context.close();
  }
}

async function findingsFromKeyboard(page, url, out, deadline) {
  const total = await page.evaluate(() => {
    const { shown, look, rest } = window.__faceup;
    const focusable = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable=""], [contenteditable="true"]')]
      .filter((el) => el.tabIndex >= 0 && !el.disabled && shown(el));
    for (const el of focusable) rest.set(el, look(el));
    return focusable.length;
  });
  if (total === 0) return;
  const reported = new Set();
  const report = (rule, step, message) => {
    if (step.ignored) return;
    const key = `${rule} ${step.selector}`;
    if (reported.has(key)) return;
    reported.add(key);
    out.findings.push({ rule, page: url, selector: step.selector, message, source: 'faceup' });
  };
  const readFocus = () => page.evaluate(() => {
    const faceup = window.__faceup;
    const el = faceup.focused();
    if (!el || el === document.body || el === document.documentElement) return 'body';
    if (el.tagName === 'IFRAME') return 'frame';
    if (!faceup.ids.has(el)) faceup.ids.set(el, faceup.next++);
    return faceup.ids.get(el);
  });
  const sequence = [];
  const presses = total * 2 + 10;
  let outOfTime = false;
  for (let i = 0; i < presses; i++) {
    if (Date.now() > deadline) {
      outOfTime = true;
      break;
    }
    await page.keyboard.press('Tab');
    const step = await page.evaluate(async () => {
      const faceup = window.__faceup;
      const el = faceup.focused();
      if (!el || el === document.body || el === document.documentElement) return { key: 'body' };
      if (el.tagName === 'IFRAME') return { key: 'frame' };
      if (!faceup.ids.has(el)) faceup.ids.set(el, faceup.next++);
      faceup.current = el;
      const settling = document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Infinity);
      await Promise.race([Promise.all(settling.map((a) => a.finished.catch(() => null))), new Promise((done) => setTimeout(done, 500))]);
      const step = { key: faceup.ids.get(el), selector: faceup.selector(el), ignored: Boolean(el.closest('[data-faceup-ignore]')) };
      const before = faceup.rest.get(el);
      step.unchanged = before !== undefined && before === faceup.look(el);

      const r = el.getBoundingClientRect();
      step.rect = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      step.typing = el.matches('input:not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=image]), textarea, [contenteditable=""], [contenteditable="true"]');
      Object.assign(step, faceup.coverOf(el));
      return step;
    });
    sequence.push(step.key);
    if (step.key === 'body' || step.key === 'frame') {
      if (step.key === 'body' && sequence.filter((k) => k !== 'body' && k !== 'frame').length) break;
      continue;
    }
    if (!step.ignored && step.unchanged && !reported.has(`faceup-focus-not-visible ${step.selector}`)) {
      const changes = await pixelsChangeOnFocus(page, step.rect);
      if (changes === 'no' && step.typing) out.notAssessed.push({ rule: 'faceup-focus-not-visible', page: url, selector: step.selector, reason: 'Only the blinking text cursor may show that this field has focus. Check by eye whether that is enough to see.' });
      else if (changes === 'no') report('faceup-focus-not-visible', step, 'Nothing about this control changes when the keyboard reaches it, so a keyboard user cannot see where they are.');
      if (changes === 'unknown') out.notAssessed.push({ rule: 'faceup-focus-not-visible', page: url, selector: step.selector, reason: 'Something near this control was moving, so the check could not compare it with and without focus.' });
    }
    if (step.covered) report('faceup-focus-obscured-sticky', step, 'When the keyboard reaches this control, something pinned to the screen covers it completely.');
    if (step.frameCovered && !step.ignored) out.notAssessed.push({ rule: 'faceup-focus-obscured-sticky', page: url, selector: step.selector, reason: 'An embedded frame pinned to the screen sits over this control, and the check cannot see whether the frame is see-through.' });
    const loop = repeatedLoop(sequence, total);
    if (!loop) continue;
    const inDialog = await page.evaluate(() => Boolean(window.__faceup.focused()?.closest('dialog, [role="dialog"], [role="alertdialog"], [aria-modal="true"]')));
    if (!inDialog) {
      await page.keyboard.press('Escape');
      let escaped = false;
      for (let j = 0; j < loop.length + 2 && !escaped; j++) {
        await page.keyboard.press('Tab');
        escaped = !loop.includes(await readFocus());
      }
      if (!escaped) report('faceup-keyboard-trap', step, `Pressing Tab keeps cycling through the same ${new Set(loop).size} control${new Set(loop).size === 1 ? '' : 's'} here, and Escape does not get out.`);
    }
    break;
  }
  if (outOfTime) {
    const reached = new Set(sequence.filter((k) => k !== 'body' && k !== 'frame')).size;
    for (const rule of ['faceup-focus-not-visible', 'faceup-focus-obscured-sticky', 'faceup-keyboard-trap']) out.notAssessed.push({ rule, page: url, reason: `The time for keyboard checks ran out after reaching ${reached} of the page's ${total} controls with Tab. The rest were not checked.` });
  }
}

async function findingsFromReflow(browser, url, out) {
  const context = await browser.newContext({ viewport: { width: 320, height: 640 } });
  try {
    const page = await context.newPage();
    if (!(await openState(page, browser.target, out, 'Reflow at 320 pixels wide'))) return;
    await page.waitForTimeout(300);
    await page.evaluate(installHelpers);
    const culprits = await page.evaluate(() => {
      const { selector, shown } = window.__faceup;
      const width = document.documentElement.clientWidth;
      const scrolls = document.documentElement.scrollWidth > width + 4;
      const EXEMPT = new Set(['IMG', 'PICTURE', 'SVG', 'CANVAS', 'VIDEO', 'IFRAME', 'TABLE', 'PRE', 'CODE', 'MAP']);
      const CAROUSEL = /carousel|swiper|slick|splide|embla|glide|slider|marquee|ticker/i;
      const moving = (p) => p.getAnimations().some((a) => a.playState === 'running');
      const track = (p) => {
        const t = getComputedStyle(p).transform;
        return (t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)') || CAROUSEL.test(`${p.className} ${p.getAttribute('aria-roledescription') ?? ''}`);
      };
      const fate = (el) => {
        if (el.closest('[aria-hidden="true"], [inert], [data-faceup-ignore]')) return { kind: 'contained' };
        const between = [el];
        for (let p = el.parentElement; p; p = p.parentElement) {
          const page = p === document.body || p === document.documentElement;
          if (between.some(moving)) return { kind: 'contained' };
          const overflow = getComputedStyle(p).overflowX;
          if (!page && (EXEMPT.has(p.tagName.toUpperCase()) || ['auto', 'scroll'].includes(overflow))) return { kind: 'contained' };
          if (['hidden', 'clip'].includes(overflow)) return between.some(track) || track(p) ? { kind: 'contained' } : { kind: 'clipped', edge: page ? width : p.getBoundingClientRect().right };
          between.push(p);
        }
        return { kind: 'free' };
      };
      const textRight = (el) => Math.max(-Infinity, ...[...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).flatMap((n) => {
        const range = document.createRange();
        range.selectNodeContents(n);
        return [...range.getClientRects()].map((r) => r.right);
      }));
      const ownText = (el) => textRight(el) > -Infinity;
      const wide = [...document.body.querySelectorAll('*')]
        .filter((el) => shown(el) && el.getBoundingClientRect().right > width + 1 && !EXEMPT.has(el.tagName.toUpperCase()))
        .map((el) => ({ el, ...fate(el) }));
      const pick = (list) => list.filter((w) => !list.some((o) => o.el === w.el.parentElement)).slice(0, 3);
      const free = scrolls ? pick(wide.filter((w) => w.kind === 'free')) : [];
      const clipped = pick(wide.filter((w) => {
        const r = w.el.getBoundingClientRect();
        return w.kind === 'clipped' && ownText(w.el) && r.left < w.edge && textRight(w.el) > w.edge + 4;
      }));
      return [...free, ...clipped].map((w) => ({ selector: selector(w.el), right: Math.round(w.el.getBoundingClientRect().right), clipped: w.kind === 'clipped' }));
    });
    for (const c of culprits) {
      const message = c.clipped
        ? 'At 320 pixels wide, this runs past the edge of the space it sits in and the overflow is hidden, so part of it is cut off and cannot be read.'
        : `At 320 pixels wide, this reaches ${c.right} pixels, so the page scrolls sideways as well as up and down.`;
      out.findings.push({ rule: 'faceup-reflow-horizontal-scroll', page: url, selector: c.selector, message, source: 'faceup' });
    }
    const narrow = await page.evaluate(() => {
      const { selector, shown } = window.__faceup;
      const openers = [...document.querySelectorAll('[aria-expanded], [aria-controls], [popovertarget], summary, button, [role="button"]')]
        .filter((el) => el.matches('[aria-expanded], [aria-controls], [popovertarget], summary') || /menu|nav/i.test(`${el.textContent} ${el.getAttribute('aria-label') ?? ''}`));
      if (openers.some(shown)) return [];
      return [...document.querySelectorAll('nav, [role="navigation"]')]
        .filter((n) => !n.closest('[aria-hidden="true"], [inert], [data-faceup-ignore]'))
        .map((n) => ({ selector: selector(n), hidden: [...n.querySelectorAll('a[href]')].flatMap((a, i) => (shown(a) ? [] : [i])) }))
        .filter((n) => n.hidden.length);
    });
    if (!narrow.length) return;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    const lost = await page.evaluate((navs) => navs.map((n) => {
      const links = [...(document.querySelector(n.selector)?.querySelectorAll('a[href]') ?? [])];
      return { selector: n.selector, count: n.hidden.filter((i) => links[i] && window.__faceup.shown(links[i])).length };
    }).filter((n) => n.count), narrow);
    for (const n of lost) {
      out.notAssessed.push({ rule: 'faceup-reflow-horizontal-scroll', page: url, selector: n.selector, reason: `At 1280 pixels wide this navigation shows ${n.count} link${n.count === 1 ? '' : 's'} that ${n.count === 1 ? 'is' : 'are'} hidden at 320 pixels wide, and the page has no menu button there. If people cannot reach the same places another way at 320 pixels, a feature is lost, which fails WCAG 1.4.10. Check it manually at 400% zoom.` });
    }
  } finally {
    await context.close();
  }
}

const TEXT_SPACING = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';

// Applies the WCAG 1.4.12 spacing and reports text boxes that cut off text only once it is applied.
async function findingsFromTextSpacing(browser, url, out) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, bypassCSP: true });
  try {
    const page = await context.newPage();
    if (!(await openState(page, browser.target, out, 'Text spacing'))) return;
    await page.waitForTimeout(300);
    await page.evaluate(installHelpers);
    const clipped = () => page.evaluate(() => {
      const { selector, shown } = window.__faceup;
      const found = new Map();
      for (const el of document.querySelectorAll('body *')) {
        if (el.closest('[data-faceup-ignore], [aria-hidden="true"]') || !shown(el)) continue;
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        const cs = getComputedStyle(el);
        const hidesY = ['hidden', 'clip'].includes(cs.overflowY) && el.scrollHeight > el.clientHeight + 2;
        const hidesX = ['hidden', 'clip'].includes(cs.overflowX) && el.scrollWidth > el.clientWidth + 2;
        if (hidesY || hidesX) found.set(selector(el), el.textContent.trim().slice(0, 60));
      }
      return [...found];
    });
    const before = new Set((await clipped()).map(([s]) => s));
    await page.addStyleTag({ content: TEXT_SPACING });
    await page.waitForTimeout(200);
    for (const [selector, text] of await clipped()) {
      if (before.has(selector)) continue;
      out.findings.push({ rule: 'faceup-text-spacing-clipped', page: url, selector, message: `With the WCAG text spacing applied, the text in this box no longer fits and is cut off: "${text}".`, source: 'faceup' });
    }
  } finally {
    await context.close();
  }
}

// When the page has dark styles, measures text contrast again with dark mode on.
async function findingsFromDarkMode(browser, url, out) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
  try {
    const page = await context.newPage();
    if (!(await openState(page, browser.target, out, 'Contrast in dark mode'))) return;
    await page.waitForTimeout(300);
    const dark = await page.evaluate(() => {
      if (getComputedStyle(document.documentElement).colorScheme.includes('dark')) return true;
      const inSheet = (rules) => [...rules].some((r) => (r.media && /prefers-color-scheme:\s*dark/i.test(r.media.mediaText)) || (r.cssRules && inSheet(r.cssRules)));
      return [...document.styleSheets].some((sheet) => {
        try {
          return (sheet.media && /prefers-color-scheme:\s*dark/i.test(sheet.media.mediaText)) || inSheet(sheet.cssRules);
        } catch {
          return false;
        }
      });
    });
    if (!dark) return;
    const { default: AxeBuilder } = await import('@axe-core/playwright');
    const result = await new AxeBuilder({ page }).withRules(['color-contrast']).exclude('[data-faceup-ignore]').analyze();
    const entry = (v) => ({ page: url, axeRule: v.id, colorScheme: 'dark', help: `${v.help} (in dark mode)`, wcag: ['1.4.3'], nodes: v.nodes.length, selectors: v.nodes.slice(0, 20).map((n) => n.target.join(' ')), helpUrl: v.helpUrl });
    for (const v of result.violations) out.axeOther.push({ ...entry(v), impact: v.impact });
    for (const v of result.incomplete) out.axeIncomplete.push(entry(v));
  } finally {
    await context.close();
  }
}

async function findingsFromMotion(browser, url, out) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  try {
    await context.addInitScript(() => {
      const seen = new Map();
      window.__faceupMotion = seen;
      const record = (event) => {
        if (!(event.target instanceof Element)) return;
        const r = event.target.getBoundingClientRect();
        const onScreen = r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
        event.target.getAnimations().forEach((a) => seen.set(a, seen.get(a) || onScreen));
      };
      document.addEventListener('animationstart', record, true);
      document.addEventListener('transitionrun', record, true);
    });
    const page = await context.newPage();
    if (!(await openState(page, browser.target, out, 'Motion with the reduce-motion setting on'))) return;
    await page.waitForTimeout(800);
    await page.evaluate(installHelpers);
    const moving = await page.evaluate(() => {
      const MOVES = new Set(['transform', 'translate', 'scale', 'rotate', 'left', 'top', 'right', 'bottom', 'inset', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'offsetDistance', 'width', 'height']);
      const seen = new Set();
      const out = [];
      const recorded = window.__faceupMotion ?? new Map();
      const onScreen = (el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
      };
      const travel = (frames, props, size) => {
        const parts = {};
        const add = (key, value) => (parts[key] ??= []).push(value);
        for (const frame of frames) {
          for (const prop of props) {
            const value = String(frame[prop] ?? '');
            if (!value) continue;
            const px = (v) => (v.trim().endsWith('%') ? (parseFloat(v) * size) / 100 : parseFloat(v));
            for (const [, args] of value.matchAll(/translate[XYZ3d]*\(([^)]*)\)/g)) args.split(',').forEach((v, i) => add(`t${i}`, px(v)));
            for (const [, args] of value.matchAll(/scale[XYZ3d]*\(([^)]*)\)/g)) add('s', parseFloat(args) * size);
            const matrix = value.match(/matrix\(([^)]*)\)/);
            if (matrix) {
              const m = matrix[1].split(',').map(Number);
              add('s', m[0] * size);
              add('t0', m[4]);
              add('t1', m[5]);
            }
            if (value === 'none') ['t0', 't1'].forEach((k) => add(k, 0));
            if (/^-?[\d.]+(px|%)$/.test(value)) add(prop, px(value));
          }
        }
        const spans = Object.entries(parts).map(([key, values]) => {
          if (values.length < 2) values.push(key === 's' ? size : key.startsWith('t') ? 0 : NaN);
          return Math.max(...values) - Math.min(...values);
        });
        if (!spans.length || spans.some(Number.isNaN)) return Infinity;
        return Math.max(...spans);
      };
      for (const a of new Set([...recorded.keys(), ...document.getAnimations()])) {
        if (!a.effect?.target || !(a.timeline instanceof DocumentTimeline)) continue;
        if (a.playState !== 'running' && a.playState !== 'finished') continue;
        const target = a.effect.target;
        if (!(recorded.get(a) || (a.playState === 'running' && onScreen(target)))) continue;
        const box = a.effect.pseudoElement ? getComputedStyle(target, a.effect.pseudoElement) : null;
        const r = target.getBoundingClientRect();
        const size = box ? Math.max(parseFloat(box.width) || 0, parseFloat(box.height) || 0) : Math.max(r.width, r.height);
        if (target.closest('[data-faceup-ignore]') || !window.__faceup.shown(target) || Number(getComputedStyle(target).opacity) === 0 || size < 32) continue;
        const frames = a.effect.getKeyframes();
        const props = new Set(frames.flatMap((f) => Object.keys(f)).filter((k) => MOVES.has(k)));
        if (!props.size || Number(a.effect.getComputedTiming().duration) < 100 || travel(frames, props, size) < 8) continue;
        const spinOnly = [...props].every((p) => p === 'rotate' || (p === 'transform' && frames.every((f) => !f.transform || /^(none|rotate[^)]*\)|\s)+$/.test(f.transform))));
        if (spinOnly) continue;
        if (seen.has(target)) continue;
        seen.add(target);
        out.push({ selector: window.__faceup.selector(target), props: [...props].join(', ') });
      }
      return out.slice(0, 10);
    });
    for (const m of moving) out.findings.push({ rule: 'faceup-reduced-motion-ignored', page: url, selector: m.selector, message: `With the reduce-motion setting on, this still animates its ${m.props}.`, source: 'faceup' });
  } finally {
    await context.close();
  }
}

async function open(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load', { timeout: 10000 }).catch(() => null);
  return response;
}

export const STEP_KINDS = ['click', 'fill', 'select', 'press', 'waitFor', 'wait'];

// Runs a state's steps, such as clicks that open a view or a dialog, so the checks see that state.
async function runSteps(page, { name, steps = [] }) {
  for (const [i, step] of steps.entries()) {
    const kind = STEP_KINDS.find((k) => k in step);
    try {
      if (kind === 'click') await page.click(step.click, { timeout: 10000 });
      else if (kind === 'fill') await page.fill(step.fill, String(step.value ?? ''), { timeout: 10000 });
      else if (kind === 'select') await page.selectOption(step.select, String(step.value ?? ''), { timeout: 10000 });
      else if (kind === 'press') await page.keyboard.press(step.press);
      else if (kind === 'waitFor') await page.waitForSelector(step.waitFor, { timeout: 10000 });
      else if (kind === 'wait') await page.waitForTimeout(Math.min(Number(step.wait) || 0, 10000));
    } catch (error) {
      throw new Error(`step ${i + 1} of "${name}" (${kind} ${JSON.stringify(step[kind])}) did not work: ${error.message.split('\n')[0]}`);
    }
  }
  if (steps.length) await page.waitForTimeout(300);
}

// Opens a page in a fresh window and replays its state. When the steps fail at this window size,
// the check is noted as not assessed instead of failing the whole page.
async function openState(page, target, out, what) {
  await open(page, target.url);
  try {
    await runSteps(page, target);
    return true;
  } catch (error) {
    out.notAssessed.push({ rule: null, page: target.label, reason: `${what} was not checked, because ${error.message}` });
    return false;
  }
}

async function launch() {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    throw new Error('The browser check needs Playwright. Run "npm install" in the scanner folder, then try again.');
  }
  for (const channel of ['chrome', 'msedge']) {
    const browser = await playwright.chromium.launch({ channel }).catch(() => null);
    if (browser) return { browser, name: channel === 'chrome' ? 'Chrome' : 'Edge' };
  }
  const browser = await playwright.chromium.launch().catch(() => null);
  if (browser) return { browser, name: 'Chromium' };
  throw new Error('No browser found. Install Google Chrome or Microsoft Edge, or run "npx playwright install chromium".');
}

const sameAddress = (a, b) => {
  const norm = (x) => {
    const u = new URL(x);
    return u.origin + u.pathname.replace(/\/$/, '') + u.hash.split('?')[0];
  };
  return norm(a) === norm(b);
};

async function checkPage(browser, url, out, titles, pageLimit, width) {
  const start = Date.now();
  const deadline = start + pageLimit * 0.45;
  const coverDeadline = start + pageLimit * 0.7;
  const context = await browser.newContext({ viewport: { width, height: 800 } });
  try {
    const page = await context.newPage();
    const { target } = browser;
    const response = await open(page, target.url).catch((error) => ({ error }));
    if (!response || response.error || !response.ok()) {
      out.pageErrors.push({ page: url, message: response?.error ? response.error.message.split('\n')[0] : `The page answered with status ${response?.status() ?? 'none'}.` });
      return;
    }
    await page.waitForTimeout(300);
    if (!sameAddress(page.url(), target.url)) {
      const hop = await response.request().redirectedFrom()?.response();
      const server = hop && sameAddress(page.url(), response.url());
      const kind = [301, 308].includes(hop?.status()) ? 'permanently' : 'for now';
      out.pageErrors.push({
        page: url,
        ...(server ? { movedTo: page.url() } : {}),
        message: server
          ? `The server sends this address on to ${page.url()} ${kind}, so it was not checked. Check ${page.url()} instead.`
          : `The page went to ${page.url()} instead, so it was not checked. A screen like this often needs saved data, a sign-in, or settings in its address before it will show.`,
      });
      return;
    }
    const blocked = await page.evaluate(() => {
      const text = document.body?.innerText.trim() ?? '';
      const wall = document.querySelector('iframe[src*="_Incapsula_Resource"], #challenge-form, #challenge-running, #cf-challenge-running, #px-captcha');
      return Boolean(wall) || (text.length < 400 && /request unsuccessful|access denied|attention required|verify you are (a )?human|checking your browser|are you a robot|pardon our interruption/i.test(text));
    });
    if (blocked) {
      out.pageErrors.push({ page: url, message: 'The site showed a page that blocks automated browsers instead of its real content, so it was not checked.' });
      return;
    }
    await runSteps(page, target);
    await page.evaluate(installHelpers);
    out.pages.push(url);
    await findingsFromAxe(page, url, out);
    const title = await findingsFromDom(page, url, out);
    await findingsFromSkipLinks(page, url, out, null);
    if (title && !target.steps) titles.set(url, title);
    await findingsFromKeyboard(page, url, out, deadline);
    const backwards = await coverPass(page, url, out, coverDeadline, { reverse: true, width: width === 1280 ? null : width });
    const phone = backwards === 'done' && width > PHONE_WIDTH ? await findingsFromPhoneKeyboard(browser, url, out, coverDeadline) : backwards;
    if (phone === 'out of time') out.notAssessed.push({ rule: 'faceup-focus-obscured-sticky', page: url, reason: 'The time for keyboard checks ran out before every control was checked moving backwards and at phone width.' });
  } finally {
    await context.close();
  }
  if (!out.pages.includes(url)) return;
  await findingsFromReflow(browser, url, out);
  await findingsFromMotion(browser, url, out);
  await findingsFromTextSpacing(browser, url, out);
  await findingsFromDarkMode(browser, url, out);
}

const PLACES_LISTED = 10;

function groupRepeats(findings) {
  const groups = new Map();
  for (const f of findings) {
    const key = [f.rule, f.page, f.source, f.message.replace(/"[^"]*"/g, '""').replace(/\d+(\.\d+)?/g, '#')].join('|');
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups.values()].map((group) => {
    if (group.length === 1) return group[0];
    return {
      ...group[0],
      message: `${group[0].message} This kind of problem appears in ${group.length} places on this page, each with its own details.`,
      count: group.length,
      places: group.slice(0, PLACES_LISTED).map(({ selector, message }) => ({ selector, message })),
    };
  });
}

// states: [{ name, url, steps }] screens reached by clicks after loading, each checked as its own page.
// storageState: a Playwright storage state file, such as saved data or a sign-in, loaded into every window.
export async function renderScan(urls, { pageLimit = 120000, width = 1280, states = [], storageState } = {}) {
  const { browser, name } = await launch();
  const out = { browser: name, axeVersion: null, pages: [], findings: [], notAssessed: [], axeOther: [], axeIncomplete: [], pageErrors: [] };
  const titles = new Map();
  const stopped = new Set();
  const targets = [...urls.map((url) => ({ url, label: url })), ...states.map((s) => ({ ...s, label: `${s.url} (${s.name})` }))];
  try {
    for (const target of targets) {
      const url = target.label;
      const contexts = [];
      const tracked = { target, newContext: async (options) => { const c = await browser.newContext({ ...options, ...(storageState ? { storageState } : {}) }); contexts.push(c); return c; } };
      let timer;
      const limit = new Promise((resolve) => { timer = setTimeout(() => resolve('timeout'), pageLimit); });
      const run = checkPage(tracked, url, out, titles, pageLimit, width).then(() => 'done', (error) => error);
      const outcome = await Promise.race([run, limit]);
      clearTimeout(timer);
      if (outcome === 'done') continue;
      if (outcome === 'timeout') await Promise.all(contexts.map((c) => c.close().catch(() => null)));
      stopped.add(url);
      out.pageErrors.push({ page: url, message: outcome === 'timeout' ? `Checking this page took longer than ${Math.round(pageLimit / 1000)} seconds, so it was stopped and its results left out. Check it on its own, or by hand.` : `The check failed on this page: ${String(outcome?.message ?? outcome).split('\n')[0]}` });
    }
  } finally {
    await browser.close();
  }
  for (const key of ['findings', 'notAssessed', 'axeOther', 'axeIncomplete']) out[key] = out[key].filter((f) => !stopped.has(f.page));
  out.pages = out.pages.filter((p) => !stopped.has(p));
  for (const url of stopped) titles.delete(url);
  const byTitle = new Map();
  for (const [url, title] of titles) byTitle.set(title, [...(byTitle.get(title) ?? []), url]);
  for (const [title, pages] of byTitle) {
    if (pages.length < 2) continue;
    for (const url of pages) out.findings.push({ rule: 'faceup-page-title-generic', page: url, selector: 'title', message: `This page has the same title, "${title}", as ${pages.length - 1} other page${pages.length === 2 ? '' : 's'} checked, so their tabs and history entries look the same.`, source: 'faceup' });
  }
  out.findings = groupRepeats(out.findings);
  return out;
}
