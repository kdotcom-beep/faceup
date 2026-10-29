---
id: faceup-target-too-small
title: Tap targets are too small
summary: "Buttons and links must be at least 24 by 24 pixels, or have enough space around them. Smaller targets make people with tremors, large fingers or a moving phone hit the wrong control."
failure_mode: input-and-forms
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "2.5.8"
      name: Target Size (Minimum)
      level: AA
  heuristic: []
  ai_signature: "Model sizes an icon button or link to the glyph alone, with no padding, so the hit area falls well under 24 by 24 CSS px."
surfaces: [css, component]
detectable_by:
  axe: true
  jsx_a11y: false
  wig: true
detection:
  scanner: [browser]
  rendered: true
  agent: false
  human_review: false
  manual_test: "For each flagged button or link, check whether an exception applies: another control elsewhere on the page that does the same job and meets the size, a target inside a sentence or limited by the line height around it, a default browser size the site has not changed, or a size that is essential or legally required. If none applies, it fails."
related: [faceup-div-as-button, faceup-focus-not-visible, faceup-control-missing-name]
added: 2026-09-07
---

## What it looks like

An icon button is only as big as its 16 pixel icon.

```css
.icon-btn {
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: none;
}
```

```jsx
<button type="button" className="icon-btn" onClick={onDelete} aria-label="Delete row">
  <TrashIcon width={16} height={16} />
</button>
```

```html
<button type="button" class="icon-btn" aria-label="Delete row">
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><use href="#icon-trash"></use></svg>
</button>
```

The button works and has a name, but it is too small to hit reliably.

## Why it fails

- People with a tremor, large fingers or a phone on a moving train hit the neighbouring button by mistake and may delete the wrong row.
- Fails WCAG 2.2 success criterion 2.5.8, Target Size (Minimum), Level AA, which requires targets to be at least 24 by 24 pixels or to have enough space around them.

## The fix

Keep the icon and grow the button around it to at least 24 by 24 pixels, or 44 for touch.

```css
.icon-btn {
  display: inline-grid;
  place-items: center;
  inline-size: 44px;
  block-size: 44px;
  padding: 0;
  border: none;
  background: none;
}
```

```jsx
<button type="button" className="icon-btn" onClick={onDelete} aria-label="Delete row">
  <TrashIcon width={16} height={16} />
</button>
```

```html
<button type="button" class="icon-btn" aria-label="Delete row">
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><use href="#icon-trash"></use></svg>
</button>
```

If a target cannot grow, enough space around it also passes: a 24 pixel circle centred on it must not overlap another target or another target's circle. This rule checks against 24 pixels, while success criterion 2.5.5, Target Size (Enhanced), Level AAA, asks for 44 by 44.

## How it is detected

**What checks it today.**
- The scanner's browser check runs the target size rule from axe, a widely used testing tool, which measures each control as drawn on screen and tests its 24 pixel circle against its neighbours.
- Targets axe cannot decide are listed as not assessed.
- The Face Up skill can also spot a target set below 24 pixels in the code.
- Findings are for review.

**What it cannot catch.**
- The exceptions listed under "Test it yourself", which a person checks against each flagged target.

## Related rules

- `faceup-div-as-button` - a control that is not a real button
- `faceup-focus-not-visible` - a control shows no sign when it receives keyboard focus
- `faceup-control-missing-name` - an icon button with no accessible name
