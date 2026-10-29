---
id: faceup-nontext-contrast
title: Controls and icons have low contrast
summary: "Field borders, focus outlines, icons and switches need a contrast of at least 3:1 against what is around them. Below that, people with low vision or a screen in bright light cannot see them."
failure_mode: focus-and-keyboard
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "1.4.11"
      name: Non-text Contrast
      level: AA
    - criterion: "2.4.13"
      name: Focus Appearance
      level: AAA
  heuristic: []
  ai_signature: "Model picks colours for borders, icons, focus rings, and control states by eye or from a palette's lighter steps, matching the visual mood of the design without ever computing the ratio against the adjacent surface."
surfaces: [css, component]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: false
detection:
  scanner: [browser]
  rendered: true
  agent: false
  human_review: false
  manual_test: "Squint at each field border, icon, focus outline and switch or checkbox state against the colour behind it. Where you cannot tell where a control ends or which state it is in, use a contrast checker to confirm it reaches 3:1."
related: [faceup-focus-not-visible, faceup-focus-obscured-sticky, faceup-placeholder-as-label]
added: 2026-09-07
---

## What it looks like

Field borders, the focus outline, icons and a switch's on and off colours are pale greys on white.

```css
.field {
  background: #ffffff;
  border: 1px solid #e2e2e2; /* 1.30:1 against white */
}

.field:focus-visible {
  outline: 2px solid #c9c9c9; /* 1.66:1 against white */
}

.toggle[aria-pressed="false"] { background: #eeeeee; } /* 1.16:1 against white */
.toggle[aria-pressed="true"]  { background: #dcdcdc; } /* 1.37:1 against white */

.icon-button svg {
  stroke: #cfcfcf; /* 1.56:1 against white */
}
```

The numbers are contrast ratios, from 1:1 (no difference) to 21:1 (black on white).

## Why it fails

- People with low vision, or anyone on a poor screen in bright light, cannot find the field, lose the focus outline, or tell whether the switch is on.
- Fails WCAG 2.2 success criterion 1.4.11, Non-text Contrast, Level AA, which requires each control or state to reach 3:1 against the colour next to it.
- The outline also fails WCAG 2.2 success criterion 2.4.13, Focus Appearance, Level AAA.
- The on and off colours need not reach 3:1 against each other. Telling states apart by colour alone falls under success criterion 1.4.1, Use of Colour, Level A.
- Text contrast falls under success criterion 1.4.3, Contrast (Minimum), and this catalogue leaves it to a design review.

## The fix

Keep every border, icon, outline and state colour at 3:1 or more against the colour behind it.

```css
.field {
  background: #ffffff;
  border: 1px solid #767676; /* 4.54:1 against white */
}

.field:focus-visible {
  outline: 2px solid #1a5fb4; /* 6.29:1 against white */
  outline-offset: 2px;
}

.toggle[aria-pressed="false"] {
  background: #ffffff;
  border: 2px solid #767676;
}
.toggle[aria-pressed="true"] {
  background: #1a5fb4; /* 6.29:1 against white, clearly distinct from off */
  border: 2px solid #1a5fb4;
}

.icon-button svg {
  stroke: #595959; /* 7.00:1 against white */
}
```

Show a switch's state with more than colour, such as a moving knob, a tick or a text label.

## How it is detected

**What checks it today.**
- The Face Up scanner's browser pass measures the edges of text fields against the colour behind them, and a border, outline, fill, shadow or close-fitting wrapper that reaches 3:1 passes.
- When an icon sits inside the field, a person checks by eye.
- On 14 well-known sites tested in October 2026, 3 of 6 findings were real, and the wrong ones were select menus. The scanner now lists a select menu for a person to check only when it shares the border of a field that failed.
- Findings are for review.

**What it cannot catch.**
- Select menus on their own, icons, switches, checkbox states and focus outlines.
- Fields over a photo or gradient.
- Whether a switch shows its state with more than colour.

## Related rules

- `faceup-focus-not-visible` - no keyboard focus outline at all
- `faceup-focus-obscured-sticky` - focus hidden behind a pinned header or footer
- `faceup-placeholder-as-label` - hint text used as the only label
