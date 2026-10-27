---
id: faceup-hover-content-not-dismissible
title: Tooltip cannot be dismissed or reached
summary: "Tooltips must stay open while the pointer is over them and close when Escape is pressed. Otherwise some people cannot read them and others cannot get them out of the way."
failure_mode: feedback-and-status
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "1.4.13"
      name: Content on Hover or Focus
      level: AA
  heuristic: []
  ai_signature: "Model builds a custom tooltip that shows on mouseenter and hides on mouseleave, with no Escape handler and a gap between trigger and bubble, because it modelled only the happy path of a mouse arriving and leaving."
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
  manual_test: "Hover to open the tooltip, then confirm Escape dismisses it, the pointer can move onto it without it closing, and it stays visible until you dismiss it or move away."
related: [faceup-focus-not-visible, faceup-placeholder-as-label, faceup-nontext-contrast]
added: 2026-09-07
---

## What it looks like

A tooltip opens when the pointer rests on a word and closes when it leaves.

```jsx
function InfoTip({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="tip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {label}
      {open && (
        <span className="tip-bubble" role="tooltip">
          {children}
        </span>
      )}
    </span>
  );
}
```

```css
.tip-bubble {
  position: absolute;
  bottom: calc(100% + 8px); /* an 8px gap the pointer must cross */
}
```

Moving up to read it crosses a gap, which counts as leaving, so it closes.

## Why it fails

- People who move the pointer onto the tooltip to read it cannot keep it open, and people who need it out of the way, or who open it by accident because of a tremor, cannot close it.
- Fails WCAG 2.2 success criterion 1.4.13, Content on Hover or Focus, Level AA.
- Content on hover or focus must be closable, let the pointer move onto it, and stay until the person closes it or moves away. This tooltip meets none of the three.

## The fix

Let Escape close it, keep it open while the pointer is over the word or the tooltip, and remove the gap.

```jsx
function InfoTip({ label, children }) {
  const [open, setOpen] = useState(false);
  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") hide(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <span
      className="tip-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {label}
      {open && (
        <span className="tip-bubble" role="tooltip">
          {children}
        </span>
      )}
    </span>
  );
}
```

```css
.tip-wrap { position: relative; }

.tip-bubble {
  position: absolute;
  top: 100%; /* no gap: the bubble adjoins the trigger */
}
```

One outer element holds both the word and the tooltip, so moving onto the tooltip does not count as leaving. The browser's built-in tooltip, used for short fixed text, is exempt.

## How it is detected

**What checks it today.**
- The Face Up skill checks custom tooltips and pop-ups for a way to close them with Escape, and for open and close code that covers both the word and the tooltip.
- The scanner does not check this rule, and findings never block a release.

**What it cannot catch.**
- Whether each of the three conditions holds on the running page, which a person checks. Failing any one of them fails the rule.
- A gap in the layout, or a tooltip that closes a moment too early.

## Related rules

- `faceup-focus-not-visible` - you cannot see which item the keyboard is on
- `faceup-placeholder-as-label` - a label that disappears as you type
- `faceup-nontext-contrast` - tooltip borders or icons too faint to see
