---
id: faceup-pointer-gesture-no-alternative
title: Gesture with no single-tap alternative
summary: "Anything done with a swipe, pinch or other gesture must also work with a single tap or click. Switch users and people with limited hand control cannot perform gestures reliably."
failure_mode: input-and-forms
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "2.5.1"
      name: Pointer Gestures
      level: A
  heuristic: []
  ai_signature: "Model builds a carousel, map, or slider driven only by swipe, pinch, or path-based touch handlers (onTouchMove, pointer path tracking, a swipe library) and emits no tap-sized next, previous, or zoom control."
surfaces: [component]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: true
detection:
  automatic: false
  scanner: []
  rendered: false
  agent: true
  human_review: false
  manual_test: "Using only single taps or clicks, check that you can still do everything that swiping, pinching or dragging along a path does. The test fails if any slide, zoom level or position can be reached only with a gesture."
related: [faceup-dragging-no-alternative, faceup-div-as-button, faceup-vague-link-text]
added: 2026-09-07
---

## What it looks like

A carousel moves only when you swipe, and has no next, previous or dot buttons.

```jsx
function Carousel({ slides }) {
  const [index, setIndex] = useState(0);
  const startX = useRef(0);

  return (
    <div
      className="carousel"
      onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - startX.current;
        if (dx < -40) setIndex((i) => Math.min(i + 1, slides.length - 1));
        if (dx > 40) setIndex((i) => Math.max(i - 1, 0));
      }}
    >
      {slides[index]}
    </div>
  );
}
```

Maps that need pinching and dragging, and swipe-only sliders, fail the same way.

## Why it fails

- Switch users and people with limited hand control cannot trace a swipe, and screen reader users on touchscreens already use swipes to control the screen reader.
- Fails WCAG 2.2 success criterion 2.5.1, Pointer Gestures, Level A.
- It is not a failure where the path itself is essential, as in freehand drawing, but a carousel does not qualify.

## The fix

Keep the swipe, and add next, previous and dot buttons.

```jsx
function Carousel({ slides }) {
  const [index, setIndex] = useState(0);
  const startX = useRef(0);

  return (
    <div
      className="carousel"
      onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - startX.current;
        if (dx < -40) setIndex((i) => Math.min(i + 1, slides.length - 1));
        if (dx > 40) setIndex((i) => Math.max(i - 1, 0));
      }}
    >
      {slides[index]}
      <button
        type="button"
        onClick={() => setIndex((i) => Math.max(i - 1, 0))}
        disabled={index === 0}
      >
        Previous
      </button>
      <button
        type="button"
        onClick={() => setIndex((i) => Math.min(i + 1, slides.length - 1))}
        disabled={index === slides.length - 1}
      >
        Next
      </button>
      <ul className="dots">
        {slides.map((_, i) => (
          <li key={i}>
            <button
              type="button"
              aria-current={i === index}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

For a map, add zoom and pan buttons. In general, anything done with a gesture that follows a path or uses more than one finger must also work with a single tap or click.

## How it is detected

**What checks it today.**
- The Face Up skill reads components that track finger or mouse movement or multi-finger gestures, and checks that a single tap or click can do everything the gesture does.
- A person confirms each finding. Findings never block a release.

**What it cannot catch.**
- Whether an alternative exists elsewhere on the page.
- Whether the tap alternative reaches every function.

## Related rules

- `faceup-dragging-no-alternative` - a list you can only reorder by dragging
- `faceup-div-as-button` - the next, previous and dot controls must be real buttons
- `faceup-vague-link-text` - slide dots need names that say where they go
