---
id: faceup-reduced-motion-ignored
title: Animation ignores the reduce-motion setting
summary: "Animations should stop or reduce when a person's device is set to reduce motion. Large movement can cause nausea, dizziness or migraines for people with vestibular (balance) disorders."
failure_mode: motion-and-attention
tier: 1
severity: ux-failure
anchor:
  wcag:
    - criterion: "2.3.3"
      name: Animation from Interactions
      level: AAA
  heuristic: []
  ai_signature: "Transitions, transforms and keyframes emitted with no prefers-reduced-motion block anywhere in the stylesheet."
surfaces: [css]
detectable_by:
  axe: false
  jsx_a11y: false
  wig: true
detection:
  automatic: false
  scanner: [code, browser]
  rendered: true
  agent: false
  human_review: false
  manual_test: "Turn on the reduce-motion setting on your device, reload the page, then hover and scroll, watching for anything that still slides, zooms or bounces."
related: [faceup-autoplay-media-no-control]
added: 2026-09-07
---

## What it looks like

Things slide, lift and drift even for people who have turned on their device's reduce-motion setting.

```css
.hero {
  transition: transform 0.6s ease;
}
.hero:hover {
  transform: translateY(-12px) scale(1.04);
}

.parallax {
  animation: drift 8s ease-in-out infinite alternate;
}

@keyframes drift {
  from { transform: translateY(0); }
  to   { transform: translateY(-40px); }
}
```

## Why it fails

- People with a vestibular disorder, an inner ear and brain condition that affects balance, can get nausea, dizziness or a migraine from large movement.
- The rule rests on WCAG 2.2 success criterion 2.3.3, Animation from Interactions, Level AAA. Because AAA is not required for conformance, it is rated a usability failure.

## The fix

Add a reduce-motion block that stops automatic animation and removes movement on hover.

```css
.hero {
  transition: transform 0.6s ease;
}
.hero:hover {
  transform: translateY(-12px) scale(1.04);
}

.parallax {
  animation: drift 8s ease-in-out infinite alternate;
}

@keyframes drift {
  from { transform: translateY(0); }
  to   { transform: translateY(-40px); }
}

@media (prefers-reduced-motion: reduce) {
  .hero { transition: none; }
  .hero:hover { transform: none; }
  .parallax { animation: none; }
}
```

The drifting layer moves on its own for more than five seconds, so it also needs a pause control under WCAG 2.2 success criterion 2.2.2, Pause, Stop, Hide, Level A. The reduce-motion block does not meet 2.2.2, because it only helps people who have turned the setting on.

## How it is detected

**What checks it today.**
- The Face Up scanner reads stylesheets and Tailwind classes for movement with no reduce-motion block.
- Its browser pass loads the page with the setting on and lists animations that still move something 32 pixels or larger by 8 pixels or more.
- Off-screen and scroll-driven animation, fades, colour changes and loading spinners are not reported.
- On 14 well-known sites tested in October 2026, both findings were real.
- Findings are for review and never block a release.

**What it cannot catch.**
- Whether an existing reduce-motion block is complete, so a block that stops one animation and misses five others counts as covered.
- Styles written in JavaScript or in `style` attributes.
- Movement on hover or scroll.

## Related rules

- `faceup-autoplay-media-no-control` - media plays on load with no stop control
