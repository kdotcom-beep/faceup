---
id: faceup-visual-order-differs
title: Layout puts content in a different reading order
summary: "Content must appear in the code in the same order it is meant to be read. Screen readers and keyboards follow the code, so a rearranged layout can read the answer before the question."
failure_mode: naming-and-semantics
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "1.3.2"
      name: Meaningful Sequence
      level: A
  heuristic: []
  ai_signature: "Generated layout reorders content with flex-direction: row-reverse or column-reverse, the order property, explicit grid placement or absolute positioning, while the array or markup it renders stays in a different order."
surfaces: [css, component]
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
  manual_test: "Listen to the page from top to bottom with a screen reader and check that the order still makes sense, with steps in sequence and replies after the messages they answer."
related: [faceup-heading-order, faceup-focus-not-visible, faceup-reflow-horizontal-scroll]
added: 2026-10-21
---

## What it looks like

A support chat lists messages newest first in the code, then flips them on screen with `column-reverse`, a style that reverses the order.

```css
.thread {
  display: flex;
  flex-direction: column-reverse;
  overflow-y: auto;
}
```

```jsx
<ol className="thread">
  {[...messages].reverse().map((m) => (
    <li key={m.id}>
      <strong>{m.author}:</strong> {m.text}
    </li>
  ))}
</ol>
```

## Why it fails

- Screen readers and the Tab key follow the code order, so people hear the answer before the question.
- Fails WCAG 2.2 success criterion 1.3.2, Meaningful Sequence, Level A, when the order affects the meaning.
- Unrelated items that swap places, such as two product cards, do not fail, but steps, conversations and a label moved away from its value do.

## The fix

Put the content in the code in reading order, and scroll to the newest message when one arrives.

```css
.thread {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
```

```jsx
function Thread({ messages }) {
  const listRef = useRef(null);
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  return (
    <ol className="thread" ref={listRef}>
      {messages.map((m) => (
        <li key={m.id}>
          <strong>{m.author}:</strong> {m.text}
        </li>
      ))}
    </ol>
  );
}
```

Use CSS reordering only where order does not change meaning, and if another screen width needs a different order, change the order in the code.

## How it is detected

**What checks it today.**
- The Face Up skill finds styles that reorder content on screen, then flags any reordering where order carries meaning, such as steps, messages, or a label and its value.
- The scanner does not check this rule.
- A person confirms each finding. Findings never block a release.

**What it cannot catch.**
- Whether a different order changes the meaning.
- Layouts that reorder only at some widths or depend on live data.

## Related rules

- `faceup-heading-order` - the heading outline is out of order
- `faceup-focus-not-visible` - keyboard users cannot see where focus is
- `faceup-reflow-horizontal-scroll` - a layout breaks at narrow widths, where reordering often starts
