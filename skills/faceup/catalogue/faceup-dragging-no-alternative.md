---
id: faceup-dragging-no-alternative
title: Reordering only works by dragging
summary: "Anything that can be done by dragging must also work with single clicks or taps. People with tremors, or who point with their head or eyes, cannot hold a steady drag."
failure_mode: input-and-forms
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "2.5.7"
      name: Dragging Movements
      level: AA
  heuristic: []
  ai_signature: "Sortable list wired to drag events (onDragStart, onDragOver, onDrop, or a drag library) with no up, down or click-to-move alternative."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: true
detection:
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "Try every drag action using only single clicks or taps, and confirm each reorder can also be done without dragging."
related: [faceup-div-as-button, faceup-pointer-gesture-no-alternative, faceup-focus-not-visible]
added: 2026-09-07
---

## What it looks like

A priority list can be reordered only by dragging items into place.

```jsx
function PriorityList({ items, onReorder }) {
  return (
    <ul>
      {items.map((item, i) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => e.dataTransfer.setData("index", String(i))}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onReorder(Number(e.dataTransfer.getData("index")), i)}
        >
          <span className="handle" aria-hidden="true">::</span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

## Why it fails

- People with a tremor, or who point with their head or eyes, cannot hold a steady drag, so they cannot reorder the list.
- Fails WCAG 2.2 success criterion 2.5.7, Dragging Movements, Level AA.
- Dragging can stay as long as a single click or tap can do the same job.
- Only essential dragging is exempt, and reordering a list is not essential.

## The fix

Keep dragging, and add up and down buttons to each row. Letting people tap an item to pick it up and tap again to place it also works.

```jsx
function PriorityList({ items, onMove }) {
  const buttons = useRef({});
  const [moved, setMoved] = useState(null);

  useEffect(() => {
    if (!moved) return;
    const i = items.findIndex((item) => item.id === moved.id);
    let dir = moved.dir;
    if (dir === "up" && i === 0) dir = "down";
    if (dir === "down" && i === items.length - 1) dir = "up";
    buttons.current[`${moved.id}-${dir}`]?.focus();
    setMoved(null);
  }, [items, moved]);

  function move(item, from, to, dir) {
    onMove(from, to);
    setMoved({ id: item.id, dir });
  }

  return (
    <ul>
      {items.map((item, i) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => e.dataTransfer.setData("index", String(i))}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onMove(Number(e.dataTransfer.getData("index")), i)}
        >
          <span className="handle" aria-hidden="true">::</span>
          {item.label}
          <button
            ref={(el) => { buttons.current[`${item.id}-up`] = el; }}
            type="button"
            onClick={() => move(item, i, i - 1, "up")}
            disabled={i === 0}
            aria-label={`Move ${item.label} up`}
          >
            Up
          </button>
          <button
            ref={(el) => { buttons.current[`${item.id}-down`] = el; }}
            type="button"
            onClick={() => move(item, i, i + 1, "down")}
            disabled={i === items.length - 1}
            aria-label={`Move ${item.label} down`}
          >
            Down
          </button>
        </li>
      ))}
    </ul>
  );
}
```

After a move, keyboard focus stays on the button just pressed in the moved row, or moves to the row's other button if the first is now disabled.

## How it is detected

**What checks it today.**
- The Face Up skill finds drag-and-drop code and looks for a way to make the same change with a single click or tap.
- The alternative may sit in a menu, a shortcut or elsewhere on the page, so the skill cannot prove it is missing.

**What it cannot catch.**
- Whether the alternative works from start to finish, which a person needs to test manually.

## Related rules

- `faceup-pointer-gesture-no-alternative` - a swipe or pinch with no single-tap alternative
- `faceup-div-as-button` - up and down controls must be real buttons
- `faceup-focus-not-visible` - reorder buttons need a visible focus marker
