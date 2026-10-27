---
id: faceup-consistent-help
title: Help is in a different place on each page
summary: "Help links and contact details should sit in the same place on every page. People who found help once look for it there again, and people with cognitive disabilities rely on that consistency."
failure_mode: flow-and-memory
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "3.2.6"
      name: Consistent Help
      level: A
  heuristic:
    - "Nielsen: consistency and standards"
  ai_signature: "Each page layout generated in isolation, so the help link's relative position drifts and it is dropped where the page felt full."
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
  manual_test: "Visit several pages that offer help and check that the help link or button appears in the same order relative to the rest of the page each time."
related: [faceup-redundant-entry-multistep, faceup-progress-not-shown-multistep, faceup-back-discards-data]
added: 2026-09-07
---

## What it looks like

The help link is in the header on one page, in the footer on the next, and missing on checkout.

```jsx
// Home
<header>
  <nav>{/* links */}</nav>
  <a href="/support">Help</a>
</header>

// Pricing, same site, help moved to the footer
<footer>
  <a href="/support">Contact support</a>
</footer>

// Checkout, help dropped altogether: a usability problem, not a 3.2.6 failure
<header>
  <nav>{/* links, no help affordance */}</nav>
</header>
```

## Why it fails

- People who found help in the header look there again and conclude the site has none, and people with cognitive disabilities rely on things staying where they were.
- Fails WCAG 2.2 success criterion 3.2.6, Consistent Help, Level A, when help that repeats across pages changes its order relative to the rest of the page.
- According to the W3C, leaving help off some pages is not a failure, although a checkout with no help is still a usability problem under the consistency and standards heuristic.

## The fix

Put the help link in one shared layout that every page uses, checkout included.

```jsx
// One layout wraps every page; help sits in a fixed relative slot
function PageLayout({ children }) {
  return (
    <>
      <header>
        <nav>{/* links */}</nav>
        <a href="/support">Help</a>
      </header>
      <main>{children}</main>
      <SiteFooter />
    </>
  )
}

// Every route renders through the same layout
<PageLayout><Pricing /></PageLayout>
<PageLayout><Checkout /></PageLayout>
```

## How it is detected

**What checks it today.**
- The Face Up skill compares pages that offer help and flags any page where help moves relative to the repeated header, navigation and footer.
- A page with no help is noted as a usability issue and never counted as a 3.2.6 failure.
- Findings never block a release.

**What it cannot catch.**
- Whether two help links offer the same kind of help, which a person must judge.
- Whether a page can reasonably go without help, which is also a judgement for a person.

## Related rules

- `faceup-redundant-entry-multistep` - information already given is asked for again
- `faceup-progress-not-shown-multistep` - you cannot tell where you are in the process
- `faceup-back-discards-data` - going back throws away what you entered
