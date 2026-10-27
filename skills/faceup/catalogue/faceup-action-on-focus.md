---
id: faceup-action-on-focus
title: Moving focus onto a control triggers an action
summary: "Moving keyboard focus onto a control must not submit a form, open a window or load a page. Otherwise keyboard and screen reader users passing through are sent somewhere they did not choose."
failure_mode: input-and-forms
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "3.2.1"
      name: On Focus
      level: A
  heuristic:
    - "Nielsen: user control and freedom"
  ai_signature: "Model attaches navigation, form submission, window.open or a focus() call on another element to an onFocus handler, treating arrival on a control as intent to use it."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: false
detection:
  automatic: false
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "Press only Tab through every control on the page and check nothing opens a window, sends the form, loads a page or moves focus elsewhere."
related: [faceup-context-change-on-input, faceup-autofocus-misused, faceup-focus-order-jumps]
added: 2026-10-21
---

## What it looks like

A search field loads a new page, and a help button opens a new window, as soon as the keyboard reaches them.

```jsx
<input
  type="search"
  aria-label="Search"
  onFocus={() => router.push("/search")}
/>

<button
  type="button"
  onFocus={() => window.open("/help/billing", "_blank")}
>
  Billing help
</button>
```

## Why it fails

- Keyboard and screen reader users who Tab past these controls on the way to something else are taken somewhere they did not choose and lose their place.
- Fails WCAG 2.2 success criterion 3.2.1, On Focus, Level A.
- Showing a tooltip, a focus outline or help text on arrival is fine.
- An action triggered by changing a value falls under `faceup-context-change-on-input` and success criterion 3.2.2, On Input.

## The fix

Trigger the action on a click, Enter, Space or a form submission rather than on arrival.

```jsx
<form role="search" action="/search">
  <label htmlFor="q">Search</label>
  <input id="q" name="q" type="search" />
  <button type="submit">Search</button>
</form>

<a href="/help/billing" target="_blank" rel="noopener">
  Billing help (opens in a new tab)
</a>
```

Reserve code that runs on arrival for small changes that leave the person where they are.

## How it is detected

**What checks it today.**
- The Face Up skill looks for code that runs on arrival and loads a page, sends a form, opens a window, moves focus elsewhere or replaces large parts of the page.
- A person confirms each finding, and findings never block a release.
- The scanner has no check for this rule.

**What it cannot catch.**
- Whether a change is big enough to count, which a person decides.
- Code in shared libraries or third-party scripts.

## Related rules

- `faceup-context-change-on-input` - changing a value opens a new page without warning
- `faceup-autofocus-misused` - the page moves focus to a field on load
- `faceup-focus-order-jumps` - keyboard order through the page is confusing
