---
id: faceup-error-prevention-destructive
title: Irreversible action has no confirm step or undo
summary: "Actions that delete data, take payment or make a legal commitment need a confirm step or an undo. Without one, a single slip from a tremor or a misread label cannot be reversed."
failure_mode: state-and-edge-cases
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "3.3.4"
      name: Error Prevention (Legal, Financial, Data)
      level: AA
  heuristic: []
  ai_signature: "A destructive or committing handler wired straight to the click, with no reversal path, validation gate or review-and-confirm step."
surfaces: [component, flow]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: false
detection:
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "Use each action that deletes data, takes payment or makes a commitment, and check that it can be reversed, checks the input first, or has a review-and-confirm step."
related: [faceup-destructive-no-undo, faceup-back-discards-data, faceup-missing-error-branch]
added: 2026-09-07
---

## What it looks like

A Delete account button acts on the first click, with no check, review step or undo.

```jsx
function DeleteAccount({ accountId }) {
  return (
    <button
      type="button"
      onClick={() => api.deleteAccount(accountId)}
    >
      Delete account
    </button>
  );
}
```

Buttons such as "Pay now", "Submit order" and "Accept terms" can have the same problem.

## Why it fails

- One slip, from a tremor or a misread label, permanently deletes data, charges a card or signs an agreement.
- Fails WCAG 2.2 success criterion 3.3.4, Error Prevention (Legal, Financial, Data), Level AA.
- The criterion covers legal commitments, financial transactions, changes to data the person controls, and test answers, and each needs one safeguard: undo, an input check, or a review-and-confirm step.
- Success criterion 3.3.6, Error Prevention (All), Level AAA, extends this to every form, though meeting 3.3.4 does not require it.

## The fix

Add at least one safeguard. A review-and-confirm step like the one below suits most cases.

```jsx
function DeleteAccount({ accountId }) {
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef(null);
  const openRef = useRef(null);
  const opened = useRef(false);

  useEffect(() => {
    if (confirming) {
      opened.current = true;
      cancelRef.current.focus();
    } else if (opened.current) {
      openRef.current.focus();
    }
  }, [confirming]);

  if (!confirming) {
    return (
      <button ref={openRef} type="button" onClick={() => setConfirming(true)}>
        Delete account
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-labelledby="del-title" aria-describedby="del-body">
      <h2 id="del-title">Delete this account?</h2>
      <p id="del-body">
        This removes the account and all its data. It cannot be undone.
      </p>
      <button ref={cancelRef} type="button" onClick={() => setConfirming(false)}>
        Cancel
      </button>
      <button type="button" onClick={() => api.deleteAccount(accountId)}>
        Yes, delete permanently
      </button>
    </div>
  );
}
```

Focus starts on Cancel, so a stray press of Enter cancels the action. A working undo also meets the criterion and is often the better choice. For payments, show the amount and recipient before the final button.

## How it is detected

**What checks it today.**
- The Face Up skill follows each action that deletes, pays or submits and looks for a safeguard.
- A safeguard may sit elsewhere in the process, so a person confirms each finding.

**What it cannot catch.**
- Whether an undo works, a confirm step stops the action, or a payment can be reversed.

## Related rules

- `faceup-destructive-no-undo` - the usability case: no way back after a slip
- `faceup-back-discards-data` - going back throws away what the person typed
- `faceup-missing-error-branch` - an action shows nothing when it fails
