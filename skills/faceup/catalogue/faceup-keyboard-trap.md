---
id: faceup-keyboard-trap
title: Keyboard focus gets stuck in a component
summary: "Keyboard focus must be able to leave every component it can enter. A trap cuts keyboard users off from the rest of the page, forcing a reload that loses whatever they typed."
failure_mode: focus-and-keyboard
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "2.1.2"
      name: No Keyboard Trap
      level: A
  heuristic:
    - "Nielsen: user control and freedom"
  ai_signature: "A focus-management handler keeps focus inside the widget but no branch releases it, because Escape and close were never part of the generated spec."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: false
detection:
  scanner: [browser]
  rendered: true
  agent: true
  human_review: false
  manual_test: "Tab into the control and keep pressing Tab. It fails if you circle through the same items and neither Tab, Shift+Tab nor Escape gets you out, or if a dialog does not return you to the page behind once you have tabbed through it and closed it."
related: [faceup-focus-not-visible, faceup-focus-order-jumps]
added: 2026-09-07
---

## What it looks like

A custom date picker keeps every Tab press inside it, and no key lets the person out.

```jsx
function DatePicker() {
  const grid = useRef(null)

  function onKeyDown(e) {
    if (e.key === 'Tab') {
      // keep focus inside the grid, always
      e.preventDefault()
      focusNextCell(grid.current)
    }
  }

  return <div ref={grid} onKeyDown={onKeyDown}>{/* day cells */}</div>
}
```

## Why it fails

- Keyboard users who tab in cannot reach the rest of the page, so they have to reload it and lose whatever they typed. People who use a switch device have no quick way to reload at all.
- Fails WCAG 2.2 success criterion 2.1.2, No Keyboard Trap, Level A.
- Because a trap blocks the whole page, WCAG requires this criterion whatever conformance level a site claims.

## The fix

Let Tab leave the picker, and make Escape close it and return focus to the button that opened it.

```jsx
function DatePicker({ onClose, triggerRef }) {
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      onClose()
      triggerRef.current.focus() // focus goes back where it came from
    }
    // Tab is left alone: focus can walk out naturally
  }

  return <div onKeyDown={onKeyDown}>{/* day cells */}</div>
}
```

A modal dialog, a pop-up that blocks the page behind it, may keep Tab inside while it is open, but when it closes, focus must return to the control that opened it.

## How it is detected

**What checks it today.**
- Given a page address, the scanner tabs through the page and reports a trap when Tab circles the same group of controls twice, the group is not a dialog, and Escape does not get out.
- If it runs out of time, it marks the rest of the page as not assessed.
- On 33 well-known sites in October 2026, the scanner reported no traps and manual testing found none either. So far it has caught traps only on test pages.
- The Face Up skill reads the code for key handlers that catch Tab with no way out, and for controls with no Escape to close them.
- Findings are for review.
- Common automated checkers miss traps, because a trap only shows when someone uses the page.

**What it cannot catch.**
- A trap in a picker or dialog that opens on a click, because the scanner tests the page only as first loaded.
- A loop that passes through an embedded frame, which is a page shown inside another page.
- A trap that depends on content, such as a calendar that loops only when it shows a single day.

## Related rules

- `faceup-focus-not-visible` - you cannot see where focus is
- `faceup-focus-order-jumps` - focus moves somewhere you did not ask it to go
