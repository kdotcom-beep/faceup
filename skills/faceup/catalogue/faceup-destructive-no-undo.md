---
id: faceup-destructive-no-undo
title: Delete cannot be undone
summary: "Pressing delete removes the item at once, with no undo, bin or archive. Give people a way back, such as an undo button."
failure_mode: state-and-edge-cases
tier: 3
severity: ux-failure
anchor:
  wcag: []
  heuristic:
    - "Nielsen: user control and freedom"
    - "Nielsen: error prevention"
  ai_signature: "A remove or delete handler runs immediately on click with no undo toast, trash, archive or restore path."
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
  human_review: true
  manual_test: "Use each delete or remove button and check that an undo option appears, or that the item goes somewhere it can be restored from."
related: [faceup-error-prevention-destructive, faceup-back-discards-data, faceup-async-status-not-announced]
added: 2026-09-07
---

## What it looks like

Pressing Remove deletes the item at once, with no undo, bin or archive.

```jsx
function TodoItem({ item, onRemove }) {
  return (
    <li>
      <span>{item.text}</span>
      <button type="button" onClick={() => onRemove(item.id)}>
        Remove
      </button>
    </li>
  );
}

// onRemove drops the item from state and the server. Nothing is kept,
// nothing is announced, and there is no way to reverse it.
```

The person can only recreate it from memory.

## Why it fails

- One slip, such as hitting Remove instead of Rename, loses the item, a cost that falls hardest on people with motor or cognitive disabilities.
- It breaks two of Nielsen's heuristics, user control and freedom and error prevention, which makes it a UX failure rather than a WCAG one.
- Deleting saved data also falls under WCAG 2.2 success criterion 3.3.4, Error Prevention (Legal, Financial, Data), which `faceup-error-prevention-destructive` covers.
- An "Are you sure?" step can meet 3.3.4 and still leave no way back.

## The fix

Show an Undo button in place of the item, and delete it only after a delay.

```jsx
function TodoItem({ item, onRemove }) {
  const [removed, setRemoved] = useState(false);
  const timer = useRef(null);
  const held = useRef({ hover: false, focus: false });
  const undoRef = useRef(null);
  const removeRef = useRef(null);
  const restored = useRef(false);

  function schedule() {
    clearTimeout(timer.current);
    if (!held.current.hover && !held.current.focus) {
      timer.current = setTimeout(() => onRemove(item.id), 10000);
    }
  }

  function hold(key, value) {
    if (restored.current) return;
    held.current[key] = value;
    schedule();
  }

  useEffect(() => {
    if (removed) undoRef.current.focus();
    else if (restored.current) removeRef.current.focus();
  }, [removed]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleRemove() {
    restored.current = false;
    setRemoved(true);
    schedule();
  }

  function handleUndo() {
    clearTimeout(timer.current);
    held.current = { hover: false, focus: false };
    restored.current = true;
    setRemoved(false);
  }

  if (removed) {
    return (
      <li
        onMouseEnter={() => hold("hover", true)}
        onMouseLeave={() => hold("hover", false)}
        onFocus={() => hold("focus", true)}
        onBlur={() => hold("focus", false)}
      >
        <span id={`removed-${item.id}`}>Removed "{item.text}"</span>
        <button
          ref={undoRef}
          type="button"
          aria-describedby={`removed-${item.id}`}
          onClick={handleUndo}
        >
          Undo
        </button>
      </li>
    );
  }

  return (
    <li>
      <span>{item.text}</span>
      <button ref={removeRef} type="button" onClick={handleRemove}>
        Remove
      </button>
    </li>
  );
}
```

The delete waits 10 seconds, and the timer pauses while the pointer or keyboard focus is on the row, because an undo message must stay open while someone is using it. Focus moves to Undo when the item is removed, and back to Remove if the person undoes. Where a short window does not suit the data, use a bin or archive.

## How it is detected

**What checks it today.**
- The Face Up skill checks each delete action for an undo, bin, archive or restore option.
- A person checks each finding, because the code cannot prove there is no way back elsewhere.
- Findings never block a release.

**What it cannot catch.**
- Whether undo really restores the item, or whether a bin works.

## Related rules

- `faceup-error-prevention-destructive` - the WCAG 3.3.4 case for saved data, payments and legal commitments
- `faceup-back-discards-data` - going back throws away what the person typed
- `faceup-async-status-not-announced` - an undo message shown but never read out
