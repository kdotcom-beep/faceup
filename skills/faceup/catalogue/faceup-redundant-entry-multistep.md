---
id: faceup-redundant-entry-multistep
title: Form asks for information already given
summary: "A form should not ask for information the person has already given. Entering it twice costs people with motor impairments real effort and makes people with memory difficulties recall it again."
failure_mode: flow-and-memory
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "3.3.7"
      name: Redundant Entry
      level: A
  heuristic:
    - "Nielsen: recognition rather than recall"
  ai_signature: "Where it occurs, each step was generated independently and earlier field values are not threaded through to later steps. Not observed in a 2026-09 sample of 20 public wizards, so treat it as possible, not systematic."
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
  manual_test: "Go through the whole process and look for any later step that asks for something an earlier step collected without filling it in or offering to reuse it. Any such step fails."
related: [faceup-progress-not-shown-multistep, faceup-back-discards-data, faceup-autocomplete-missing]
added: 2026-09-07
---

## What it looks like

A checkout asks for an address in step two, then asks for it again in step five.

```jsx
// Step 2
<label htmlFor="delivery-street">Street address</label>
<input id="delivery-street" name="street-address" autoComplete="street-address" />
<label htmlFor="delivery-suburb">Suburb</label>
<input id="delivery-suburb" name="address-level2" autoComplete="address-level2" />
<label htmlFor="delivery-postcode">Postcode</label>
<input id="delivery-postcode" name="postal-code" autoComplete="postal-code" />

// Step 5, five components later, no memory of step 2
<label htmlFor="billing-street">Street address</label>
<input id="billing-street" name="street-address" autoComplete="street-address" />
<label htmlFor="billing-suburb">Suburb</label>
<input id="billing-suburb" name="address-level2" autoComplete="address-level2" />
<label htmlFor="billing-postcode">Postcode</label>
<input id="billing-postcode" name="postal-code" autoComplete="postal-code" />
```

## Why it fails

- People with motor impairments, and people who use switches or voice control, have to enter it all twice, while people with memory difficulties must recall details the site already holds.
- Fails WCAG 2.2 success criterion 3.3.7, Redundant Entry, Level A.
- A repeat that is needed, such as confirming a password, is not a failure.
- Nor is a question about someone else, such as an emergency contact or a referee.
- Nor is a repeat across separate processes, such as signing up and later applying.

## The fix

Carry the earlier answer forward and let the person change it.

```jsx
const [sameAsDelivery, setSame] = useState(true)

<label>
  <input type="checkbox" checked={sameAsDelivery}
         onChange={e => setSame(e.target.checked)} />
  Same as delivery address
</label>

{!sameAsDelivery && /* show billing only when it differs */ <BillingAddress />}
```

Any of these meets 3.3.7: filling in the earlier answer, offering to reuse it, or showing it for the person to confirm.

## How it is detected

**What checks it today.**
- The Face Up skill matches questions across the steps of one process by field name and autofill setting.
- It flags a repeated question that has no "same as" option, no filled-in value and no display of the earlier answer.
- An automatic check across 20 public multi-step forms flagged 13 repeats, and none was a real failure. Twelve asked for someone else's details or spanned separate processes, which is why a person reviews every finding.
- Findings never block a release.

**What it cannot catch.**
- A repeated question whose field has an unusual name and no autofill setting, because the skill matches questions by those.
- Whether a repeat is needed, which a person decides.

## Related rules

- `faceup-progress-not-shown-multistep` - you cannot tell where you are
- `faceup-back-discards-data` - going back throws away what you entered
- `faceup-autocomplete-missing` - missing autofill settings block reuse of the answer
