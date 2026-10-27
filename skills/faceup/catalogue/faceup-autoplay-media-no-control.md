---
id: faceup-autoplay-media-no-control
title: Audio or video plays on load with no controls
summary: "Audio or video must not play on load unless people can pause or stop it. Sound that starts by itself drowns out screen readers, and people in quiet places cannot silence it."
failure_mode: motion-and-attention
tier: 1
severity: failure
anchor:
  wcag:
    - criterion: "1.4.2"
      name: Audio Control
      level: A
    - criterion: "2.2.2"
      name: Pause, Stop, Hide
      level: A
  heuristic:
    - "Nielsen: user control and freedom"
  ai_signature: "A media element emitted with the autoplay attribute and no controls attribute."
surfaces: [component]
detectable_by:
  axe: true
  jsx_a11y: false
  wig: true
detection:
  automatic: false
  scanner: [browser]
  rendered: true
  agent: false
  human_review: false
  manual_test: "Load the page with your sound on and check whether anything plays or moves by itself, and if so, whether you can pause or stop it."
related: [faceup-reduced-motion-ignored]
added: 2026-09-07
---

## What it looks like

A video and an audio clip start playing as the page loads, with no controls to stop them.

```html
<video src="/hero-loop.mp4" autoplay loop></video>

<audio src="/welcome-message.mp3" autoplay></audio>
```

Browsers do not always block sound that plays by itself, so the page cannot rely on them to do it.

## Why it fails

- Screen reader users cannot hear their screen reader over the audio, and people in quiet spaces or with attention difficulties have no way to silence it.
- Fails WCAG 2.2 success criterion 1.4.2, Audio Control, Level A, when audio plays for more than three seconds with no way to pause, stop or lower it. Every page must meet this criterion, whatever level of conformance it claims.
- Fails WCAG 2.2 success criterion 2.2.2, Pause, Stop, Hide, Level A, when video moves for more than five seconds with no way to pause it.

## The fix

Mute any video that starts on load and give it controls. If the sound matters, let the person press play instead.

```html
<video src="/hero-loop.mp4" autoplay loop muted controls></video>

<audio src="/welcome-message.mp3" controls></audio>
```

## How it is detected

**What checks it today.**
- The scanner opens the page in a browser and checks what is playing, including media a script starts on load.
- axe, a widely used testing tool, reports audio longer than three seconds with no control.
- Face Up also reports any playing video without controls or a nearby pause button, muted or not, because muting matters only for 1.4.2.
- On 33 well-known sites tested in October 2026, both findings were real.
- This is a browser check only, and its findings never fail a build.
- Some other tools check only the sound.

**What it cannot catch.**
- Media that starts on scroll, after a delay, or after the person acts.
- A video that stops within five seconds may still be reported, leaving a person to clear it.
- A pause button elsewhere on the page, which a person must confirm works.

## Related rules

- `faceup-reduced-motion-ignored` - animation ignores the reduced motion setting
