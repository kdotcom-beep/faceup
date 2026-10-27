---
id: faceup-nav-order-changes
title: Menu order changes from page to page
summary: "Menus that repeat across pages must keep their links in the same order. People learn where links sit, so keyboard users who count Tab presses land on the wrong one when the order changes."
failure_mode: flow-and-memory
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "3.2.3"
      name: Consistent Navigation
      level: AA
  heuristic:
    - "Nielsen: consistency and standards"
  ai_signature: "Each page's navigation generated in isolation, or sorted so the current page's link moves to the front, so the same links appear in a different order across pages."
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
  manual_test: "Visit several pages and compare the menus that repeat on each. Check that links appearing on more than one page stay in the same order, unless you changed it yourself."
related: [faceup-consistent-help, faceup-page-title-generic]
added: 2026-10-21
---

## What it looks like

Two pages show the same menu links in a different order.

```jsx
// Home
<nav aria-label="Main">
  <a href="/products">Products</a>
  <a href="/pricing">Pricing</a>
  <a href="/blog">Blog</a>
  <a href="/contact">Contact</a>
</nav>

// Pricing, same site, same links in a different order
<nav aria-label="Main">
  <a href="/pricing">Pricing</a>
  <a href="/products">Products</a>
  <a href="/contact">Contact</a>
  <a href="/blog">Blog</a>
</nav>
```

Re-sorting one shared list on each page, for example to put the current page first or to order links by popularity, has the same effect.

## Why it fails

- People learn where a link sits, so a keyboard user who knows Contact is fourth presses Tab four times and lands on Blog. People with low vision or memory difficulties have to reread the menu on every page.
- Fails WCAG 2.2 success criterion 3.2.3, Consistent Navigation, Level AA, which requires repeated menus to keep the same relative order unless the person changes it.
- A page may add or remove links, such as a sub-menu, as long as the repeated links keep their order.
- A menu that the person reorders or expands is also allowed.

## The fix

Build every menu from one shared list, and mark the current page in place.

```jsx
const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

function MainNav({ currentPath }) {
  return (
    <nav aria-label="Main">
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-current={link.href === currentPath ? "page" : undefined}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
```

## How it is detected

**What checks it today.**
- The Face Up skill compares menus across pages and layouts in the code, and flags shared links that appear in a different order or code that re-sorts the list for each page.
- Added or missing links are not reported.
- No finding blocks a release.

**What it cannot catch.**
- Menus built from data when the page loads, such as from a content system or a personalised list, whose order only shows in the browser.
- Whether the person chose the order, for example through a saved preference, which a person must confirm.

## Related rules

- `faceup-consistent-help` - the help link moves between pages
- `faceup-page-title-generic` - the page title never changes between views
