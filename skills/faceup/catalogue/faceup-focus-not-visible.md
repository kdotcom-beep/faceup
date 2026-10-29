---
id: faceup-focus-not-visible
title: Keyboard focus outline is missing
summary: "Whatever has keyboard focus must show a visible outline. Without it, keyboard and switch users cannot tell where they are or what pressing Enter will do."
failure_mode: focus-and-keyboard
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "2.4.7"
      name: Focus Visible
      level: AA
    - criterion: "2.4.13"
      name: Focus Appearance
      level: AAA
  heuristic:
    - "Nielsen: visibility of system status"
  ai_signature: "Reset stylesheet strips the default outline for looks, and no :focus-visible rule is generated to replace it."
surfaces: [css]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: true
detection:
  scanner: [code, browser]
  rendered: true
  agent: false
  human_review: false
  manual_test: "Press Tab through the page and check that you can always see where you are."
related: [faceup-div-as-button, faceup-focus-obscured-sticky, faceup-focus-order-jumps]
added: 2026-09-07
---

## What it looks like

The site's styles remove the browser's focus outline, the ring that marks whichever control the keyboard is on, and put nothing in its place.

```css
/* "cleaning up" the default outlines */
*:focus {
  outline: none;
}

button,
a,
input {
  outline: 0;
}
```

When someone presses Tab, the focused control looks exactly like every other control on the page.

## Why it fails

- People who navigate with a keyboard or a switch device lose track of where they are, so they press Enter without knowing what it will activate.
- Fails WCAG 2.2 success criterion 2.4.7, Focus Visible, Level AA.

## The fix

Give keyboard focus a clear, strongly coloured outline. You can still hide it when someone clicks with a mouse.

```css
/* no ring on mouse click */
:focus:not(:focus-visible) {
  outline: none;
}

/* clear ring on keyboard focus, for every focusable element */
:focus-visible {
  outline: 3px solid #1a56db;
  outline-offset: 2px;
}
```

To meet success criterion 2.4.13, Focus Appearance, Level AAA, make the outline at least 2 pixels thick all the way round, with a contrast of at least 3:1 between the same pixels in their focused and unfocused states.

## How it is detected

**What checks it today.**
- The scanner finds styles that remove the focus outline with nothing to replace it.
- In a browser, it tabs through the page and reports controls that look exactly the same with and without focus.
- Text fields that may show focus only through the blinking text cursor are left for a person to check.
- On 33 well-known sites tested in October 2026, 6 of its 7 findings were real problems.
- Findings go to a person to confirm.

**What it cannot catch.**
- Whether a replacement outline is strong enough to see.
- Custom switches and checkboxes whose real input is hidden.
- Cases where the order of style rules or another component decides the result, which are left for a person.

## Related rules

- `faceup-div-as-button` - a fake button the keyboard can never reach
- `faceup-focus-obscured-sticky` - a sticky header or bar hides the outline
- `faceup-focus-order-jumps` - focus jumps somewhere unexpected
