---
id: faceup-missing-empty-state
title: Empty list shows nothing
summary: "A list with nothing in it should say why it is empty and what to do next. A blank area looks the same whether there is nothing yet, nothing matched or the app is broken."
failure_mode: state-and-edge-cases
tier: 1
severity: ux-failure
anchor:
  wcag: []
  heuristic:
    - "Nielsen: visibility of system status"
    - "Nielsen: help users recognise, diagnose, and recover from errors"
  ai_signature: "Only the populated branch is generated. The array is assumed non-empty, so the empty case renders a bare region."
surfaces: [component, route]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: true
detection:
  automatic: false
  scanner: [code]
  rendered: false
  agent: true
  human_review: false
  manual_test: "Open the page with no items and confirm it clearly explains why it is empty and offers a next step."
related: [faceup-missing-loading-state, faceup-missing-error-branch]
added: 2026-09-07
---

## What it looks like

When there are no records, the page shows a heading over an empty space.

```jsx
function Invoices({ invoices }) {
  return (
    <section>
      <h2>Invoices</h2>
      <ul>
        {invoices.map(inv => (
          <li key={inv.id}>{inv.number} - {inv.total}</li>
        ))}
      </ul>
    </section>
  )
}
```

## Why it fails

- People cannot tell "no invoices yet" from "your filter matched nothing" or "the app is broken", and new users, who see the product at its emptiest, feel this most.
- This does not fail WCAG, but it breaks two of Jakob Nielsen's usability heuristics: visibility of system status, and help users recognise, diagnose, and recover from errors.

## The fix

Say why the list is empty and give one clear next step.

```jsx
function Invoices({ invoices }) {
  if (invoices.length === 0) {
    return (
      <section>
        <h2>Invoices</h2>
        <p>You have not created any invoices yet.</p>
        <a href="/invoices/new">Create your first invoice</a>
      </section>
    )
  }

  return (
    <section>
      <h2>Invoices</h2>
      <ul>
        {invoices.map(inv => (
          <li key={inv.id}>{inv.number} - {inv.total}</li>
        ))}
      </ul>
    </section>
  )
}
```

A filtered list needs its own message, such as "No invoices match this filter", with a way to clear the filter.

## How it is detected

**What checks it today.**
- The Face Up scanner and skill look for components that load data and show a list, with nothing shown when the list is empty.
- The scanner treats a component as loading data when it calls a React data hook such as useQuery or useSWR, or calls fetch, axios, supabase, ky or got inside useEffect, either directly or through one of the project's own hooks.
- A list written directly into the code is not treated as data that can be empty.
- Findings go to a person to review and never fail a build.

**What it cannot catch.**
- A component that gets its list from a parent component, as in the example above.
- An empty case handled for the wrong list, because any length check, an element named like Empty or NoResults, or text such as "No results" counts as handling it.
- Whether the message helps, whether the next step is right, and whether the page is empty or still loading, which are all judgement calls.

## Related rules

- `faceup-missing-loading-state` - no sign that data is loading
- `faceup-missing-error-branch` - nothing shown when loading fails
