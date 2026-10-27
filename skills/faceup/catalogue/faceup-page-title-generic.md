---
id: faceup-page-title-generic
title: Page title is the same on every view
summary: "Every page or view needs its own title describing what it is. Screen reader users hear the title first, and people with many tabs open use it to tell pages apart."
failure_mode: flow-and-memory
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "2.4.2"
      name: Page Titled
      level: A
  heuristic: []
  ai_signature: "Default scaffold title never wired to route changes. Every view renders under the same generated placeholder such as \"React App\"."
surfaces: [route]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: true
detection:
  automatic: false
  scanner: [browser]
  rendered: true
  agent: false
  human_review: false
  manual_test: "Move between at least two pages of the app and read the browser tab after each one, checking that the title changes to describe the page you are on."
related: [faceup-heading-order, faceup-lang-missing, faceup-redundant-entry-multistep]
added: 2026-09-07
---

## What it looks like

The page title, which names the browser tab and the history entry, stays as the template's placeholder on every view.

```html
<title>React App</title>
```

```jsx
function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/invoices/:id" element={<Invoice />} />
    </Routes>
  );
}
```

## Why it fails

- Screen reader users hear "React App" on arrival and learn nothing about the page, and people with many tabs open, or with memory difficulties, cannot tell pages apart.
- Fails WCAG 2.2 success criterion 2.4.2, Page Titled, Level A, because each view is a separate page to the person using it.

## The fix

Give every view its own descriptive title.

```jsx
function useDocumentTitle(title) {
  useEffect(() => {
    document.title = `${title} - Acme`;
  }, [title]);
}

function Invoice() {
  const { id } = useParams();
  useDocumentTitle(`Invoice ${id}`);
  return <InvoiceView id={id} />;
}
```

Put the part that changes first, so it still shows when the tab is narrow. Screen readers do not announce a change of title, so also move keyboard focus to the new view's heading.

## How it is detected

**What checks it today.**
- The scanner opens each page address it is given and flags placeholder titles such as "React App" or "Vite App", as well as missing titles, which it finds using axe (a widely used testing tool).
- When given several addresses, it also flags pages that share a title.
- The code check is switched off, because it knows only a fixed list of placeholders and missed one in testing.

**What it cannot catch.**
- Pages it is not given, or whether a title actually describes its page.
- One fixed title on every screen, unless two addresses are checked together.
- axe on its own flags only a missing or empty title, so it passes "React App".

## Related rules

- `faceup-heading-order` - headings that skip levels or run out of order
- `faceup-lang-missing` - the page has no valid language code
- `faceup-redundant-entry-multistep` - information already given is asked for again
