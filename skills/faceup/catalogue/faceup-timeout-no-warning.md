---
id: faceup-timeout-no-warning
title: Session times out with no warning
summary: "The session signs the person out after a set time, discarding their answers without warning. Warn them first and let them extend it with one action."
failure_mode: flow-and-memory
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "2.2.1"
      name: Timing Adjustable
      level: A
  heuristic:
    - "Nielsen: error prevention"
  ai_signature: "A time limit is generated with setTimeout that calls signOut or clears form state when it expires, with no warning step and no way to reset the timer from the interface."
surfaces: [flow]
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
  manual_test: "Start a form and leave it untouched until the time limit runs out, then check that you were warned first and given at least 20 seconds to keep going with one button, or that you could turn off or lengthen the limit beforehand."
related: [faceup-back-discards-data, faceup-redundant-entry-multistep, faceup-async-status-not-announced]
added: 2026-10-21
---

## What it looks like

A grant application signs the person out after 15 minutes and loses their answers.

```jsx
function ApplicationForm() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      signOut()
      navigate('/sign-in')
    }, 15 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [navigate])

  return <form>{/* long set of questions */}</form>
}
```

Nothing on screen mentions the limit or warns before it ends.

## Why it fails

- Screen reader users, careful readers and anyone fetching a document can go 15 minutes without a keypress, and they lose everything when the limit ends.
- Fails WCAG 2.2 success criterion 2.2.1, Timing Adjustable, Level A.
- To pass, people must be able to turn the limit off, lengthen it to at least ten times the default, or extend it when warned, with at least 20 seconds to do so in one action and at least ten extensions allowed.
- Real-time events, such as an auction, are exempt.
- So are limits that are essential to the activity, and limits longer than 20 hours.

## The fix

Warn two minutes before time runs out, and give the person one button to reset the timer.

```jsx
const LIMIT = 15 * 60 * 1000
const WARNING = 2 * 60 * 1000

function SessionTimeout() {
  const [warning, setWarning] = useState(false)
  const [started, setStarted] = useState(Date.now())

  useEffect(() => {
    const warn = setTimeout(() => setWarning(true), LIMIT - WARNING)
    const end = setTimeout(() => signOut(), LIMIT)
    return () => {
      clearTimeout(warn)
      clearTimeout(end)
    }
  }, [started])

  if (!warning) return null

  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="timeout-title">
      <h2 id="timeout-title">You will be signed out in 2 minutes</h2>
      <button
        autoFocus
        onClick={() => {
          refreshSession()
          setWarning(false)
          setStarted(Date.now())
        }}
      >
        Stay signed in
      </button>
    </div>
  )
}
```

Saving answers as the person goes limits the damage. At Level AAA, success criterion 2.2.5, Re-authenticating, goes further and requires the data to be kept after the person signs back in.

## How it is detected

**What checks it today.**
- The Face Up skill finds timers that sign out, clear the form or change page, then looks for a warning and a way to extend or turn off the limit.
- Neither the scanner nor common automated checkers test this.
- Findings never block a release.

**What it cannot catch.**
- Whether a limit is essential or part of a real-time event.
- Limits set only on the server, such as an expiring sign-in.

## Related rules

- `faceup-back-discards-data` - going back throws away what the person entered
- `faceup-redundant-entry-multistep` - information already given is asked for again
- `faceup-async-status-not-announced` - a status change is never announced to screen readers
