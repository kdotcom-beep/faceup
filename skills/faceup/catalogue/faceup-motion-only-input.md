---
id: faceup-motion-only-input
title: Shaking or tilting is the only way to do something
summary: "Actions triggered by shaking or tilting need a button alternative and a way to turn motion off. People with a mounted phone cannot shake it, and people with tremors trigger it by accident."
failure_mode: input-and-forms
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "2.5.4"
      name: Motion Actuation
      level: A
  heuristic: []
  ai_signature: "Model adds a devicemotion or deviceorientation listener that triggers an action, such as shake to undo or tilt to scroll, and emits no button for the same action and no setting to turn the listener off."
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
  manual_test: "Find each feature that responds to shaking or tilting the device, and check that you can do the same thing with a button and turn the motion response off."
related: [faceup-pointer-gesture-no-alternative, faceup-dragging-no-alternative, faceup-destructive-no-undo]
added: 2026-10-21
---

## What it looks like

Shaking the phone undoes the last edit, but there is no undo button and no way to turn shaking off.

```jsx
function NotesEditor() {
  const { undo } = useHistory();

  useEffect(() => {
    function onMotion(e) {
      const { x, y, z } = e.acceleration ?? {};
      if (Math.abs(x) + Math.abs(y) + Math.abs(z) > 30) undo();
    }
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [undo]);

  return <Editor />;
}
```

Tilt to scroll and shake to refresh cause the same problem.

## Why it fails

- People with a phone mounted on a wheelchair, or with limited hand strength, cannot undo at all, while people with tremors trigger it by accident.
- Fails WCAG 2.2 success criterion 2.5.4, Motion Actuation, Level A, because the action has no button and the motion response cannot be turned off.
- Not a failure: motion used through assistive technology that supports it, such as a head-tracking pointer.
- Not a failure: motion essential to the function, such as a step counter or spirit level.

## The fix

Add a button for the same action and a setting that turns the motion response off.

```jsx
function NotesEditor() {
  const { undo } = useHistory();
  const [shakeToUndo, setShakeToUndo] = useSetting("shakeToUndo", false);

  useEffect(() => {
    if (!shakeToUndo) return;
    function onMotion(e) {
      const { x, y, z } = e.acceleration ?? {};
      if (Math.abs(x) + Math.abs(y) + Math.abs(z) > 30) undo();
    }
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [shakeToUndo, undo]);

  return (
    <>
      <button type="button" onClick={undo}>
        Undo
      </button>
      <label>
        <input
          type="checkbox"
          checked={shakeToUndo}
          onChange={(e) => setShakeToUndo(e.target.checked)}
        />
        Shake to undo
      </label>
      <Editor />
    </>
  );
}
```

Leaving motion off by default also meets the criterion.

## How it is detected

**What checks it today.**
- The Face Up skill reads the code for anything that reacts to device motion or tilt, including libraries that wrap it.
- For each one that triggers an action, it looks for a matching button and a setting to turn it off.
- It ignores motion that only changes the display, such as parallax.
- A person confirms each finding, and no finding blocks a release.

**What it cannot catch.**
- Whether motion is essential, as in a step counter or tilting game, which a person must judge.
- Gestures read through the camera, which the criterion also covers, when they sit in code the skill does not trace.

## Related rules

- `faceup-pointer-gesture-no-alternative` - a carousel that only moves by swiping
- `faceup-dragging-no-alternative` - a list reordered only by dragging
- `faceup-destructive-no-undo` - a deleted item cannot be brought back
