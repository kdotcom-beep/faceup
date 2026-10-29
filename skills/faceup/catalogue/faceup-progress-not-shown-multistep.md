---
id: faceup-progress-not-shown-multistep
title: Multi-step form does not show progress
summary: "A form split into steps should show which step the person is on and how many there are. Without it, people cannot judge how long is left, and some give up."
failure_mode: flow-and-memory
tier: 2
severity: ux-failure
anchor:
  heuristic:
    - "Nielsen: visibility of system status"
  ai_signature: "Each step rendered as a standalone screen with no shared step index or total. The flow's length is never threaded through to any single step."
surfaces: [flow, route]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: false
detection:
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "Enter the flow and confirm the current step and the total number of steps are visible on every step."
related: [faceup-redundant-entry-multistep, faceup-back-discards-data, faceup-consistent-help]
added: 2026-09-07
---

## What it looks like

On step two of a four-step sign-up, nothing says which step this is or how many remain.

```jsx
// Step 2 of the flow, rendered on its own route
function VerifyIdentity() {
  return (
    <section>
      <h1>Verify your identity</h1>
      <IdentityFields />
      <button onClick={goNext}>Next</button>
    </section>
  )
}
```

```html
<!-- Step 2 of the flow, on its own page -->
<form action="/sign-up/step-3">
  <h1>Verify your identity</h1>
  <!-- identity fields -->
  <button type="submit">Next</button>
</form>
```

## Why it fails

- People cannot tell whether the task will take two minutes or twenty, and people with attention or memory difficulties lose their place. Some give up.
- This does not fail WCAG, but it breaks Nielsen's heuristic of visibility of system status.
- WCAG 2.2 success criterion 2.4.8, Location, covers the same need at Level AAA, which is not required for conformance.

## The fix

Show the same indicator on every step, giving the current step and the total.

```jsx
function Step({ current, total, title, children }) {
  return (
    <section>
      <p>Step {current} of {total}</p>
      <h1>{title}</h1>
      {children}
    </section>
  )
}

// Step 2
<Step current={2} total={4} title="Verify your identity">
  <IdentityFields />
  <button onClick={goNext}>Next</button>
</Step>
```

```html
<!-- Step 2. Every step shows the same indicator. -->
<form action="/sign-up/step-3">
  <p>Step 2 of 4</p>
  <h1>Verify your identity</h1>
  <!-- identity fields -->
  <button type="submit">Next</button>
</form>
```

A progress bar with a text label, or a list of steps with the current one marked, also works.

## How it is detected

**What checks it today.**
- The Face Up skill reads each step of a multi-step process and flags any step with no indicator, or with a step number but no total.
- Checking one screen at a time misses this, because each step is built separately.

**What it cannot catch.**
- Whether a single-page form with visually separate sections counts as multi-step, which a person must judge.
- A process whose length cannot be known in advance, such as a questionnaire that branches on answers, where "Step 2 of 4" would be a false promise.
- Neither of these is treated as a failure here.

## Related rules

- `faceup-redundant-entry-multistep` - earlier answers are asked for again
- `faceup-back-discards-data` - going back throws away what you entered
- `faceup-consistent-help` - help appears in a different place on each screen
