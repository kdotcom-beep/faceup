---
id: faceup-aria-references-missing-id
title: Label or description points to an element that is not there
summary: "When a control takes its name or hint from another element, that element must exist on the page. If it does not, screen readers announce only 'button' and skip the hint entirely."
failure_mode: naming-and-semantics
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "4.1.2"
      name: Name, Role, Value
      level: A
  heuristic: []
  ai_signature: "Model writes aria-labelledby=\"x\" (or aria-describedby / aria-controls) but never renders an element with id=\"x\", inventing a reference that resolves to nothing."
surfaces: [component]
detectable_by:
  axe: true
  jsx_a11y: false
  wig: false
detection:
  automatic: false
  scanner: [browser]
  rendered: true
  agent: false
  human_review: false
  manual_test: "With a screen reader running, move through each button and field, and treat any that announces only its type, such as 'button', as pointing to text that is not on the page."
related: [faceup-control-missing-name, faceup-div-as-button, faceup-placeholder-as-label]
added: 2026-09-07
---

## What it looks like

A button takes its name from a heading and a password field takes its hint from a note, each referring to its text by id, the unique name an element carries in the code. Neither the heading nor the note is ever on the page.

```jsx
<button aria-labelledby="menu-heading" onClick={toggle}>
  <MenuIcon aria-hidden="true" />
</button>

<input
  type="password"
  aria-describedby="password-hint"
/>
// no element with id="menu-heading" is ever rendered
// no element with id="password-hint" is ever rendered
```

## Why it fails

- Screen reader users hear only "button", and they miss the password rule until the form rejects what they typed.
- Fails WCAG 2.2 success criterion 4.1.2, Name, Role, Value, Level A, when the broken reference is the control's only name.
- A broken hint, or a broken link to a panel the control opens, does not fail 4.1.2 on its own, so the rule flags these without counting them as WCAG failures.

## The fix

Add the missing element with the id the reference uses, or remove the reference.

```jsx
<h2 id="menu-heading">Main menu</h2>
<button aria-labelledby="menu-heading" onClick={toggle}>
  <MenuIcon aria-hidden="true" />
</button>

<input
  type="password"
  aria-describedby="password-hint"
/>
<p id="password-hint">At least 12 characters.</p>
```

Where a control has no visible text to point to, name it with `aria-label`, which only screen readers announce.

## How it is detected

**What checks it today.**
- The scanner opens the page in a browser and reports any reference, such as aria-labelledby, that points to an id missing from the page.
- It skips hidden elements, closed controls and unselected tabs, whose targets often appear only when opened.
- On 33 well-known sites tested in October 2026, the 18 findings outside one site were all real. That site's 28 wrong findings all came from unselected tabs, which the scanner now skips.
- Some real findings were not WCAG failures, because the control took its name from elsewhere.
- This is a browser check only, and its findings never fail a build.
- Other automated tools check this only in part.

**What it cannot catch.**
- References that break after someone interacts, because the scanner sees only the first load.
- Text that appears after a click is reported as missing even when it arrives in time, so a person confirms these findings on the running page.

## Related rules

- `faceup-control-missing-name` - an icon-only control with no name
- `faceup-div-as-button` - a plain element made to act like a button
- `faceup-placeholder-as-label` - grey example text used as the only label
