---
id: faceup-paste-blocked-password
title: Password field blocks paste
summary: "Password fields must allow pasting, so password managers can fill them. Blocking paste forces people with motor impairments to type long passwords by hand and people with memory difficulties to remember them."
failure_mode: input-and-forms
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "3.3.8"
      name: "Accessible Authentication (Minimum)"
      level: AA
  heuristic:
    - "Nielsen: error prevention"
  ai_signature: "onPaste wired to preventDefault on an auth field, usually copied in as a misguided security measure."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: true
detection:
  scanner: []
  rendered: false
  agent: false
  human_review: false
  manual_test: "Try pasting text into each email and password field on the live page. If nothing appears, pasting is blocked."
related: [faceup-cognitive-auth-test, faceup-autocomplete-missing, faceup-placeholder-as-label]
added: 2026-09-07
---

## What it looks like

Both login fields block pasting.

```jsx
<input type="email" name="email"
       onPaste={e => e.preventDefault()} />

<input type="password" name="password"
       onPaste={e => e.preventDefault()} />
```

This can stop a password manager from putting a long password into the password field.

## Why it fails

- People with a motor impairment have to type a long random password by hand, and people with memory difficulties have to remember it.
- Fails WCAG 2.2 success criterion 3.3.8, Accessible Authentication (Minimum), Level AA. Login must not depend on a memory test such as recalling or retyping a password, and WCAG names pasting as a way around it.
- The criterion covers the password and any username the site created for the person.
- An email field is not covered, because WCAG says entering a name, email address or phone number is not a memory test.
- Blocking paste on an email field is still a usability failure, because people have to retype a long address and may mistype it.

## The fix

Remove the paste block, and tell the browser what each field is for.

```jsx
<input type="email" name="email"
       autoComplete="username" />

<input type="password" name="password"
       autoComplete="current-password" />
```

Blocking paste adds no security, and it pushes people towards weaker passwords they can retype.

## How it is detected

**What checks it today.**
- The Face Up skill reads the code for password fields that block pasting.
- A username field needs a closer look, because only a username the site created is covered.
- Blocked paste on an email field is reported as a usability problem and never as a 3.3.8 failure.
- The scanner's code check is switched off. None of the real projects it was tested on blocked paste, so there was no way to prove the check works.

**What it cannot catch.**
- Paste blocked less directly, by shared code elsewhere or by code added while the page runs.

## Related rules

- `faceup-cognitive-auth-test` - the wider failure of a memory or puzzle test at login
- `faceup-autocomplete-missing` - without it, a password manager cannot find the field
- `faceup-placeholder-as-label` - login fields often have this failure too
