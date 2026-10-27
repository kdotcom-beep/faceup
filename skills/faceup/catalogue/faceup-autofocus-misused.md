---
id: faceup-autofocus-misused
title: Page moves focus to a field on load
summary: "A page should not move keyboard focus to a field when it loads. The jump makes screen reader and magnifier users lose their place and skips keyboard users past the heading and navigation."
failure_mode: cognition-and-clarity
tier: 2
severity: ux-failure
anchor:
  wcag: []
  heuristic:
    - "Nielsen: user control and freedom"
  ai_signature: "autoFocus is added reflexively to the first input of a form or modal, regardless of where that field sits in the page or whether the user asked for focus to move there."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: true
  wig: false
detection:
  automatic: false
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "Load the page, or open the dialog or panel, and confirm nothing scrolls by itself or moves you to a field you did not choose."
related: [faceup-focus-obscured-sticky, faceup-premature-validation, faceup-missing-loading-state]
added: 2026-09-07
---

## What it looks like

On load, the page jumps to a field far down and puts keyboard focus there.

```jsx
function NewsletterSignup() {
  return (
    <section className="signup" style={{ marginTop: "1400px" }}>
      <h2>Join the list</h2>
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoFocus />
        <button type="submit">Subscribe</button>
      </form>
    </section>
  );
}
```

```html
<section class="signup" style="margin-top: 1400px">
  <h2>Join the list</h2>
  <form>
    <label for="email">Email</label>
    <input id="email" type="email" autofocus>
    <button type="submit">Subscribe</button>
  </form>
</section>
```

A dialog that sends focus to a control the person was not looking at does the same.

## Why it fails

- Magnifier and screen reader users lose their place, and keyboard users skip past the heading and navigation. For people with balance disorders, the jump is movement they did not start.
- This is a UX failure against the heuristic of user control and freedom, because no WCAG criterion clearly covers it.
- WCAG 2.2 success criterion 3.2.1, On Focus, Level A, is related, but this rule does not cite it.

## The fix

Let the page load at the top, and move focus only when the person's action calls for it, such as opening a search panel.

```jsx
function NewsletterSignup() {
  return (
    <section className="signup" style={{ marginTop: "1400px" }}>
      <h2>Join the list</h2>
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" />
        <button type="submit">Subscribe</button>
      </form>
    </section>
  );
}
```

```html
<section class="signup" style="margin-top: 1400px">
  <h2>Join the list</h2>
  <form>
    <label for="email">Email</label>
    <input id="email" type="email">
    <button type="submit">Subscribe</button>
  </form>
</section>
```

When a dialog opens, move focus to its first control, as the W3C recommends, or to its heading in a long dialog. Focusing a field on load is fine only when the field is the reason the page exists and sits at the top, as on a search page.

## How it is detected

**What checks it today.**
- The Face Up skill finds every place the code focuses a field automatically.
- A person reviews each one, because the code cannot show where the field sits.
- A common code-checking tool reports every case and cannot tell good uses from harmful ones either.
- Findings never block a release.

**What it cannot catch.**
- Whether the page scrolls, and how far. That depends on the layout.

## Related rules

- `faceup-focus-obscured-sticky` - the focused control hides under a fixed bar
- `faceup-premature-validation` - a field reacts before the person has used it
- `faceup-missing-loading-state` - the view changes with no sign to follow
