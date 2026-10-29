---
id: faceup-heading-order
title: Heading levels skip or run out of order
summary: "Heading levels should step down one at a time to match the page's structure. Screen reader users treat headings as a map, so a skipped level suggests a missing section."
failure_mode: naming-and-semantics
tier: 1
severity: ux-failure
anchor:
  wcag: []
  heuristic:
    - "W3C WAI Tutorials, Page Structure, Headings: skipping heading ranks can be confusing and should be avoided where possible"
surfaces: [component]
detectable_by:
  axe: true
  jsx_a11y: false
  wig: true
detection:
  scanner: [code, browser]
  rendered: true
  agent: false
  human_review: false
  manual_test: "List the headings in order with their levels and check that no level is skipped and each one sits under the right parent."
related: [faceup-div-as-button, faceup-control-missing-name, faceup-redundant-entry-multistep]
added: 2026-09-07
---

## What it looks like

Heading levels were picked for size, so the page jumps from level 1 to level 3 and Billing drops to level 5.

```html
<h1>Account settings</h1>

<h3>Profile</h3>
<p>Your public details.</p>

<h3>Notifications</h3>
<p>Choose what we email you.</p>

<h5>Billing</h5>
<p>Manage your plan and payment method.</p>
```

Nothing on screen shows that the levels are wrong.

## Why it fails

- Screen reader users rely on heading levels as a map of the page, so a skipped level suggests a missing section and Billing at level 5 sounds as though it sits inside Notifications.
- This is a usability failure and does not fail WCAG. Axe, a widely used testing tool, lists its heading order check as good practice.
- The rule is based on the W3C's tutorial on headings, which says skipping levels can be confusing and should be avoided where possible.

## The fix

Choose each heading's level by where it sits in the page, and set its size with styles.

```html
<h1>Account settings</h1>

<h2>Profile</h2>
<p>Your public details.</p>

<h2>Notifications</h2>
<p>Choose what we email you.</p>

<h2>Billing</h2>
<p>Manage your plan and payment method.</p>
```

```css
h1 { font-size: 2rem; }
h2 { font-size: 1.1rem; }
```

Levels step down one at a time, so if Billing later gains sections of its own, those become level 3.

## How it is detected

**What checks it today.**
- The Face Up scanner reports a jump down of more than one level within a component (a reusable piece of the page) or HTML file, and an HTML page with no level 1 heading.
- It marks the spot as not assessed when another component sits between two headings, or a component's first heading is level 3 or lower, because the missing level may come from elsewhere.
- Given a page address, the scanner also runs axe, which reports jumps and a missing level 1 heading on the live page.
- Findings are for review.

**What it cannot catch.**
- A level with no gap that is still wrong, such as two sections at level 2 when one belongs inside the other.
- Heading text that makes no sense.

## Related rules

- `faceup-div-as-button` - a plain box standing in for a real button
- `faceup-control-missing-name` - a control with no name for a screen reader
- `faceup-redundant-entry-multistep` - details already given are asked for again
