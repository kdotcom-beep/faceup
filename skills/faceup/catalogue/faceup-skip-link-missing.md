---
id: faceup-skip-link-missing
title: No way to skip past the menu
summary: "Every page starts with a long menu that keyboard users cannot jump past. Add a skip link that jumps to the main content, and wrap that content in a main element."
failure_mode: focus-and-keyboard
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "2.4.1"
      name: Bypass Blocks
      level: A
  heuristic:
    - "Nielsen: flexibility and efficiency of use"
  ai_signature: "A shared layout is generated from div wrappers with the navigation first, with no skip link, no main element and no heading marking where the content starts."
surfaces: [route]
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
  manual_test: "Load a page, press Tab once, and confirm that a skip link appears and that pressing Enter on it moves you past the menu."
related: [faceup-focus-obscured-sticky, faceup-focus-not-visible, faceup-heading-order]
added: 2026-10-21
---

## What it looks like

Every page starts with 30 menu links, followed by content that has no heading.

```jsx
function Layout({ children }) {
  return (
    <div className="page">
      <div className="nav">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
      </div>
      <div className="content">{children}</div>
    </div>
  )
}
```

## Why it fails

- Keyboard and switch users have to step through 30 links on every page, and screen reader users have no landmark (a labelled page region) or heading to jump to.
- Fails WCAG 2.2 success criterion 2.4.1, Bypass Blocks, Level A, because nothing lets people skip the repeated menu.
- Not a failure: a page with a skip link, landmarks such as a main element, or headings at the start of each section, since the W3C accepts any of these.

## The fix

Make a skip link the first thing on the page, and wrap the content in a main element.

```jsx
function Layout({ children }) {
  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <header>
        <nav aria-label="Main">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>
      </header>
      <main id="main" tabIndex={-1}>{children}</main>
    </>
  )
}
```

The skip link can stay hidden until a keyboard user reaches it, but it must then appear on screen. It helps sighted keyboard users, who usually have no way to jump between landmarks.

## How it is detected

**What checks it today.**
- The Face Up skill reads the shared layout for a skip link, main element and headings, and checks the skip link's target exists.
- The scanner does not check this rule. axe, a widely used testing tool, has a `bypass` rule, but it leaves these pages for a person to review, and the scanner does not report those results.
- No finding blocks a release.

**What it cannot catch.**
- Whether the skip link appears and moves focus, which neither the skill nor axe tests.
- A page that passes with landmarks alone can still be slow for sighted keyboard users.

## Related rules

- `faceup-focus-obscured-sticky` - a pinned header covers the control the keyboard lands on
- `faceup-focus-not-visible` - you cannot see where keyboard focus is
- `faceup-heading-order` - heading levels skip and break the page outline
