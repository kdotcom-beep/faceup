---
id: faceup-single-way-to-page
title: Only one way to reach a page
summary: "Every page must be reachable in at least two ways, such as a menu and a search or site map. Deep menus are hard for people with cognitive disabilities and slow for screen reader users."
failure_mode: flow-and-memory
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "2.4.5"
      name: Multiple Ways
      level: AA
  heuristic:
    - "Nielsen: flexibility and efficiency of use"
  ai_signature: "Model generates a multi-page site reachable only through a nested menu, with no search, site map, table of contents or related links."
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
  manual_test: "Pick a page deep in the site that is not a step in a process like checkout, and look for a second way to reach it, such as search, a site map or a related link."
related: [faceup-nav-order-changes, faceup-consistent-help, faceup-page-title-generic]
added: 2026-10-21
---

## What it looks like

Help articles are reachable only through a deep menu, with no search, site map or related links.

```jsx
function SiteNav() {
  return (
    <nav aria-label="Main">
      <ul>
        <li>
          <button type="button" aria-expanded={open} onClick={toggle}>
            Guides
          </button>
          {open && (
            <ul>
              <li>
                <a href="/guides/billing">Billing</a>
                {/* Billing opens Invoices, Invoices opens each article */}
              </li>
            </ul>
          )}
        </li>
      </ul>
    </nav>
  );
}

function Article({ article }) {
  return (
    <main>
      <h1>{article.title}</h1>
      {article.body}
    </main>
  );
}
```

## Why it fails

- People with cognitive disabilities struggle to hold a deep menu in mind, and screen reader users move through it slowly.
- Fails WCAG 2.2 success criterion 2.4.5, Multiple Ways, Level AA.
- Search, a site map, a table of contents, related links or a list of all pages each count as a second way.
- On a small site, a menu on every page that links to every page, home page included, is enough on its own: W3C says those links also serve as a site map. A menu that lists only the main sections is one way.
- Steps in a process and their results, such as checkout or a confirmation page, are exempt.
- A one-page site is exempt, because the criterion covers sets of pages.

## The fix

Keep the menu and add a site map link and related links, plus search on larger sites.

```jsx
function SiteFooter() {
  return (
    <footer>
      <a href="/sitemap">Site map</a>
    </footer>
  );
}

function SiteMap({ sections }) {
  return (
    <main>
      <h1>Site map</h1>
      {sections.map((section) => (
        <section key={section.href} aria-labelledby={section.id}>
          <h2 id={section.id}>
            <a href={section.href}>{section.title}</a>
          </h2>
          <ul>
            {section.pages.map((page) => (
              <li key={page.href}>
                <a href={page.href}>{page.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

function Article({ article }) {
  return (
    <main>
      <h1>{article.title}</h1>
      {article.body}
      <h2>Related articles</h2>
      <ul>
        {article.related.map((page) => (
          <li key={page.href}>
            <a href={page.href}>{page.title}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Build the site map from the same page list as the menu, so new pages appear in both.

## How it is detected

**What checks it today.**
- The Face Up skill checks the list of pages and the shared layouts for search, a site map, a table of contents or related links.
- It lists pages reachable only through the menu, skipping process steps.
- A person confirms each finding. Findings never block a release.

**What it cannot catch.**
- Pages and links loaded from a content system while the site runs.
- Whether a page is a process step, or whether search finds every page.

## Related rules

- `faceup-nav-order-changes` - the menu order changes between pages
- `faceup-consistent-help` - the help link moves between pages
- `faceup-page-title-generic` - the page title does not say which page you are on
