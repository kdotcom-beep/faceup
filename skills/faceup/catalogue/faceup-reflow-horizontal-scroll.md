---
id: faceup-reflow-horizontal-scroll
title: Content breaks when zoomed or on a narrow screen
summary: "A fixed-width layout and text sized to the window break when the person zooms in or uses a narrow screen. Let sections shrink to fit, and size text in units that grow with zoom."
failure_mode: state-and-edge-cases
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "1.4.10"
      name: Reflow
      level: AA
    - criterion: "1.4.4"
      name: Resize Text
      level: AA
  heuristic: []
  ai_signature: "Model sizes layout regions in fixed pixels and text in viewport units because the reference design was a single desktop width, never modelling what happens at 320px or 200% zoom."
surfaces: [css, route]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: false
detection:
  automatic: false
  scanner: [browser]
  rendered: true
  agent: false
  human_review: false
  manual_test: "Make the browser window 1280 pixels wide and zoom to 400%, which makes the page behave as if it were 320 pixels wide, and confirm you only need to scroll in one direction. Then zoom a normal-width window to 200% and confirm the text has grown and no content or feature is lost."
related: [faceup-focus-obscured-sticky, faceup-placeholder-as-label, faceup-nontext-contrast]
added: 2026-09-07
---

## What it looks like

The page uses fixed widths, and some of its text is sized by the width of the window.

```css
.page {
  width: 1200px;   /* wider than a 320px viewport, forces sideways scroll */
  margin: 0 auto;
}

.card {
  width: 640px;    /* fixed, will not reflow into a narrow column */
}

.lede {
  font-size: 2.5vw; /* shrinks with the viewport instead of honouring zoom */
}
```

At 320 pixels wide, the width of a small phone or a heavily zoomed window, the page spills off the side of the screen.

## Why it fails

- People on small phones, or who zoom in to read, have to scroll back and forth to follow a single line, and text sized to the window does not grow when they zoom.
- Fails WCAG 2.2 success criterion 1.4.10, Reflow, Level AA, because at 320 pixels wide the person must scroll in two directions.
- Fails WCAG 2.2 success criterion 1.4.4, Resize Text, Level AA, because window-sized text does not grow with zoom.
- Not a failure: a two-dimensional layout that carries meaning, such as a data table or map, scrolling sideways in its own box.
- Content spilling out of its box at normal width is a visual bug for design review, outside this rule.

## The fix

Give sections a maximum width so they can shrink on smaller screens, and size text in units that grow with zoom.

```css
.page {
  width: 100%;
  max-width: 1200px;   /* caps on large screens, still collapses on small */
  margin: 0 auto;
  padding-inline: 1rem;
}

.card {
  width: 100%;
  max-width: 640px;    /* reflows into a single narrow column at 320px */
}

.lede {
  font-size: 1.5rem; /* rem scales with zoom and the user font size */
}
```

Text sized partly by the window's width can stop growing before 200% zoom, even when it has a minimum and maximum size, so test it at 200% if you use it.

## How it is detected

**What checks it today.**
- The scanner opens the page at 320 pixels wide and reports elements that cause more than 4 pixels of sideways scrolling, as well as text cut off by its box.
- It skips images, video, embedded frames, canvases, image maps, tables, code blocks, carousels, boxes that scroll sideways, and anything inside them.
- On 14 well-known sites tested in October 2026, all 3 findings were real.
- Findings are for a person to review and never block a release.
- The Face Up skill reads the code for fixed pixel widths and text sized by the window.

**What it cannot catch.**
- Whether text grows at 200% zoom without any content being lost.
- The difference between an allowed two-dimensional layout, such as a map, and an accidental fixed width, which a person has to decide.

## Related rules

- `faceup-focus-obscured-sticky` - a sticky bar at high zoom hides the focused control
- `faceup-placeholder-as-label` - a vanishing label adds to lost context at high zoom
- `faceup-nontext-contrast` - borders and controls below 3:1 contrast
