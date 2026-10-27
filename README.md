# Face Up

Face Up is a skill for AI coding assistants such as Claude Code and Codex. It checks a web project for 59 accessibility and usability failures that look fine in a screenshot, anchored to WCAG 2.2 Level A and AA and to published usability heuristics, and fixes the ones you choose.

## Install

Run this in your project folder:

```sh
npx skills add kdotcom-beep/faceup
```

Then type `/faceup` in Claude Code, or ask another assistant to run the Face Up skill. If your site runs on your computer, give the skill its address, such as http://localhost:5173, so it also checks the pages in a browser.

## What it does

- Reports each problem with its rule, location and fix, then fixes the ones you choose, one at a time.
- Asks first when a fix would change the design or the words people read.
- Includes a scanner that runs axe, a widely used accessibility checker, and Face Up's own checks on your code and pages.
- Sweeps all 55 WCAG 2.2 Level A and AA success criteria, and explains what to look for wherever something needs manual review.

## Requirements

- An AI coding assistant that supports skills.
- Node 18.3 or later.
- Chrome or Edge, to check pages in a browser.

## What the findings mean

Findings are against the Face Up catalogue only. Zero findings is not a claim of WCAG conformance.

## Licence

MIT. See [LICENSE](LICENSE).
