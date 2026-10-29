---
id: faceup-back-discards-data
title: Going back clears what the person entered
summary: "Going back a step in a form should keep everything the person has already entered. Losing it forces them to retype finished work, which costs switch and voice control users every character twice."
failure_mode: flow-and-memory
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "3.3.7"
      name: Redundant Entry
      level: A
  heuristic:
    - "Nielsen: user control and freedom"
  ai_signature: "Each step owns its state in isolation. Navigating away unmounts the step and its values are never lifted or persisted, so returning re-mounts an empty form."
surfaces: [flow, route]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: false
detection:
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "Fill in a step, go back to an earlier step, then return and confirm what you entered is still there."
related: [faceup-redundant-entry-multistep, faceup-progress-not-shown-multistep, faceup-consistent-help]
added: 2026-09-07
---

## What it looks like

Each step of a booking form keeps its own answers, so going back to an earlier step wipes them.

```jsx
// Step 2 owns its own state and nothing else holds it
function ContactStep({ goBack, goNext }) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  return (
    <section>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" value={email} onChange={e => setEmail(e.target.value)} />
      <label htmlFor="phone">Phone</label>
      <input id="phone" name="phone" value={phone} onChange={e => setPhone(e.target.value)} />
      <button onClick={goBack}>Back</button>
      <button onClick={() => goNext({ email, phone })}>Next</button>
    </section>
  )
}
```

## Why it fails

- People who go back, with the form's button or the browser's, have to retype a step they had already finished. For switch and voice control users, that means paying for every character twice.
- Fails WCAG 2.2 success criterion 3.3.7, Redundant Entry, Level A, because the form asks again for information already given and neither fills it in nor offers it as a choice.
- Also fails the Nielsen heuristic user control and freedom, because going back is a normal way to recover from a mistake.

## The fix

Store the answers for the whole process in one place above the individual steps, so they survive as the person moves back and forth.

```jsx
// One store for the whole flow, above every step
const [answers, setAnswers] = useState({ email: '', phone: '' })

function ContactStep({ answers, setAnswers, goBack, goNext }) {
  return (
    <section>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" value={answers.email}
             onChange={e => setAnswers(a => ({ ...a, email: e.target.value }))} />
      <label htmlFor="phone">Phone</label>
      <input id="phone" name="phone" value={answers.phone}
             onChange={e => setAnswers(a => ({ ...a, phone: e.target.value }))} />
      <button onClick={goBack}>Back</button>
      <button onClick={goNext}>Next</button>
    </section>
  )
}
```

## How it is detected

**What checks it today.**
- The Face Up skill reads the flow and reports any step whose answers live only inside it and are lost on the way back, including through the browser's Back button.
- When testing manually, try the browser's Back button as well as the form's own.

**What it cannot catch.**
- Answers cleared on purpose because they no longer apply, such as an expired delivery time. These are allowed, but a person needs to judge each one.
- A field not kept for security reasons, such as a password, which is not a failure.

## Related rules

- `faceup-redundant-entry-multistep` - information already given is asked for again
- `faceup-progress-not-shown-multistep` - no sign of where you are in the process
- `faceup-consistent-help` - help moves between screens
