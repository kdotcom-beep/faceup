---
id: faceup-div-as-button
title: Clickable element that is not a button
summary: "Anything that acts like a button should be a real button element. A clickable box cannot be reached with the keyboard, is not announced as a button, and cannot be pressed by voice command."
failure_mode: naming-and-semantics
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "4.1.2"
      name: Name, Role, Value
      level: A
    - criterion: "2.1.1"
      name: Keyboard
      level: A
  heuristic: []
  ai_signature: "A styled div or span with an onClick handler in place of a button, with no role, focusability or keyboard behaviour."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: true
  wig: true
detection:
  automatic: true
  scanner: [code]
  rendered: false
  agent: false
  human_review: false
  manual_test: "Use the Tab key to reach each control, then press Enter and Space and check that each one works."
related: [faceup-control-missing-name, faceup-focus-not-visible, faceup-aria-references-missing-id]
added: 2026-09-07
---

## What it looks like

Something looks like a button and works with a mouse, but it is a plain box with code that runs on a click.

```jsx
<div className="btn btn-primary" onClick={handleSubmit}>
  Save changes
</div>
```

## Why it fails

- Keyboard users cannot reach it, screen reader users are not told it is a button, and voice control users cannot say "click Save changes".
- The missing button role fails WCAG 2.2 success criterion 4.1.2, Name, Role, Value, Level A.
- The missing keyboard access fails WCAG 2.2 success criterion 2.1.1, Keyboard, Level A.

## The fix

Use a real button, which works with the keyboard and is announced as a button without any extra code.

```jsx
<button type="button" className="btn btn-primary" onClick={handleSubmit}>
  Save changes
</button>
```

You can add a button role, a Tab stop and key handling to a plain box by hand, but it is easy to get wrong, so keep that approach for the rare case where the layout forces it.

## How it is detected

**What checks it today.**
- The Face Up scanner flags a plain element, such as a div, span or list item, that has a click handler (code that runs on a click), unless it also has a control role such as button, a Tab stop and a key handler.
- It ignores a handler that only stops the click reaching the elements around it.
- It marks an element as not assessed if it has passed-through settings (props), a backdrop class name such as overlay, or a real control inside it.
- A finding can fail a build.
- Code-checking tools such as eslint-plugin-jsx-a11y also catch this, but axe, the most widely used page-testing tool, cannot see click handlers.

**What it cannot catch.**
- A box with hand-added button behaviour that is slightly wrong, such as a key handler that ignores Space.
- A custom component with a click handler, such as a Card.

## Related rules

- `faceup-control-missing-name` - a control with no name to read out
- `faceup-focus-not-visible` - no visible marker when the keyboard reaches a control
- `faceup-aria-references-missing-id` - accessibility attributes point at missing elements
