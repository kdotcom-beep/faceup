---
id: faceup-missing-loading-state
title: Nothing shows while data loads
summary: "While data is on its way, the page shows nothing to say it is loading. Show a clear loading message, and make sure screen readers announce it too."
failure_mode: state-and-edge-cases
tier: 1
severity: ux-failure
anchor:
  wcag: []
  heuristic:
    - "Nielsen: visibility of system status"
  ai_signature: "The fetch is rendered as if data is always present. No pending branch is generated between request and response."
surfaces: [component, route]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: false
detection:
  automatic: false
  scanner: [code]
  rendered: false
  agent: true
  human_review: false
  manual_test: "Slow the connection in the browser's developer tools, reload the page, and confirm a loading message or placeholder appears while the data loads."
related: [faceup-missing-empty-state, faceup-missing-error-branch]
added: 2026-09-07
---

## What it looks like

A page fetches data and shows a blank area, or the old content, while it waits.

```jsx
function Profile({ userId }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(setUser)
  }, [userId])

  return (
    <section>
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
    </section>
  )
}
```

On a slow connection, the page stays empty for seconds.

## Why it fails

- People cannot tell whether the app is working, so they tap again, reload, leave, or act on old details, while screen reader users get no signal at all.
- This is not a WCAG failure, but it fails Jakob Nielsen's usability heuristic, visibility of system status.

## The fix

Track when data is loading, and show a message in a status area that screen readers read out.

```jsx
function Profile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoading(true)
    setFailed(false)
    fetch(`/api/users/${userId}`)
      .then(r => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`)
        return r.json()
      })
      .then(setUser)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [userId])

  let message = ''
  if (loading) message = 'Loading profile…'
  else if (failed) message = 'We could not load this profile.'

  return (
    <section>
      <p role="status">{message}</p>
      {!loading && !failed && user && (
        <>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </>
      )}
    </section>
  )
}
```

The status area is on the page from the start because screen readers often ignore one that arrives with text already in it. A skeleton, a placeholder shaped like the content, also works if it looks different from the empty and loaded states. Handling a failed load is covered in `faceup-missing-error-branch`.

## How it is detected

**What checks it today.**
- The scanner and skill find data requests that never track loading.
- The scanner checks React components that load data with `useQuery` or `useSWR`, or with `fetch`, axios, Supabase, ky or got called inside `useEffect`.
- It treats loading as handled if the component uses a loading flag or state, a spinner, skeleton or progress component, or the word "Loading".
- A person reviews the rest, and findings never block a release.

**What it cannot catch.**
- Requests made elsewhere, such as in a click handler.
- Requests that are fast on the test computer but slow for real users.
- Whether the message appears soon enough, or a skeleton matches its content.

## Related rules

- `faceup-missing-empty-state` - nothing shown when there is no data
- `faceup-missing-error-branch` - nothing shown when loading fails
