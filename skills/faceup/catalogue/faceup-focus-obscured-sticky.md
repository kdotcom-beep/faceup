---
id: faceup-focus-obscured-sticky
title: Sticky header hides the focused control
summary: "A header pinned to the top of the screen covers the field the keyboard has moved to. Tell the browser to leave a gap the height of the header when it scrolls."
failure_mode: focus-and-keyboard
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "2.4.11"
      name: Focus Not Obscured (Minimum)
      level: AA
    - criterion: "2.4.12"
      name: Focus Not Obscured (Enhanced)
      level: AAA
  heuristic:
    - "Nielsen: visibility of system status"
  ai_signature: "A sticky header and an in-page scroll target are generated independently. Nothing sets scroll-padding to reserve room for the fixed layer."
surfaces: [component, css]
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
  manual_test: "Scroll part way down, press Shift+Tab to move back through the controls, and follow each link to another part of the page, taking a screenshot at each stop. It fails if a header, footer or cookie bar that stays on screen completely covers the focused control."
related: [faceup-focus-not-visible, faceup-keyboard-trap, faceup-skip-link-missing]
added: 2026-09-07
---

## What it looks like

A header pinned to the top of the screen can cover the field the keyboard has moved to.

```css
header {
  position: sticky;
  top: 0;
  height: 72px;
  z-index: 10;
}

/* nothing reserves the 72px the header occupies */
html {
  scroll-behavior: smooth;
}
```

Going back with Shift+Tab, or following a link to a section of the page, can land the field under the header.

## Why it fails

- Keyboard users and people with low vision lose sight of where they are and type into a hidden field.
- Fails WCAG 2.2 success criterion 2.4.11, Focus Not Obscured (Minimum), Level AA, when the field is completely hidden.
- Fails WCAG 2.2 success criterion 2.4.12, Focus Not Obscured (Enhanced), Level AAA, when any part is hidden.

## The fix

Tell the browser to leave a gap the height of the header when it scrolls.

```css
header {
  position: sticky;
  top: 0;
  height: 72px;
  z-index: 10;
}

html {
  scroll-behavior: smooth;
  /* stop scrolling short of the header, so focus lands in the clear */
  scroll-padding-top: 72px;
}
```

Keeping the full header height clear also meets the Level AAA version.

## How it is detected

**What checks it today.**
- Given a page address, the Face Up scanner tabs through the page in a window 1280 by 800 pixels. It reports any focused control fully covered by a solid pinned bar, such as a header, cookie bar or promotion.
- See-through layers do not count, and controls under an embedded frame are left for a person.
- On 33 well-known sites tested in October 2026, all 7 findings were real, mostly cookie bars and promotions.
- The Face Up skill checks that a bar pinned to an edge has a matching gap on that side.
- Findings are for review and never fail a build.

**What it cannot catch.**
- Partly covered controls, moving back with Shift+Tab, links within the page, and other window sizes.
- A header whose height changes after the page loads.

## Related rules

- `faceup-focus-not-visible` - the keyboard outline is removed entirely
- `faceup-keyboard-trap` - the keyboard reaches a control but cannot leave it
- `faceup-skip-link-missing` - no way to jump past the repeated header
