---
id: faceup-orientation-locked
title: Page only works upright or sideways
summary: "The page hides its content and asks people to rotate their device, or locks itself to one direction. Let the layout work both upright and sideways."
failure_mode: state-and-edge-cases
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "1.3.4"
      name: Orientation
      level: AA
  heuristic: []
  ai_signature: "Generated mobile layouts add an orientation media query that hides the app behind a 'rotate your device' overlay, call screen.orientation.lock(), or set a fixed orientation in the web app manifest."
surfaces: [css, route]
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
  manual_test: "Open the page on a phone or tablet and turn it between upright and sideways, checking that the content stays usable both ways and that no message asks you to turn the device."
related: [faceup-reflow-horizontal-scroll, faceup-pointer-gesture-no-alternative, faceup-target-too-small]
added: 2026-10-21
---

## What it looks like

A booking app hides everything behind a "rotate your device" message when the phone turns sideways.

```css
.rotate-notice {
  display: none;
}

@media (orientation: landscape) and (max-height: 500px) {
  .app {
    display: none;
  }
  .rotate-notice {
    display: flex;
  }
}
```

```jsx
<>
  <div className="app">{children}</div>
  <div className="rotate-notice">
    <p>Please rotate your device to portrait.</p>
  </div>
</>
```

Locking the orientation in a script, or in an installed app's settings file, fails the same way.

## Why it fails

- People with a device on a fixed mount or stand cannot turn it, and some people with low vision turn theirs sideways to get larger text.
- Fails WCAG 2.2 success criterion 1.3.4, Orientation, Level AA.
- It is not a failure when one orientation is essential, as it is for a piano app, a cheque deposit or virtual reality. A booking form has no such need.

## The fix

Remove the overlay and the lock, and let the layout adapt to a short, wide screen.

```css
.app {
  display: grid;
  gap: 1rem;
}

@media (orientation: landscape) and (max-height: 500px) {
  .app {
    gap: 0.5rem;
  }
  .app-header {
    position: static;
  }
}
```

```jsx
<div className="app">{children}</div>
```

Remove any lock in a script or the app's settings file unless the content needs one orientation, and if it does, say why on the page.

## How it is detected

**What checks it today.**
- The Face Up skill finds styles that hide content or show a rotate message in one orientation, script locks, and a fixed orientation in the app's settings file.
- It also finds layouts rotated to fake the other orientation.
- A person confirms each finding, because orientation styles often only adjust the layout. Findings never block a release.
- The scanner does not check this rule, and the orientation check in axe, a widely used testing tool, is experimental and off by default.

**What it cannot catch.**
- Whether one orientation is essential.
- Whether a sideways layout is too cramped to use.

## Related rules

- `faceup-reflow-horizontal-scroll` - content breaks when narrow or zoomed
- `faceup-pointer-gesture-no-alternative` - another movement some people cannot make
- `faceup-target-too-small` - small controls, worse in a cramped sideways layout
