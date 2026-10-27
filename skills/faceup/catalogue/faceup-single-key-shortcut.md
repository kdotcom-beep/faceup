---
id: faceup-single-key-shortcut
title: Single-key shortcut fires while typing
summary: "Shortcuts that use a single key, such as 'j' or '/', must be possible to turn off or change. Speech input users and people with tremors set them off by accident."
failure_mode: focus-and-keyboard
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "2.1.4"
      name: Character Key Shortcuts
      level: A
  heuristic:
    - "Nielsen: user control and freedom"
  ai_signature: "A document-level keydown listener is generated to match a shortcut described in the prompt, checking e.key against a single character with no modifier test and no setting to switch it off."
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
  manual_test: "Click on an empty part of the page, then press each letter, number and symbol key on its own. If anything happens, check whether the page lets you turn that shortcut off or change it to use Ctrl or Alt."
related: [faceup-context-change-on-input, faceup-keyboard-trap, faceup-autofocus-misused]
added: 2026-10-21
---

## What it looks like

Pressing one plain key, such as "/" or "j", runs an action anywhere on the page.

```jsx
function useShortcuts({ openSearch, nextArticle }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === '/') {
        e.preventDefault()
        openSearch()
      }
      if (e.key === 'j') nextArticle()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openSearch, nextArticle])
}
```

The shortcuts cannot be turned off or changed.

## Why it fails

- Speech input turns words into key presses, so dictating a "j" jumps to another article, and people with tremors set off actions by accident.
- Fails WCAG 2.2 success criterion 2.1.4, Character Key Shortcuts, Level A.
- A single-key shortcut passes if it can be turned off, can be changed to include Ctrl or Alt, or works only while its own component has focus.
- Shortcuts that already need Ctrl, Alt or Cmd are outside the criterion.
- Ignoring the key inside text fields does not meet the criterion, because it still fires everywhere else.

## The fix

Require Ctrl or Cmd, so the shortcut cannot fire while someone types or dictates.

```jsx
function useShortcuts({ openSearch }) {
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openSearch])
}
```

To keep single keys, add a setting to turn them off or change them, or limit each to its own component.

## How it is detected

**What checks it today.**
- The Face Up skill flags code that listens for key presses across the whole page and acts on a single character without checking for Ctrl, Alt or Cmd. It then looks for a setting to turn those shortcuts off or change them.
- The Face Up scanner and common automated checkers do not test for it, and no finding blocks a release.

**What it cannot catch.**
- Shortcuts added by an outside script or library.
- Settings on a separate page that it does not connect to the shortcut.

## Related rules

- `faceup-context-change-on-input` - changing a field moves the person unasked
- `faceup-keyboard-trap` - the keyboard reaches a control but cannot leave
- `faceup-autofocus-misused` - focus jumps to a field unasked
