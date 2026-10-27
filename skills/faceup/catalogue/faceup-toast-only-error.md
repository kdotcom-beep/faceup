---
id: faceup-toast-only-error
title: Error appears only in a pop-up that is not announced
summary: "A save error appears in a small corner pop-up that screen readers do not announce. Put the message in an announcement area that stays on the page."
failure_mode: feedback-and-status
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "4.1.3"
      name: Status Messages
      level: AA
  heuristic: []
  ai_signature: "A hand-built toast, or a library toast rendered through its custom-markup escape hatch, appears on error with no role=\"status\", role=\"alert\" or aria-live. Major toast libraries announce by default, so the failure appears where that default is bypassed."
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
  manual_test: "Turn on a screen reader and cause the error. The page fails if the message is not read out."
related: [faceup-async-status-not-announced, faceup-error-not-identified]
added: 2026-09-07
---

## What it looks like

A save error appears in a small pop-up in the corner of the screen, known as a toast, which is not marked to be read out.

```jsx
function SaveForm() {
  const [error, setError] = useState('')

  async function onSubmit(event) {
    event.preventDefault()
    try {
      await save(new FormData(event.currentTarget))
    } catch {
      setError('Could not save. Try again.')
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {/* fields */}
      <button type="submit">Save</button>
      {error && <div className="toast toast--error">{error}</div>}
    </form>
  )
}
```

## Why it fails

- Screen reader users hear nothing, assume the save worked, and lose their work.
- Fails WCAG 2.2 success criterion 4.1.3, Status Messages, Level AA, because assistive technology, such as a screen reader, is not told about the message unless focus moves to it.

## The fix

Keep an announcement area on the page at all times and change only the text inside it.

```jsx
function SaveForm() {
  const [error, setError] = useState('')

  async function onSubmit(event) {
    event.preventDefault()
    try {
      await save(new FormData(event.currentTarget))
      setError('')
    } catch {
      setError('Could not save. Try again.')
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {/* fields */}
      <button type="submit">Save</button>
      <div role="alert" className="toast-region">
        {error && <div className="toast toast--error">{error}</div>}
      </div>
    </form>
  )
}
```

The area stays on the page because some screen readers miss one that appears at the same moment as its text. If you use a library's standard toast, it already announces itself, so do not add a second announcement beside it.

## How it is detected

**What checks it today.**
- The Face Up skill reads the code for messages shown after an error or change that sit outside any announcement area, and for custom pop-ups that skip a library's built-in announcement.
- Standard toasts from popular libraries are not flagged.
- A person confirms each finding, and no finding blocks a release.

**What it cannot catch.**
- Whether the message is actually read out when the page runs, since even a correctly built area can stay silent if it is added in a way screen readers miss.
- Whether a message should interrupt the person or wait for a pause, which is a judgement call.

## Related rules

- `faceup-async-status-not-announced` - loading and success states are shown but never announced
- `faceup-error-not-identified` - the error text exists but is not tied to its field
