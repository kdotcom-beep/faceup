---
id: faceup-cognitive-auth-test
title: Login depends on memory or a puzzle
summary: "Logging in must not depend on remembering, transcribing or solving something without help such as pasting or a password manager. Memory tests lock out people with memory difficulties, dyslexia or difficulty with numbers."
failure_mode: cognition-and-clarity
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "3.3.8"
      name: Accessible Authentication (Minimum)
      level: AA
  heuristic:
    - "Nielsen: recognition rather than recall"
  ai_signature: "A one-time code is rendered on one screen and a bare text input is generated on the next, with no channel carrying the value across and no paste affordance."
surfaces: [flow, component]
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
  manual_test: "Log in using only a password manager and copy and paste, and check that any step asking you to remember, copy out by hand or solve something also offers another way through or help."
related: [faceup-vague-link-text, faceup-redundant-entry-multistep]
added: 2026-09-07
---

## What it looks like

A login shows a code on one screen and asks the person to type it from memory on the next, with pasting blocked.

```jsx
// Screen 1
<p>Your verification code is <strong>{code}</strong></p>
<button onClick={goToEntry}>Continue</button>

// Screen 2, no value carried across, paste disabled
<input
  name="otp"
  inputMode="numeric"
  autoComplete="off"
  onPaste={e => e.preventDefault()}
/>
```

```html
<!-- Screen 1 -->
<p>Your verification code is <strong>482913</strong></p>
<a href="/verify">Continue</a>

<!-- Screen 2, no value carried across, paste disabled -->
<input name="otp" inputmode="numeric" autocomplete="off" onpaste="return false">
```

## Why it fails

- People with memory difficulties, dyslexia or dyscalculia (difficulty with numbers), and people who rely on a password manager, cannot enter the code and are locked out.
- Fails WCAG 2.2 success criterion 3.3.8, Accessible Authentication (Minimum), Level AA.
- A memory or copying step still passes if there is another way through or something to help with it, and the W3C, which publishes WCAG, names password managers and copy and paste as help that counts.
- Tests that ask the person to recognise objects, or content they supplied themselves, are allowed.

## The fix

Let the field accept pasting and autofill so a password manager can fill in the code, or offer another way to log in.

```jsx
// Let the field accept paste and autofill, and label its purpose
<input
  name="otp"
  inputMode="numeric"
  autoComplete="one-time-code"
/>

// Better still, remove the transcription step entirely with a magic link
<a href={signInUrl}>Confirm sign in on this device</a>
```

```html
<!-- Let the field accept paste and autofill, and label its purpose -->
<input name="otp" inputmode="numeric" autocomplete="one-time-code">

<!-- Better still, remove the transcription step entirely with a magic link -->
<a href="/sign-in/confirm">Confirm sign in on this device</a>
```

The first example lets the device offer the code straight from the message it arrived in, while the second, a sign-in link, removes the need to remember anything.

## How it is detected

**What checks it today.**
- The Face Up skill reads the login flow across its screens for steps that depend on remembering, copying by hand or solving a puzzle, with no other way through and nothing to help.
- A code box that blocks pasting is a strong hint.
- A person confirms each finding, and findings never block a release.

**What it cannot catch.**
- Another way to log in that lies outside the code the skill read, which a person needs to check for.
- Whether a puzzle is an allowed test of recognising objects or the person's own content, which a person decides.

## Related rules

- `faceup-vague-link-text` - the login link does not say where it goes
- `faceup-redundant-entry-multistep` - information already given is asked for again
