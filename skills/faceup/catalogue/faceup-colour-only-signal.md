---
id: faceup-colour-only-signal
title: Colour alone marks an error or a link
summary: "Colour must not be the only way to show an error, a link or a state. Colour-blind people may not see the difference, so they miss the error or cannot find the link."
failure_mode: feedback-and-status
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "1.4.1"
      name: Use of Colour
      level: A
    - criterion: "3.3.1"
      name: Error Identification
      level: A
  heuristic:
    - "Nielsen: visibility of system status"
  ai_signature: "Generated styles mark an invalid field only by switching its border colour, and reset styles remove the underline from every link with text-decoration: none and give body-text links a colour change alone."
surfaces: [css, component]
detectable_by:
  axe: true
  jsx_a11y: false
  wig: false
detection:
  automatic: false
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "Turn on your device's greyscale colour filter and check you can still tell which fields have errors and which words in a paragraph are links."
related: [faceup-error-not-identified, faceup-nontext-contrast, faceup-vague-link-text]
added: 2026-10-21
---

## What it looks like

An error shows only as a red border, and links in the terms have no underline.

```jsx
<input
  id="email"
  type="email"
  className={emailInvalid ? "field field--error" : "field"}
/>

<p className="terms">
  By signing up you agree to our <a href="/terms">terms</a> and{" "}
  <a href="/privacy">privacy policy</a>.
</p>
```

```css
.field { border: 1px solid #8a8a8a; }
.field--error { border-color: #d32f2f; }

a { color: #1e40af; text-decoration: none; }
```

## Why it fails

- Colour-blind people may miss the red border and not know which field to fix, and links that look like plain text leave people unable to find the terms.
- Fails WCAG 2.2 success criterion 1.4.1, Use of Colour, Level A. Colour can be one signal but must not be the only one.
- An error shown only by colour also fails WCAG 2.2 success criterion 3.3.1, Error Identification, Level A, which needs the error described in words.
- The W3C accepts colour alone for links in a paragraph only with at least 3:1 contrast against the text around them.
- An underline only on hover or keyboard focus does not count.
- Links in a menu or navigation bar are fine, because their position shows they are links.

## The fix

Add an error message in words, linked to the field, and underline links in body text.

```jsx
<input
  id="email"
  type="email"
  className={emailInvalid ? "field field--error" : "field"}
  aria-invalid={emailInvalid}
  aria-describedby={emailInvalid ? "email-error" : undefined}
/>
{emailInvalid && (
  <p id="email-error" className="field-error">
    <ErrorIcon aria-hidden="true" /> Enter an email address with an @ symbol.
  </p>
)}
```

```css
.field--error { border: 2px solid #d32f2f; }

p a {
  text-decoration: underline;
}
```

The thicker border adds a cue that does not rely on colour, and the message says how to fix the error.

## How it is detected

**What checks it today.**
- The Face Up skill finds error and status states that change only a colour.
- It finds links in paragraphs with the underline removed and no other cue.
- A person confirms each finding, and findings never block a release.
- The scanner does not check this rule. Its browser check runs axe, an automated testing tool, and lists any low-contrast links in text that axe flags outside the Face Up catalogue.

**What it cannot catch.**
- Whether something else, such as a message elsewhere, makes the state clear.
- Charts, maps and status badges where colour carries meaning.

## Related rules

- `faceup-error-not-identified` - the error is unlinked or does not say how to fix it
- `faceup-nontext-contrast` - borders and controls too close to the background colour
- `faceup-vague-link-text` - link words do not say where it goes
