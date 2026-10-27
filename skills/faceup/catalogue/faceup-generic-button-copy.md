---
id: faceup-generic-button-copy
title: Button label does not name the action
summary: "The button that charges the card says 'Continue', the same word as every earlier step. Name the action, such as 'Place order'."
failure_mode: cognition-and-clarity
tier: 3
severity: ux-failure
anchor:
  heuristic:
    - "Nielsen: match between system and the real world"
    - "Nielsen: recognition rather than recall"
  ai_signature: "Primary action labelled with a default verb taken from the button role, which says nothing about what the click does."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: true
detection:
  automatic: false
  scanner: []
  rendered: false
  agent: true
  human_review: true
  manual_test: "Read the main button's label without looking at the rest of the screen, and reword it if a more specific label would say what will happen when it is pressed."
related: [faceup-vague-link-text, faceup-redundant-entry-multistep]
added: 2026-09-07
---

## What it looks like

The button that charges the card says "Continue", the same word as every earlier step.

```jsx
<section aria-label="Review order">
  <OrderSummary total="$142.00" />
  <button type="submit">Continue</button>
</section>
```

```html
<section aria-label="Review order">
  <p>Order total: $142.00</p>
  <button type="submit">Continue</button>
</section>
```

The button works for keyboard and screen reader users, so the problem lies only in the word on it.

## Why it fails

- People checking whether they are about to be charged get no answer from the button, because "Continue", "Submit", "OK" and "Next" describe the form itself, while "Place order" describes the outcome.
- This is not a WCAG failure, but it fails two Nielsen heuristics: "Match between system and the real world" and "Recognition rather than recall".

## The fix

Name what happens when the person presses the button, in their own terms.

```jsx
<section aria-label="Review order">
  <OrderSummary total="$142.00" />
  <button type="submit">Place order</button>
</section>
```

```html
<section aria-label="Review order">
  <p>Order total: $142.00</p>
  <button type="submit">Place order</button>
</section>
```

"Place order" makes sense on its own, whether someone reads it on screen or hears it through a screen reader.

## How it is detected

**What checks it today.**
- The Face Up skill flags buttons whose whole text is "Continue", "Submit", "OK", "Next", "Done" or "Go".
- Vercel's web interface guidelines make the same point, using "Save API Key" as the example of a label that replaces "Continue".
- The flag is advice only, and findings never block a release.

**What it cannot catch.**
- Whether the general word is actually right, as "Next" is in a form split into steps.
- The difference between a button that takes payment and one that moves to the next step of a form.

## Related rules

- `faceup-vague-link-text` - link text that names neither destination nor action
- `faceup-redundant-entry-multistep` - a later step asks again for details already given
