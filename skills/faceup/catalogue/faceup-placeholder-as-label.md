---
id: faceup-placeholder-as-label
title: Placeholder text is the only label
summary: "Every field needs a label that stays visible, not just grey hint text inside it. The hint vanishes once typing starts, leaving people unsure what the field was for."
failure_mode: input-and-forms
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "3.3.2"
      name: Labels or Instructions
      level: A
    - criterion: "1.4.3"
      name: "Contrast (Minimum)"
      level: AA
  heuristic:
    - "Nielsen: recognition rather than recall"
  ai_signature: "Input generated with a placeholder standing in for the label. No paired label element emitted."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: true
detection:
  automatic: false
  scanner: [browser]
  rendered: true
  agent: true
  human_review: false
  manual_test: "Click into each field and type one letter. If nothing on screen still tells you what the field is for, it fails."
related: [faceup-autocomplete-missing, faceup-redundant-entry-multistep, faceup-premature-validation]
added: 2026-09-07
---

## What it looks like

A sign-in form has no labels, only grey hint text inside each field that vanishes once typing starts.

```jsx
<input type="email" name="email" placeholder="Email address" />
<input type="password" name="password" placeholder="Password" />
```

## Why it fails

- People who lose track while typing, or come back to fix an error, find the prompt gone.
- Fails WCAG 2.2 success criterion 3.3.2, Labels or Instructions, Level A.
- Hint text is often pale grey, below the 4.5:1 contrast required by WCAG 2.2 success criterion 1.4.3, Contrast (Minimum), Level AA.
- It does not fail success criterion 4.1.2, Name, Role, Value, because screen readers fall back to using the hint as the name, though support varies.

## The fix

Give each field a label that stays visible, and use hint text only for an example of what to enter.

```jsx
<label htmlFor="email">Email address</label>
<input id="email" type="email" name="email"
       autoComplete="email" placeholder="you@example.com" />

<label htmlFor="password">Password</label>
<input id="password" type="password" name="password"
       autoComplete="current-password" />
```

Keeping labels visible at all times goes beyond what 3.3.2 asks for.

## How it is detected

**What checks it today.**
- The Face Up scanner's browser pass flags visible text fields whose only name is the hint text, and the Face Up skill looks for the same pattern in the code.
- On 14 well-known sites tested in October 2026, all 3 findings were real.
- A person reviews each finding, and none blocks a release.

**What it cannot catch.**
- A visible label that is not linked to its field, which the check flags as if the label were missing.
- Hint text contrast, which needs a contrast checker.
- Hint text that repeats the label word for word, a minor issue no check flags.

## Related rules

- `faceup-autocomplete-missing` - the same fields often lack browser autofill settings
- `faceup-redundant-entry-multistep` - a vanished label makes re-entered fields harder to check
- `faceup-premature-validation` - an error shown while typing is worse without a label
