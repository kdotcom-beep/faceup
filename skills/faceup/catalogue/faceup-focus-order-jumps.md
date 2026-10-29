---
id: faceup-focus-order-jumps
title: Focus jumps around the page
summary: "Pressing Tab should move through the page in the same order people read it. When focus jumps around or skips an open dialog, keyboard users miss fields and lose their place."
failure_mode: focus-and-keyboard
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "2.4.3"
      name: Focus Order
      level: A
  heuristic:
    - "Nielsen: consistency and standards"
  ai_signature: "Positive tabIndex values are added to force a field to the front of the tab order, or a dialog is rendered through a portal at the end of the page with no code to move focus into it or back to its trigger."
surfaces: [component]
detectable_by:
  axe: true
  jsx_a11y: true
  wig: false
detection:
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "Tab through the page while watching the focus outline, then open each dialog and menu by keyboard and check that focus moves into it and returns to its button when it closes."
related: [faceup-keyboard-trap, faceup-autofocus-misused, faceup-focus-not-visible]
added: 2026-10-21
---

## What it looks like

`tabIndex={1}`, a setting that forces a control's place in the Tab order, pulls the email field ahead of the name field, and a help dialog opens at the end of the page while focus stays on the button that opened it.

```jsx
function SignUp() {
  const [open, setOpen] = useState(false)
  return (
    <form>
      <label htmlFor="name">Name</label>
      <input id="name" />
      <label htmlFor="email">Email</label>
      <input id="email" tabIndex={1} />
      <button type="button" onClick={() => setOpen(true)}>What is this?</button>
      <button type="submit">Create account</button>
      {open && createPortal(<HelpDialog onClose={() => setOpen(false)} />, document.body)}
    </form>
  )
}
```

Pressing Tab lands on the email field before the name field, and reaches the dialog only after every other control.

## Why it fails

- Keyboard users follow focus to know where they are, so they miss fields that come out of order and must tab through the whole page to reach the dialog.
- Fails WCAG 2.2 success criterion 2.4.3, Focus Order, Level A, when the order changes meaning or makes the page harder to use.
- A positive tabindex, a number that moves a control ahead of all others, is not a failure on its own, but it usually breaks the order.
- The W3C documents two failures: an illogical tabindex order, and dialogs or menus not placed next to the control that opens them in the focus order.

## The fix

Remove positive tabindex values, and use the browser's built-in dialog element opened with `showModal()`, which moves focus into the dialog and back out when it closes.

```jsx
function SignUp() {
  const dialog = useRef(null)
  return (
    <form>
      <label htmlFor="name">Name</label>
      <input id="name" />
      <label htmlFor="email">Email</label>
      <input id="email" />
      <button type="button" onClick={() => dialog.current.showModal()}>What is this?</button>
      <button type="submit">Create account</button>
      <dialog ref={dialog} aria-labelledby="help-title">
        <h2 id="help-title">Why we ask for your email</h2>
        <p>We send your receipt and sign-in links here.</p>
        <button type="button" onClick={() => dialog.current.close()}>Close</button>
      </dialog>
    </form>
  )
}
```

To change the visual order, change the order in the code, because styles that reorder items move them on screen without changing the Tab order.

## How it is detected

**What checks it today.**
- The Face Up skill finds positive tabIndex values, dialogs and menus placed away from the control that opens them, and close actions that never return focus.
- The jsx-a11y linter, a code-checking tool, reports positive tabindex values but does not check the order focus takes.
- The scanner does not check this rule. Its browser check runs axe, a testing tool that flags positive tabindex values, but reports those results separately from the Face Up catalogue.

**What it cannot catch.**
- Whether the order matches the layout at each screen size.
- Whether a dialog takes focus once open.

## Related rules

- `faceup-keyboard-trap` - focus reaches a control but cannot leave it
- `faceup-autofocus-misused` - the page moves focus to a field on load
- `faceup-focus-not-visible` - you cannot see where focus is
