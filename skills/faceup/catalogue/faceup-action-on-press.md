---
id: faceup-action-on-press
title: Action fires on press, before release
summary: "A control should act when the pointer is released, not when it is pressed. Acting on release lets people with tremors or low vision cancel a mistaken press by sliding off before letting go."
failure_mode: input-and-forms
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "2.5.2"
      name: Pointer Cancellation
      level: A
  heuristic: []
  ai_signature: "Model wires a delete, submit or navigation action to onMouseDown, onPointerDown or onTouchStart, often to make a button feel faster or to get ahead of a blur handler, where onClick would fire on release."
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
  manual_test: "Press and hold each button, slide off it before letting go, and check that nothing happens."
related: [faceup-destructive-no-undo, faceup-target-too-small, faceup-error-prevention-destructive]
added: 2026-10-21
---

## What it looks like

A delete button acts the moment it is pressed, before the person lets go.

```jsx
<button type="button" onPointerDown={() => deleteMessage(message.id)}>
  Delete
</button>
```

Search suggestions often act on press so they fire before the list closes.

```jsx
<li role="option" onMouseDown={() => selectSuggestion(item)}>
  {item.label}
</li>
```

## Why it fails

- People with tremors, and magnifier users who cannot see what is under the pointer, sometimes press the wrong control, and with this code they cannot cancel by sliding off before letting go.
- Fails WCAG 2.2 success criterion 2.5.2, Pointer Cancellation, Level A.
- Not a failure if the action completes on release and can be cancelled or undone.
- Not a failure if release reverses the press, such as hold to show a password.
- Not a failure if acting on press is essential, such as an on-screen piano.
- Offering undo is not enough when the action fires on press.
- Keyboard actions that fire as a key goes down are outside the criterion.

## The fix

Use `onClick`, which fires on release, and only when press and release land on the same element.

```jsx
<button type="button" onClick={() => deleteMessage(message.id)}>
  Delete
</button>
```

For a suggestion list, stop the press moving focus out of the text field, and act on click.

```jsx
<li
  role="option"
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => selectSuggestion(item)}
>
  {item.label}
</li>
```

Drag and drop can start on press, because the move happens on release, and dropping where it started or off target cancels it.

## How it is detected

**What checks it today.**
- The Face Up skill finds press handlers (`onMouseDown`, `onPointerDown`, `onTouchStart`) that delete, submit, navigate or change saved data.
- It ignores handlers that only start a drag, keep focus, or show something that release hides.
- A person confirms each finding, and findings never block a release.

**What it cannot catch.**
- Whether acting on press is essential, as in a piano or game.
- Handlers added by a library or by shared code elsewhere in the project.

## Related rules

- `faceup-destructive-no-undo` - a deleted item cannot be restored
- `faceup-target-too-small` - small targets make slips more likely
- `faceup-error-prevention-destructive` - a destructive action runs with no chance to check
