---
id: faceup-missing-error-branch
title: Failed data load shows no error
summary: "The page plans only for data loading successfully, so a failure leaves a spinner that never stops or a blank area. Show a specific error and a way to try again."
failure_mode: state-and-edge-cases
tier: 1
severity: ux-failure
anchor:
  wcag: []
  heuristic:
    - "Nielsen: help users recognise, diagnose, and recover from errors"
  ai_signature: "Only the resolved promise path is handled. The rejected path has no catch and no error state, so a failed request renders nothing or the empty state. Observed 2026-09 in two public Lovable-built apps: 122 of 153 and 39 of 94 data-fetching components had no error branch, and neither app had a global query error handler."
surfaces: [component, route]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: true
detection:
  automatic: false
  scanner: [code]
  rendered: false
  agent: true
  human_review: false
  manual_test: "Make the data fail to load, for example by turning off the network, and confirm an error message appears with a way to try again."
related: [faceup-missing-loading-state, faceup-missing-empty-state]
added: 2026-09-07
---

## What it looks like

A page asks the server for data and plans only for success.

```jsx
function Orders() {
  const [orders, setOrders] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => { setOrders(data); setLoading(false) })
  }, [])

  if (loading) return <p role="status">Loading orders…</p>

  return <OrderList orders={orders} />
}
```

If the request fails, the loading message never clears.

A more common version shows the empty message when the request fails.

```jsx
function Referrals() {
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('referrals').select('*')
      if (error) throw error
      return data
    },
  })

  if (isLoading) return <p role="status">Loading referrals…</p>
  if (referrals.length === 0) return <p>No referrals yet.</p>

  return <ReferralList referrals={referrals} />
}
```

The person reads "No referrals yet.", a confident wrong answer that is worse than a blank area.

## Why it fails

- When a request fails, people wait on a spinner that never stops or read a wrong message, with no way to try again.
- It breaks Jakob Nielsen's heuristic "help users recognise, diagnose, and recover from errors", which makes it a usability failure rather than a WCAG one.
- On a form, also check WCAG 2.2 success criterion 3.3.1, Error Identification, Level A, although Face Up does not claim a pass or fail against it here.

## The fix

Track when loading fails, show a specific message, and offer a way to try again.

```jsx
function Orders() {
  const [orders, setOrders] = useState(null)
  const [status, setStatus] = useState('loading')

  const load = useCallback(() => {
    setStatus('loading')
    fetch('/api/orders')
      .then(r => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`)
        return r.json()
      })
      .then(data => { setOrders(data); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [])

  useEffect(() => { load() }, [load])

  if (status === 'loading') return <p role="status">Loading orders…</p>

  if (status === 'error') {
    return (
      <div role="alert">
        <p>We could not load your orders.</p>
        <button onClick={load}>Try again</button>
      </div>
    )
  }

  return <OrderList orders={orders} />
}
```

The `r.ok` check catches error replies, which the browser otherwise treats as success.

## How it is detected

**What checks it today.**
- The Face Up scanner and skill look for data requests with no plan for failure, both in query hooks such as useQuery and useSWR and in calls made with fetch, axios, supabase, ky or got.
- Reading the error, passing onError, setting an error state or catching the error counts as handled. A catch that only logs to the console does not.
- Suspense query hooks are left to an error boundary, a wrapper that catches failures.
- Data from a hook the project wrote itself, where the error is not read, is marked not assessed.
- Findings are for review and never fail a build.
- In September 2026, an early version flagged 122 of 153 data-loading parts of one public Lovable-built app, and 39 of 94 in another, though two apps is a small sample.

**What it cannot catch.**
- Failures handled where the check cannot follow, so each finding needs confirming.
- Code that reads the error but shows nothing still counts as handled.
- Whether the message helps and whether retrying is the right response, which a person decides.

## Related rules

- `faceup-missing-loading-state` - no sign while data is loading
- `faceup-missing-empty-state` - nothing shown when there is no data
