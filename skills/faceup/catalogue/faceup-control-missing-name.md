---
id: faceup-control-missing-name
title: Button or link has no name
summary: "An icon-only button or link has no name, so a screen reader announces only 'button' or 'link'. Add a name that is read out, with aria-label or text hidden on screen."
failure_mode: naming-and-semantics
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "4.1.2"
      name: Name, Role, Value
      level: A
    - criterion: "2.4.4"
      name: Link Purpose (In Context)
      level: A
  heuristic: []
  ai_signature: "Icon-only button or link with an SVG or glyph inside and no aria-label, visually hidden text or title, so it has a role but no name."
surfaces: [component]
detectable_by:
  axe: true
  jsx_a11y: true
  wig: true
detection:
  automatic: true
  scanner: [code, browser]
  rendered: true
  agent: false
  human_review: false
  manual_test: "Move through the buttons and links with a screen reader on, and treat any that say only 'button' or 'link' as having no name."
related: [faceup-div-as-button, faceup-vague-link-text, faceup-aria-references-missing-id]
added: 2026-09-07
---

## What it looks like

A button and a link each show only an icon, so neither has a name.

```jsx
<button type="button" onClick={openSearch}>
  <SearchIcon aria-hidden="true" />
</button>

<a href="/cart">
  <CartIcon aria-hidden="true" />
</a>
```

A screen reader announces them only as "button" and "link".

## Why it fails

- Screen reader users must press the control to learn what it does, and voice control users cannot say its name.
- Fails WCAG 2.2 success criterion 4.1.2, Name, Role, Value, Level A.
- The link also fails WCAG 2.2 success criterion 2.4.4, Link Purpose (In Context), Level A.
- This rule does not cite 1.1.1, Non-text Content, because the icon is rightly hidden from screen readers and needs no description of its own.

## The fix

Add a name with `aria-label`, which is read out but not shown, or with text that is hidden on screen but still read out.

```jsx
<button type="button" onClick={openSearch} aria-label="Search">
  <SearchIcon aria-hidden="true" />
</button>

<a href="/cart" aria-label="Cart">
  <CartIcon aria-hidden="true" />
</a>
```

If a control also shows text, success criterion 2.5.3, Label in Name, Level A, requires its name to include that text.

## How it is detected

**What checks it today.**
- The Face Up scanner reports buttons and links in the code that have no name.
- Any of these counts as a name: text inside the control, aria-label, aria-labelledby, title, alt text on an image, an SVG title or a hidden-text component.
- Button and Link components also pass when given a label or title setting. An icon on its own never counts.
- A finding can fail a build.
- Given a page address, it also runs axe, a widely used testing tool, on the live page and reports nameless controls for review.

**What it cannot catch.**
- A wrong name, such as "button". A person has to judge whether the name describes the action.
- An aria-labelledby that points at missing text.
- Controls whose settings or content come from another component, which the scanner marks as not assessed.

## Related rules

- `faceup-div-as-button` - a plain element that software does not recognise as a control
- `faceup-vague-link-text` - a name that says nothing useful, like "click here"
- `faceup-aria-references-missing-id` - a name borrowed from text that does not exist
