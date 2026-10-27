---
id: faceup-async-status-not-announced
title: Loading and saving status is not announced
summary: "Status changes such as 'Saving' and 'Saved' must be announced to screen readers, not only shown on screen. Without the announcement, screen reader users cannot tell whether their action worked."
failure_mode: feedback-and-status
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "4.1.3"
      name: Status Messages
      level: AA
  heuristic: []
  ai_signature: "An async handler flips a loading flag that swaps button text or shows a spinner, with no live region carrying the state change."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: true
detection:
  automatic: false
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "With a screen reader on, press the save button, stay on it, and confirm you hear \"Saving\", then \"Saved\"."
related: [faceup-toast-only-error, faceup-error-not-identified]
added: 2026-09-07
---

## What it looks like

A save button shows a spinner with "Saving..." and then "Saved", but none of this is read aloud.

```jsx
function SaveButton({ onSave }) {
  const [status, setStatus] = useState('idle')

  async function handleClick() {
    if (status === 'saving') return
    setStatus('saving')
    await onSave()
    setStatus('saved')
  }

  return (
    <button onClick={handleClick} aria-disabled={status === 'saving'}>
      {status === 'saving' && <Spinner />}
      {status === 'idle' && 'Save'}
      {status === 'saving' && 'Saving...'}
      {status === 'saved' && 'Saved'}
    </button>
  )
}
```

## Why it fails

- A screen reader reads a button only once, when the person reaches it, so someone who presses Save hears nothing and either presses again or waits.
- Screen magnifier users may not have the button in view when it changes.
- Fails WCAG 2.2 success criterion 4.1.3, Status Messages, Level AA.

## The fix

Put the status text in an announcement area, a part of the page that screen readers read out whenever its text changes.

```jsx
function SaveButton({ onSave }) {
  const [status, setStatus] = useState('idle')

  const label = {
    idle: '',
    saving: 'Saving',
    saved: 'Saved',
  }[status]

  async function handleClick() {
    if (status === 'saving') return
    setStatus('saving')
    await onSave()
    setStatus('saved')
  }

  return (
    <>
      <button onClick={handleClick} aria-disabled={status === 'saving'}>
        {status === 'saving' && <Spinner aria-hidden="true" />}
        {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : 'Save'}
      </button>
      <span role="status" aria-live="polite" className="visually-hidden">
        {label}
      </span>
    </>
  )
}
```

The spinner is hidden from screen readers because the text already carries the message. While saving, the button ignores further presses but stays enabled, because a disabled button can lose keyboard focus.

## How it is detected

**What checks it today.**
- The Face Up skill finds background actions, such as a save, and checks that the on-screen changes they cause sit inside an announcement area.
- A progress bar counts only when an announcement area reads its progress out.
- A person confirms each finding, and findings never block a release.

**What it cannot catch.**
- Whether the update is actually read out when the page runs. An area that starts empty and is filled later is read out, but one added with its text already inside may not be.
- Automated page scanners miss this too, because the change happens after the page loads.

## Related rules

- `faceup-toast-only-error` - an error pop-up is never read out
- `faceup-error-not-identified` - error text is not connected to its field
