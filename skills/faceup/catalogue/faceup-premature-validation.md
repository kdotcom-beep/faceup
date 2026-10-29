---
id: faceup-premature-validation
title: Field shows an error before typing is finished
summary: "A field should not be checked until the person has finished with it. Errors shown while typing tell people they are wrong when they are not, and screen readers may announce them at every keystroke."
failure_mode: input-and-forms
tier: 2
severity: ux-failure
anchor:
  heuristic:
    - "Nielsen: error prevention"
    - "Luke Wroblewski, Inline Validation in Web Forms (A List Apart, 2009): check a field after the person leaves it, not while they type"
  ai_signature: "Validation wired directly to onChange so the field is marked invalid on the first character, before any blur or submit."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: false
detection:
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "Click into an empty required field and type one character. The field fails if it is marked as wrong before you leave it or submit the form."
related: [faceup-placeholder-as-label, faceup-autocomplete-missing, faceup-redundant-entry-multistep]
added: 2026-09-07
---

## What it looks like

An email field checks itself on every keystroke and shows an error as soon as the first letter is typed.

```jsx
const [email, setEmail] = useState("")
const invalid = !/^[^@]+@[^@]+\.[^@]+$/.test(email)

<label htmlFor="email">Email address</label>
<input id="email" type="email" value={email}
       onChange={e => setEmail(e.target.value)}
       aria-invalid={invalid}
       aria-describedby={invalid ? "email-error" : undefined} />
{invalid && <p id="email-error" className="error">Invalid email</p>}
```

The label and error are fine. The fault is the timing, because the field cannot tell an unfinished address from a wrong one.

## Why it fails

- People are told they are wrong while they are doing the task correctly, which is especially hard on people with anxiety or attention difficulties. A screen reader may also read the error out on every keystroke.
- This is not a WCAG failure, but it fails the Nielsen heuristic error prevention and goes against established form guidance to check a field when the person leaves it or submits the form.

## The fix

Check the field when the person first leaves it. After that, the check can update as they type, so they see the error clear as soon as they fix it.

```jsx
const [email, setEmail] = useState("")
const [touched, setTouched] = useState(false)
const invalid = touched && !/^[^@]+@[^@]+\.[^@]+$/.test(email)

<label htmlFor="email">Email address</label>
<input id="email" type="email" value={email}
       onChange={e => setEmail(e.target.value)}
       onBlur={() => setTouched(true)}
       aria-invalid={invalid}
       aria-describedby={invalid ? "email-error" : undefined} />
{invalid && <p id="email-error" className="error">Enter an email like name@example.com</p>}
```

WCAG 2.2 success criterion 3.3.1, Error Identification, covers how a real error is described, and says nothing about when to decide one exists.

## How it is detected

**What checks it today.**
- The Face Up skill reads the code for fields that are checked on every keystroke and show an error without waiting for the person to leave the field or submit the form.

**What it cannot catch.**
- Whether the error really appears at the first character, which shows only when the page runs.
- Fields that check as you type for a good reason, such as a password strength meter that never blocks. These look the same in the code, so a person has to rule them out.

## Related rules

- `faceup-placeholder-as-label` - the label vanishes while the error appears
- `faceup-autocomplete-missing` - browser autofill can trigger the check early
- `faceup-redundant-entry-multistep` - both punish the person for the form's own shortcomings
