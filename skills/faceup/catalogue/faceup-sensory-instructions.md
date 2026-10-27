---
id: faceup-sensory-instructions
title: Instructions rely on colour, shape or position
summary: "Instructions must name things by their label, not only by colour, shape or position, such as 'the green button'. Screen reader users cannot see these cues, and layouts often move things on smaller screens."
failure_mode: cognition-and-clarity
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "1.3.3"
      name: Sensory Characteristics
      level: A
    - criterion: "1.4.1"
      name: Use of Colour
      level: A
  heuristic: []
  ai_signature: "Generated help text, empty states and onboarding copy describe controls by their colour, shape or place in the layout, written against the mock-up the code was built from, with no mention of the control's label."
surfaces: [component, flow]
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
  manual_test: "Read every instruction on the page and check each names what it points to by its label or heading, beyond its colour, shape, size or position."
related: [faceup-generic-button-copy, faceup-vague-link-text, faceup-error-not-identified]
added: 2026-10-21
---

## What it looks like

The instructions identify controls by their colour and position and never by their names.

```jsx
<p>
  Fill in your details, then press the green button to continue.
  Need help? Use the round icon on the right.
</p>

<div className="actions">
  <button className="btn-green" type="submit">Save and continue</button>
</div>
<button className="help-fab" aria-label="Help">
  <HelpIcon aria-hidden="true" />
</button>
```

## Why it fails

- Screen reader users cannot tell which control is "the green button" or what sits "on the right", and colour-blind people may not see which button is green. On a phone, the help icon "on the right" moves to the bottom.
- Fails WCAG 2.2 success criterion 1.3.3, Sensory Characteristics, Level A, when instructions point to things only by colour, shape, size, position or sound.
- Fails WCAG 2.2 success criterion 1.4.1, Use of Colour, Level A, when colour is also the only thing on screen that sets the control apart.

## The fix

Name the control by its visible label, and add its look or position alongside if that helps.

```jsx
<p>
  Fill in your details, then select Save and continue.
  Need help? Use the Help button at the bottom right of the screen.
</p>
```

"The Help button at the bottom right" passes both criteria, because a person who cannot see the position can still find the button called Help.

## How it is detected

**What checks it today.**
- The Face Up skill reads help text, onboarding steps, empty states and error messages for words that describe looks or position: "green", "red", "round", "square", "on the left", "on the right", "above" and "below".
- When it finds one, it checks whether the same sentence also names the control by its label.
- A person confirms each finding, because these words often appear in instructions that are fine.
- The scanner does not check this rule, and no finding blocks a release.

**What it cannot catch.**
- Instructions inside images or video, or copy loaded from a content system when the page runs.
- Whether "below" points to the next thing in reading order, which people can follow. A person must judge this.

## Related rules

- `faceup-generic-button-copy` - a vague label does not help when named
- `faceup-vague-link-text` - link words do not say where they go
- `faceup-error-not-identified` - an error does not say which field or what to fix
