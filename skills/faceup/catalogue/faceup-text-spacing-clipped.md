---
id: faceup-text-spacing-clipped
title: Text is cut off when spacing is increased
summary: "Text boxes that hide anything past a fixed height or line count cut off text when someone widens text spacing. Let boxes grow with their text, and do not lock spacing with !important."
failure_mode: state-and-edge-cases
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "1.4.12"
      name: Text Spacing
      level: AA
  heuristic: []
  ai_signature: "Generated components size text boxes to the mock-up with a fixed height and overflow: hidden or a line clamp, and set line height or letter spacing in inline styles marked !important."
surfaces: [css, component]
detectable_by:
  axe: true
  jsx_a11y: false
  wig: false
detection:
  automatic: false
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "Apply the four text spacing values with a bookmarklet or browser extension and check that no text is cut off, hidden or overlapping."
related: [faceup-reflow-horizontal-scroll, faceup-nontext-contrast, faceup-focus-obscured-sticky]
added: 2026-10-21
---

## What it looks like

A product card cuts off text that does not fit a fixed height, and the button locks its spacing with `!important`, a marker that overrides other styles.

```html
<article class="card">
  <h3 class="card__title">Trail runner</h3>
  <p class="card__summary">
    Lightweight shoe with a grippy sole for wet tracks and loose gravel.
  </p>
  <button style="line-height: 1 !important; letter-spacing: 0 !important">
    Add to cart
  </button>
</article>
```

```css
.card__summary {
  height: 3em;
  overflow: hidden;
}

.card__title {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

With wider spacing, the title and description lose their last words.

## Why it fails

- People with dyslexia or low vision often widen text spacing with a browser extension. Text in fixed-height boxes is then cut off or overlaps, and most extensions cannot change spacing locked with `!important` on the element itself.
- Fails WCAG 2.2 success criterion 1.4.12, Text Spacing, Level AA. No content or function may be lost when someone sets all four of these at once:
  - line height to 1.5 times the font size
  - spacing after paragraphs to 2 times the font size
  - letter spacing to 0.12 times the font size
  - word spacing to 0.16 times the font size
- The page need not apply this spacing itself.
- The criterion covers HTML and CSS text, and languages that do not use one of these spacing properties need only support the others.

## The fix

Let text boxes grow with their text, stop hiding overflow, and drop `!important` from spacing.

```html
<article class="card">
  <h3 class="card__title">Trail runner</h3>
  <p class="card__summary">
    Lightweight shoe with a grippy sole for wet tracks and loose gravel.
  </p>
  <button class="card__button">Add to cart</button>
</article>
```

```css
.card__summary {
  min-height: 3em;
}

.card__button {
  line-height: 1.2;
}
```

If a preview must be short, cut off only a teaser that links to the full text. To keep cards aligned, use a grid that stretches every card to match the tallest.

## How it is detected

**What checks it today.**
- The Face Up skill looks for fixed-height text boxes that hide overflow, text cut to a set number of lines, and spacing locked with `!important` on the element itself.
- The scanner does not check this rule or apply the spacing. When axe, a widely used testing tool, finds locked spacing below the values above, the scanner lists it outside the Face Up catalogue.
- A person confirms each finding, and none blocks a release.

**What it cannot catch.**
- Whether text is lost, which depends on the font, text length and screen width.
- Spacing set by JavaScript, and text inside images or drawn on a canvas.

## Related rules

- `faceup-reflow-horizontal-scroll` - content breaks when the page is zoomed or the screen is narrow
- `faceup-nontext-contrast` - borders and controls drawn in colours too close to the background
- `faceup-focus-obscured-sticky` - a pinned header covers the control the keyboard lands on
