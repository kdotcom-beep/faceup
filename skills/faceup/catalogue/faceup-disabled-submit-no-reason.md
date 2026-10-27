---
id: faceup-disabled-submit-no-reason
title: Disabled submit button gives no reason
summary: "A submit button should not be disabled without saying what still needs doing. People are left hunting for the problem, keyboard users cannot reach the button, and some give up."
failure_mode: input-and-forms
tier: 2
severity: ux-failure
anchor:
  wcag: []
  heuristic:
    - "Nielsen: help users recognise, diagnose, and recover from errors"
    - "Nielsen: visibility of system status"
  ai_signature: "Submit button gets disabled={!isValid} with no message naming which fields are missing or invalid."
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
  manual_test: "Leave a required field empty or wrong and confirm the page says what is missing while the submit button is greyed out."
related: [faceup-error-not-identified, faceup-premature-validation, faceup-placeholder-as-label]
added: 2026-09-07
---

## What it looks like

The Create account button stays greyed out until every field is correct, and nothing says what is left.

```jsx
function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isValid = email.includes("@") && password.length >= 8;

  return (
    <form>
      <label htmlFor="email">Email</label>
      <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" disabled={!isValid}>Create account</button>
    </form>
  );
}
```

## Why it fails

- People hunt for what is missing, and some give up. Keyboard users may never reach the button, because Tab skips disabled controls, and screen reader users hear "dimmed" with no explanation.
- This is not a WCAG failure, but it fails two Nielsen heuristics: visibility of system status, and help users recognise, diagnose, and recover from errors.

## The fix

Keep the button working, and when someone presses it, list what to fix in an alert that screen readers read out.

```jsx
function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);

  function handleSubmit(e) {
    e.preventDefault();
    const found = [];
    if (!email.includes("@")) found.push("Enter a valid email address.");
    if (password.length < 8) found.push("Password must be at least 8 characters.");
    setErrors(found);
    if (found.length === 0) createAccount({ email, password });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors.length > 0 && (
        <div role="alert">
          <p>Fix the following to continue:</p>
          <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
        </div>
      )}
      <label htmlFor="email">Email</label>
      <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Create account</button>
    </form>
  );
}
```

If the button must stay disabled, show what is missing next to each field.

## How it is detected

**What checks it today.**
- The Face Up skill looks for a submit button that stays disabled until the form is valid, then checks for text naming what is missing.
- Findings never block a release.

**What it cannot catch.**
- Help text placed elsewhere on the page, which the skill cannot always find.
- Whether the help text is clear and names the missing fields.

## Related rules

- `faceup-error-not-identified` - an error that is not named in text
- `faceup-premature-validation` - validation fires before the field is finished
- `faceup-placeholder-as-label` - guidance vanishes once the user types
