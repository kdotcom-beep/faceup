---
id: faceup-context-change-on-input
title: Changing a field opens a new page
summary: "Changing a field's value must not load a new page or make another major change without warning. Keyboard users browsing a list with the arrow keys can be sent away before they have chosen."
failure_mode: input-and-forms
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "3.2.2"
      name: On Input
      level: A
  heuristic: []
  ai_signature: "A select, radio or checkbox onChange handler calls router.push, window.location or form.submit as soon as the value changes, with no confirm step or advance warning."
surfaces: [component]
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
  manual_test: "Using only the keyboard, change each dropdown list, radio button and checkbox, and confirm that none of them takes you to another page, sends the form or reloads the page without warning you first."
related: [faceup-back-discards-data, faceup-premature-validation, faceup-autocomplete-missing]
added: 2026-09-07
---

## What it looks like

Picking a region from a dropdown list loads a new page straight away, with no Go button and no warning.

```jsx
<select
  onChange={(e) => {
    window.location.href = `/region/${e.target.value}`;
  }}
>
  <option value="">Choose a region</option>
  <option value="au">Australia</option>
  <option value="nz">New Zealand</option>
</select>
```

A radio button that sends the form, or a checkbox that reloads the page, causes the same problem.

## Why it fails

- Keyboard and screen reader users move through the options with the arrow keys, and in some browsers, including those on Windows, the first arrow press changes the value and loads the Australia page.
- On a Mac, or when the list is open, the change usually waits until the person confirms a choice, but the page cannot tell which behaviour its visitor will get.
- Fails WCAG 2.2 success criterion 3.2.2, On Input, Level A, which says that changing a value must not cause a major change, such as loading a new page, unless the person was warned first.

## The fix

Let the person make their choice, then act on it with a separate Go button.

```jsx
function RegionPicker() {
  const [region, setRegion] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (region) window.location.href = `/region/${region}`;
      }}
    >
      <label htmlFor="region">Region</label>
      <select id="region" value={region} onChange={(e) => setRegion(e.target.value)}>
        <option value="">Choose a region</option>
        <option value="au">Australia</option>
        <option value="nz">New Zealand</option>
      </select>
      <button type="submit">Go</button>
    </form>
  );
}
```

Acting on change is allowed if a text warning comes before the control, but a Go button removes the need for one. Success criterion 3.2.1, On Focus, Level A, covers the same kind of change when the person merely moves onto a control, and the fix is the same.

## How it is detected

**What checks it today.**
- The Face Up skill reads the code for dropdowns, radio buttons and checkboxes that change page or send the form when changed.
- A person confirms each finding, because the code may act only in some cases, or a warning may sit elsewhere on the page.
- Findings never block a release.

**What it cannot catch.**
- Whether a real warning came first, and whether the person would expect the change.

## Related rules

- `faceup-back-discards-data` - leaving the page throws away what was entered
- `faceup-premature-validation` - a field reacts before the person has finished
- `faceup-autocomplete-missing` - fields the browser cannot fill in
