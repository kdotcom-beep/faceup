---
id: faceup-fake-heading-or-list
title: Heading or list is only styled text
summary: "Text looks like a heading or list because of bold, large type or bullet characters, but the code has no heading or list element. Use real heading and list elements, then style them."
failure_mode: naming-and-semantics
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "1.3.1"
      name: Info and Relationships
      level: A
  heuristic: []
  ai_signature: "Section titles built from a div or p with a bold or large text class, and lists built from stacked divs or paragraphs that start with a bullet character or typed number."
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
  manual_test: "Open a screen reader's list of headings and check that every piece of text that looks like a heading appears in it, then check that every list on screen is announced as a list with the right number of items."
related: [faceup-heading-order, faceup-div-as-button, faceup-control-missing-name]
added: 2026-10-21
---

## What it looks like

A section title and a bulleted list are plain boxes styled to look like a heading and a list.

```jsx
<div className="text-xl font-bold">Your plan</div>
<div className="feature">• 10 projects</div>
<div className="feature">• 5 team members</div>
<div className="feature">• Email support</div>
```

## Why it fails

- Screen reader users who jump between headings never reach "Your plan", and they hear the features as separate lines, with no list and no item count.
- Fails WCAG 2.2 success criterion 1.3.1, Info and Relationships, Level A, which requires structure that people can see in the layout to also be in the code, or in the text.
- A jump from heading level 1 to level 3 does not fail this criterion, and `faceup-heading-order` covers it separately.

## The fix

Use real heading and list elements, then style them.

```jsx
<h2 className="text-xl font-bold">Your plan</h2>
<ul className="features">
  <li>10 projects</li>
  <li>5 team members</li>
  <li>Email support</li>
</ul>
```

Choose the heading level to match where the section sits in the page. If you hide the bullets with `list-style: none`, add `role="list"` to the `ul` so that VoiceOver, Apple's screen reader, still announces a list in Safari.

## How it is detected

**What checks it today.**
- The Face Up skill looks for bold or large text in a plain element (`div`, `span` or `p`) that opens a section with no heading element.
- It looks for lines starting with a bullet, dash or typed number outside a real list (`ul`, `ol` or `li`).
- A person confirms each finding, and findings never block a release.
- The scanner does not check this rule.

**What it cannot catch.**
- Whether a large bold line opens a section or is a pull quote or callout that should stay plain text, which a person must judge.

## Related rules

- `faceup-heading-order` - heading levels skip or run out of order
- `faceup-div-as-button` - a plain box standing in for a button
- `faceup-control-missing-name` - a control with no name to read out
