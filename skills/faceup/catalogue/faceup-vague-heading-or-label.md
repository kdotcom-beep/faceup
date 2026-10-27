---
id: faceup-vague-heading-or-label
title: Heading or label says nothing about what follows
summary: "Headings such as 'Details' or 'Section 1' and labels such as 'Value' do not say what each part is for. Name each section's topic and each field's purpose."
failure_mode: cognition-and-clarity
tier: 3
severity: failure
anchor:
  wcag:
    - criterion: "2.4.6"
      name: Headings and Labels
      level: AA
  heuristic:
    - "Nielsen: match between system and the real world"
    - "Nielsen: recognition rather than recall"
  ai_signature: "Headings and labels are copied from component, variable or schema names, such as 'Details', 'Section 1' or 'Value', where the prompt did not say what each section or field holds."
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
  human_review: true
  manual_test: "Read each heading and field label on its own, without the content around it, and reword any that do not say what the section covers or what the field wants."
related: [faceup-heading-order, faceup-placeholder-as-label, faceup-page-title-generic]
added: 2026-10-21
---

## What it looks like

Headings such as "Details" and labels such as "Value" do not say what they cover.

```jsx
<main>
  <h1>Settings</h1>
  <section aria-labelledby="s1">
    <h2 id="s1">Details</h2>
    <label htmlFor="limit">Value</label>
    <input id="limit" type="number" />
    <label htmlFor="card">Type</label>
    <select id="card">{/* card options */}</select>
  </section>
  <section aria-labelledby="s2">
    <h2 id="s2">Section 2</h2>
    {/* invoice settings */}
  </section>
</main>
```

## Why it fails

- Screen reader users hear headings and labels out of context, where "Details" and "Value" tell them nothing, and anyone scanning the page is left guessing too.
- Fails WCAG 2.2 success criterion 2.4.6, Headings and Labels, Level AA, which requires headings and labels to describe their topic or purpose.
- Short headings and labels, such as "Billing", pass.
- The criterion does not require headings or labels to exist, so missing labels fall under other criteria.
- Button and link wording have their own Face Up rules.

## The fix

Name each section's topic and each field's purpose, in your users' words.

```jsx
<main>
  <h1>Billing settings</h1>
  <section aria-labelledby="payment">
    <h2 id="payment">Payment method</h2>
    <label htmlFor="limit">Monthly spending limit (AUD)</label>
    <input id="limit" type="number" />
    <label htmlFor="card">Card type</label>
    <select id="card">{/* card options */}</select>
  </section>
  <section aria-labelledby="invoices">
    <h2 id="invoices">Invoices</h2>
    {/* invoice settings */}
  </section>
</main>
```

## How it is detected

**What checks it today.**
- The Face Up skill flags headings and field labels that name no topic, such as "Details", "Info", "Section 1", "Value", "Field" or "Untitled". It also flags the same text repeated across headings at the same level.
- Neither the Face Up scanner nor common automated checkers test it.
- A person confirms each finding, and no finding blocks a release.

**What it cannot catch.**
- Whether a heading or label is clear to the product's users.
- "Details" can be fine under a heading that already names the topic.
- A short technical term can suit a specialist audience.

## Related rules

- `faceup-heading-order` - heading levels skip and break the page outline
- `faceup-placeholder-as-label` - grey hint text is the only label and vanishes on typing
- `faceup-page-title-generic` - every view keeps the same page title
