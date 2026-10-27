---
id: faceup-inconsistent-naming
title: Same action has a different name on each page
summary: "The button that saves changes says 'Save' on one page, 'Update' on the next and 'Submit' on a third. Give each action one name and use it everywhere."
failure_mode: flow-and-memory
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "3.2.4"
      name: Consistent Identification
      level: AA
  heuristic:
    - "Nielsen: consistency and standards"
  ai_signature: "Each page's controls generated in isolation, so the same action picks up a different verb, icon or aria-label wherever it appears."
surfaces: [component, route]
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
  manual_test: "Find controls that do the same thing on different pages, such as a save button or a search icon, and check that they use the same words and icons each time."
related: [faceup-consistent-help, faceup-generic-button-copy]
added: 2026-10-21
---

## What it looks like

The same save button has a different name on each settings page.

```jsx
// Profile
<button type="submit">Save</button>

// Address
<button type="submit">Update</button>

// Notifications
<button type="submit">Submit</button>
```

Icon buttons can drift out of sight: the search button's hidden name, which screen readers read out, is "Search" on one page and "Find" on another.

```jsx
// Home
<button type="button" aria-label="Search" onClick={openSearch}>
  <SearchIcon aria-hidden="true" />
</button>

// Help centre
<button type="button" aria-label="Find" onClick={openSearch}>
  <SearchIcon aria-hidden="true" />
</button>
```

## Why it fails

- People with memory or cognitive disabilities read a new word as a new action, and voice control and screen reader users cannot find the control by the name they used before.
- Fails WCAG 2.2 success criterion 3.2.4, Consistent Identification, Level AA, which covers visible labels, icons and names read by screen readers.
- Consistent does not mean identical, so "Save profile" and "Save address" count as consistent.
- Controls with different functions are outside this criterion.

## The fix

Give each action one name, and build repeated actions as a shared component so every page uses the same one.

```jsx
function SearchButton({ onClick }) {
  return (
    <button type="button" aria-label="Search" onClick={onClick}>
      <SearchIcon aria-hidden="true" />
    </button>
  );
}
```

For actions on different things, keep the verb and add the object.

```jsx
// Profile
<button type="submit">Save profile</button>

// Address
<button type="submit">Save address</button>

// Notifications
<button type="submit">Save notifications</button>
```

## How it is detected

**What checks it today.**
- The Face Up skill compares controls across pages and groups those that run the same code, send data to the same place, or share an icon.
- It flags groups whose names differ.
- Findings never block a release.

**What it cannot catch.**
- Whether two controls really do the same thing, which a person decides. "Submit application" and "Save draft" may rightly differ.
- Names set from data or translations, which appear only in the browser.

## Related rules

- `faceup-consistent-help` - the help link moves on each page
- `faceup-generic-button-copy` - the label does not name the action at all
