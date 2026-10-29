---
id: faceup-label-not-in-name
title: Spoken name differs from the visible label
summary: "A control's spoken name must contain the words shown on it. Voice control users say what they see, so a button labelled 'Send' but named 'Submit form' does not respond."
failure_mode: naming-and-semantics
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "2.5.3"
      name: Label in Name
      level: A
  heuristic: []
  ai_signature: "Model adds an aria-label to a control that already shows text, writing a longer or more formal description that drops or rewords the visible words."
surfaces: [component]
detectable_by:
  axe: true
  jsx_a11y: false
  wig: false
detection:
  scanner: [browser]
  rendered: true
  agent: true
  human_review: false
  manual_test: "Move a screen reader to each button, link and field that shows words, and check the name it reads out includes those visible words."
related: [faceup-control-missing-name, faceup-vague-link-text, faceup-generic-button-copy]
added: 2026-10-21
---

## What it looks like

A control shows one set of words, but `aria-label` (a name read out in place of the visible text) gives it different ones.

```jsx
<button type="submit" aria-label="Submit form">
  Send
</button>

<a href="/pricing" aria-label="View our plans and prices">
  Learn more
</a>
```

A sighted person sees "Send" and "Learn more", while a screen reader says "Submit form, button" and "View our plans and prices, link".

## Why it fails

- Voice control users say what they see, so "Click Send" does nothing, and screen reader users who can see the screen hear words that do not match what is shown.
- Fails WCAG 2.2 success criterion 2.5.3, Label in Name, Level A. The name must contain the visible text.
- Differences in capital letters and punctuation do not matter.
- Starting the name with the visible words is recommended.
- Icon-only controls are covered by `faceup-control-missing-name` instead.

## The fix

Remove the `aria-label` when the visible text already says what the control does.

```jsx
<button type="submit">Send</button>
```

If the name needs more detail, start it with the visible words.

```jsx
<button type="submit" aria-label="Send message">
  Send
</button>

<a href="/pricing">
  Learn more<span className="visually-hidden"> about pricing</span>
</a>
```

## How it is detected

**What checks it today.**
- Given a page address, the Face Up scanner reports buttons and links whose name leaves out their visible words, found by the `label-content-name-mismatch` check in axe, an automated testing tool.
- It passes a name that holds each block of visible text unbroken and in order, with more detail between, such as a score link named "Wed, 30 Sept, Final score, IAW 364 & 257" that shows "Wed, 30 Sept" and "364 & 257". Saying any of the visible words still reaches it.
- On a card with several blocks of text, such as a brand, a product name and "Shop now", it treats the largest text as the label and passes the card when its name holds that text. Visible text the control uses as its description is not treated as part of its label.
- The Face Up skill flags other controls whose `aria-label` or `aria-labelledby` leaves out the visible words, and form fields whose visible label differs from their name.
- A person confirms each finding.

**What it cannot catch.**
- Text that is built while the page runs, translated, or passed in from another component.
- Whether nearby text, such as a heading over a group of buttons, counts as a label, which is for a person to decide.

## Related rules

- `faceup-control-missing-name` - an icon-only control with no name at all
- `faceup-vague-link-text` - link text like "Learn more" that says nothing alone
- `faceup-generic-button-copy` - the visible label does not name the action
