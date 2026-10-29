---
id: faceup-lang-missing
title: Page language is not set
summary: "Every page must declare the language it is written in. Without it, screen readers guess, often wrongly, and read every word with the wrong pronunciation."
failure_mode: naming-and-semantics
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "3.1.1"
      name: Language of Page
      level: A
  heuristic: []
surfaces: [component]
detectable_by:
  axe: true
  jsx_a11y: true
  wig: false
detection:
  scanner: [browser]
  rendered: true
  agent: false
  human_review: false
  manual_test: "View the page source and check that the opening html tag has a lang value, such as en-AU, that matches the language the page is written in."
related: [faceup-heading-order, faceup-page-title-generic, faceup-control-missing-name]
added: 2026-09-07
---

## What it looks like

The page does not say what language it is in.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Weekly report</title>
  </head>
  <body>
    <h1>Weekly report</h1>
    <p>Revenue rose four per cent against the previous quarter.</p>
  </body>
</html>
```

An invalid value, such as "english" or "AU", fails the same way.

```html
<html lang="english">
```

## Why it fails

- Screen readers fall back to the device's language, which is often the wrong one, and mispronounce every word.
- Fails WCAG 2.2 success criterion 3.1.1, Language of Page, Level A.
- An invalid value fails too, because the browser cannot read it.

## The fix

Add a valid language code to the `html` tag, such as "en-AU" for Australian English.

```html
<!DOCTYPE html>
<html lang="en-AU">
  <head>
    <title>Weekly report</title>
  </head>
  <body>
    <h1>Weekly report</h1>
    <p>Revenue rose four per cent against the previous quarter.</p>
  </body>
</html>
```

A passage in another language needs its own code under WCAG 2.2 success criterion 3.1.2, Language of Parts, Level AA.

```html
<p>The motto is <span lang="fr">liberté, égalité, fraternité</span>.</p>
```

## How it is detected

**What checks it today.**
- Given a page address, the scanner's browser check uses axe, an automated testing tool, to report a missing, empty or invalid code. Other common checkers report this too.
- The scanner's code check is switched off, because in testing it only flagged an unused leftover file.

**What it cannot catch.**
- Whether the language is right, since a French page labelled as English passes.
- Passages in another language, covered by criterion 3.1.2, which need their own check.

## Related rules

- `faceup-heading-order` - headings that skip levels or run out of order
- `faceup-page-title-generic` - a page title that never changes between views
- `faceup-control-missing-name` - a control that screen readers announce with no name
