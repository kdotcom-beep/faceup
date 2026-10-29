---
id: faceup-error-not-identified
title: Error message is vague and not linked to its field
summary: "An error message should be linked to its field and say how to fix the problem. Otherwise screen reader users do not hear it at the field, and nobody learns what to change."
failure_mode: feedback-and-status
tier: 3
severity: failure
anchor:
  wcag:
    - criterion: "3.3.3"
      name: Error Suggestion
      level: AA
  heuristic:
    - "Nielsen: help users recognise, diagnose, and recover from errors"
  ai_signature: "An error paragraph renders next to the input, but the input has no aria-describedby or aria-invalid, so the two are linked only by visual proximity."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: false
detection:
  scanner: []
  rendered: false
  agent: true
  human_review: true
  manual_test: "With a screen reader, move to the field with the error and check that it is read out as invalid, along with its message. A message that is not read out means the link is missing, and a message that does not say what a correct entry looks like fails 3.3.3."
related: [faceup-toast-only-error, faceup-async-status-not-announced]
added: 2026-09-07
---

## What it looks like

A rejected email shows "Invalid input." under the field, and the code does not connect the message to the field.

```jsx
function EmailField({ value, onChange, error }) {
  return (
    <div className="field">
      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={value} onChange={onChange} />
      {error && <p className="error">Invalid input.</p>}
    </div>
  )
}
```

```html
<div class="field">
  <label for="email">Email</label>
  <input id="email" type="email">
  <p class="error">Invalid input.</p>
</div>
```

The wording gives the person nothing to act on.

## Why it fails

- At the field, a screen reader user hears only "Email, edit text", and when they do find the message, it does not say how to fix the problem.
- Fails WCAG 2.2 success criterion 3.3.3, Error Suggestion, Level AA, because the fix is known but not given.
- Meets WCAG 2.2 success criterion 3.3.1, Error Identification, because a text message sits next to the field.
- The missing connection to the field is not a WCAG failure on its own, because 3.3.1 does not require it.

## The fix

Connect the message to the field, mark the field invalid, and say what a correct entry looks like.

```jsx
function EmailField({ value, onChange, error }) {
  return (
    <div className="field">
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={value}
        onChange={onChange}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'email-error' : undefined}
      />
      {error && (
        <p id="email-error" className="error">
          Enter an email address in the form name@example.com
        </p>
      )}
    </div>
  )
}
```

```html
<div class="field">
  <label for="email">Email</label>
  <input id="email" type="email" aria-invalid="true" aria-describedby="email-error">
  <p id="email-error" class="error">
    Enter an email address in the form name@example.com
  </p>
</div>
```

Marking the field invalid is one accepted way to meet 3.3.1.

## How it is detected

**What checks it today.**
- The Face Up skill flags error messages that are not connected to their field, and fields not marked invalid.
- It flags messages, such as "Invalid input", that do not say how to fix the problem.
- A person decides whether the wording fails 3.3.3.

**What it cannot catch.**
- Whether the wording is specific enough, which only a person can judge.
- The most widely used automatic checkers have no test for a message not connected to its field.

## Related rules

- `faceup-toast-only-error` - an error shown only in a pop-up that is never read out
- `faceup-async-status-not-announced` - loading and success messages never read out
