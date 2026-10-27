---
id: faceup-vague-link-text
title: Link text does not say where it goes
summary: "Link text must say where the link goes, not just 'click here' or 'read more'. Screen reader users often hear links listed out of context, where vague links all sound the same."
failure_mode: cognition-and-clarity
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "2.4.4"
      name: Link Purpose (In Context)
      level: A
  heuristic:
    - "Nielsen: recognition rather than recall"
  ai_signature: "Link text generated as a fixed call to action phrase, decoupled from the destination it points at."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: true
  wig: false
detection:
  automatic: false
  scanner: [code]
  rendered: false
  agent: false
  human_review: false
  manual_test: "Read each link's words on their own. If you cannot tell where the link goes or what it does, read the sentence around it, and fail the link only if that does not make it clear either."
related: [faceup-generic-button-copy, faceup-cognitive-auth-test]
added: 2026-09-07
---

## What it looks like

None of these links say where they go.

```jsx
<p>Our refund terms changed this month. <a href="/refunds">Read more</a></p>
<p>To update your plan, <a href="/billing">click here</a>.</p>
<a href="/report.pdf">Learn more</a>
```

The first two meet WCAG because their sentences explain them. The bare "Learn more" does not.

## Why it fails

- Screen reader users often move through a list of the page's links, taken out of their sentences, where every "read more" and "click here" sounds alike. People with attention difficulties also scan link words first.
- Fails WCAG 2.2 success criterion 2.4.4, Link Purpose (In Context), Level A, when neither the link words nor the sentence, list item or heading around them say where it goes.
- A link explained by its sentence meets 2.4.4 but still hinders people moving through a list of links.

## The fix

Put the destination in the link words.

```jsx
<p>Our refund terms changed this month. <a href="/refunds">Read the updated refund terms</a>.</p>
<p><a href="/billing">Update your plan</a></p>
<a href="/report.pdf">Download the 2026 report (PDF)</a>
```

These links meet 2.4.4 without relying on context, and they also meet the stricter success criterion 2.4.9, Link Purpose (Link Only), Level AAA.

## How it is detected

**What checks it today.**
- The Face Up scanner compares every link's words with a list: "click here", "read more", "learn more", "here", "more" and "this link". It ignores capitals, extra spaces and arrows.
- A link's `aria-label` counts as its words. A link named by `aria-labelledby` is skipped.
- Link words that are only known when the page runs are listed as not assessed.
- Findings are for review and never block a release, because the sentence around a link can explain it.
- It checks links only, as 2.4.4 does. Vague button words belong to `faceup-generic-button-copy`.

**What it cannot catch.**
- Whether the sentence or heading around a link explains it, so a flagged link may still pass 2.4.4.

## Related rules

- `faceup-generic-button-copy` - a button whose words do not name what it does
- `faceup-cognitive-auth-test` - a login control whose words do not say where it leads
