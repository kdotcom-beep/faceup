---
id: faceup-autocomplete-missing
title: Personal details fields have no autocomplete
summary: "Fields for personal details should tell the browser what they hold, such as name, email or card number. This lets browsers fill them in, sparing people with motor or memory difficulties from typing details again."
failure_mode: input-and-forms
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "1.3.5"
      name: Identify Input Purpose
      level: AA
  heuristic:
    - "Nielsen: recognition rather than recall"
  ai_signature: "Identity fields scaffolded from a generic input template that carries name, type and placeholder but never the autocomplete token."
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
  human_review: false
  manual_test: "Use the browser's inspect tool on each field that asks for your own name, email, address, phone number or card details, and check its autocomplete value matches what the field asks for."
related: [faceup-redundant-entry-multistep, faceup-placeholder-as-label, faceup-paste-blocked-password]
added: 2026-09-07
---

## What it looks like

Checkout fields for name, email, address, phone and card number do not tell the browser what they are for.

```jsx
<input type="text" name="fullname" placeholder="Full name" />
<input type="email" name="email" placeholder="Email" />
<input type="text" name="addr" placeholder="Street address" />
<input type="tel" name="phone" placeholder="Phone" />
<input type="text" name="cc" placeholder="Card number" />
```

Without that information, autofill sometimes works and sometimes puts details in the wrong field.

## Why it fails

- People who use a switch device or voice control, or who have a motor or memory difficulty, have to type details their browser already holds, such as a 16-digit card number.
- Fails WCAG 2.2 success criterion 1.3.5, Identify Input Purpose, Level AA.

## The fix

Give each personal details field the matching `autocomplete` value, which tells the browser what the field is for.

```jsx
<input type="text"  name="fullname" autoComplete="name" placeholder="Full name" />
<input type="email" name="email"    autoComplete="email" placeholder="Email" />
<input type="text"  name="addr"     autoComplete="street-address" placeholder="Street address" />
<input type="tel"   name="phone"    autoComplete="tel" placeholder="Phone" />
<input type="text"  name="cc"       autoComplete="cc-number" placeholder="Card number" />
```

## How it is detected

**What checks it today.**
- The Face Up skill matches each field's type, name and placeholder against common personal details: name, email, address, postcode, phone and card.
- A match with no `autocomplete` value goes to a person to confirm and never blocks a release.
- Only details about the person filling in the form are covered. A staff screen showing a customer's address looks the same in code, so the skill reads the surrounding page to judge whose details a field asks for.

**What it cannot catch.**
- A wrong value, such as an email field marked as a name.
- A field for any detail outside the skill's list.

## Related rules

- `faceup-redundant-entry-multistep` - earlier answers are asked for again
- `faceup-placeholder-as-label` - placeholder used as the only label
- `faceup-paste-blocked-password` - another way password managers are blocked
