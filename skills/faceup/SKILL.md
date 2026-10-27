---
name: faceup
description: Review a web project's source code for the UX and accessibility failures in the Face Up catalogue, 59 rules anchored to WCAG 2.2 and published usability heuristics, and report each finding with its rule ID, severity and anchor. Use when asked to audit, review or check interface code for accessibility or usability problems, or when the user mentions faceup.
---

# Face Up

Face Up is a catalogue of UX and accessibility failures that interfaces ship: the ones that look fine in a screenshot and fail when a real person uses the page. This skill reads a project's source, checks it against every rule in the catalogue, sweeps WCAG 2.2 Level A and AA, and reports what it finds.

Files next to this one:
- `rules.md`: the 59 rules, each with its severity, anchors, what the scanner checks and whether it needs judgement.
- `catalogue/<rule-id>.md`: each rule in full. Read "How it is detected" before checking a rule. Most code examples are React, and some are plain HTML or CSS. Apply each rule by what it means, whatever the framework.
- `wcag-criteria.md`: the 55 Level A and AA criteria, with the rules that cover each one, what the scanner checks for it, and its manual test.
- `scanner/`: the Face Up scanner, which runs axe and Face Up's own checks.

## How to run a review

1. **Set the scope.** Review the path the user names. If they name none, review the whole project. Skip `node_modules`, build output and generated files.
2. **Map the project before checking rules.** Note the framework, the pages or routes, any multi-step flows and their steps, the forms and their fields, where data is loaded, the shared layouts, and the global styles. Note where the page language and titles are set (see "Other frameworks" below). Many rules depend on how files relate to each other, so this map comes first.
3. **Run the scanner.** Follow "Running the scanner" below. If it cannot run, say why in the report's opening paragraph and carry on by reading the code.
4. **Decide which rules apply.** Go through `rules.md`. A rule applies when the project has the thing it is about, even if that thing turns out to be fine. A rule about media does not apply to a project with no audio or video. When the thing a rule is about lives outside the reviewed path, such as the global styles of a host app, list the rule under "Not decided" and say where to look.
5. **Check each rule that applies.** Start from what the scanner reported for it, then read its catalogue file and the code. For a rule tagged "Scanner: none", the scanner saying nothing means nothing: you must decide it from the code. Follow flows across files, because a failure across steps or pages is often invisible in any single file.
6. **Sweep WCAG 2.2 Level A and AA.** Follow "The WCAG sweep" below.
7. **Write the report** in the format below.
8. **Do not change any code during the review.**
9. **After the report, offer to fix the findings**, as "Fixing findings" below describes.

## Running the scanner

The scanner needs Node 18.3 or later. The first time, run `npm install` inside `<this folder>/scanner`, where `<this folder>` holds this SKILL.md. That downloads the scanner's own packages (a code parser, Playwright and axe) into that folder. Do not install anything in the user's project.

**Code scan.** From the project's own folder, so file paths come out relative to it, run:

`node "<this folder>/scanner/bin/faceup-scan.mjs" . --format json`

It reads React components (`.js`, `.jsx`, `.ts`, `.tsx`) and the HTML and CSS files under the folder you give it. It does not read `.vue`, `.svelte`, `.astro` or template files.

**Browser pass.** If the site can run on this computer, check it in a browser too:
- Ask the person whether it is running and at what address. If you cannot ask, look for a server that is already running, or start one with the project's own dev or preview command. If that command fails, for example because the project's packages are not installed, skip the browser pass and say so. Do not install the project's packages yourself.
- For a plain HTML site with no server, you can use `file://` addresses of its HTML files.
- Use local addresses only, such as `localhost`, `127.0.0.1` or `file://`. Never point the browser pass at a live site unless the person asks, and never sign in.
- Run `node "<this folder>/scanner/bin/faceup-scan.mjs" --format json --url <address>`, with one `--url` for each page you mapped, including each step of a flow you can reach by its address.
- It opens each page in Chrome or Edge, runs axe and Face Up's browser checks, and presses Tab, Shift+Tab and Escape on the page, at 1280 and 375 pixels wide. It also checks reflow at 320 pixels, text spacing, motion with reduce-motion on, and contrast in dark mode when the page has dark styles. It does not submit forms. Each page has a two-minute limit.
- **Screens without their own address**, such as views and dialogs in a single-page app, or screens that need saved data: read the code to find the clicks that reach each one, write them to a JSON file, and add `--steps <file>`. Each state is checked as its own page, named "<url> (<name>)" in the output. A step that does not work is reported in `pageErrors` with the step; fix the selector and run it again. The file looks like this:

```json
{
  "states": [
    { "name": "Settings dialog", "url": "http://localhost:5173/", "steps": [{ "click": "#settings" }, { "waitFor": "dialog[open]" }] }
  ]
}
```

  Steps are `click`, `fill` or `select` (each with `value`), `press` (a key), `waitFor` (a selector) and `wait` (milliseconds, up to 10000). Add `"storageState": "<file>"` to load a saved Playwright storage state, such as saved data, into every window. Cover every screen a person can reach, including each dialog, before you pass page-level criteria.
- If neither Chrome nor Edge is installed, it says so. Ask the person before running `npx playwright install chromium` in the scanner folder, because that downloads a browser.
- Stop any server you started when the review is done.

**Reading the output.**
- **Exit code:** 0 means nothing fails the build, 1 means a finding fails the build (a normal result, not a crash), and 2 means the command itself failed.
- **`filesScanned`:** how many files the code scan read. When it is 0, the code scan read nothing, so its silence means nothing.
- **`parseErrors` and `skipped`:** files that could not be read or looked generated. Name them in the opening paragraph.
- **`findings`:** each finding is evidence for its rule. A code finding gives a file, line and column. A browser finding gives the page address in `file` and `page`, line 0, and a CSS selector. `source` says whether axe or Face Up found it.
- **`count` and `places`:** when the same kind of problem repeats on a page, it is one finding with a count and up to 10 places, each with its own selector and message. One shared component usually causes them all, so find it and fix it once.
- **`review`:** a finding with `"review": true` may be wrong. Confirm it before reporting it as Found (see "Evidence and status").
- **`notAssessed`:** places a check could not decide, each with a `reason`. Decide each from the code if you can and explain it in Notes. Otherwise list the rule under "Not decided". An entry with `rule: null` is a page area the browser pass could not enter, such as a sandboxed frame.
- **`browser.pages`:** the pages the browser pass actually checked.
- **`browser.pageErrors`:** pages it could not check, with the reason.
  - With `movedTo`, the server sent that address on to another one: run the browser pass on the `movedTo` address instead.
  - When a page "went to" another address by itself, the screen usually needs state first, such as saved data, a sign-in or settings in its address. Read the code to find an address that shows the screen directly, and run it again.
  - Pages behind a login, and pages that showed a bot check, were not checked. Say which.
- **`browser.axeOther`:** what axe found outside the Face Up catalogue. Entries with WCAG criteria in `wcag` are evidence for those criteria in the sweep. Entries with an empty `wcag` list are axe best practices: report them under "Outside the catalogue", not in the sweep.
- **`browser.axeIncomplete`:** places where axe could not decide a check outside the catalogue, such as colour contrast for text over a picture, with the WCAG criteria in `wcag` and up to 20 selectors. A person must check each one. A criterion with entries here cannot pass: mark it Needs a person and name the selectors.

## Evidence and status

- **Evidence.** A code finding needs the file, the line and the code quoted. For code that spans several lines, give the range, such as `src/Form.jsx:12-18`. A browser finding needs the page address and the selector. Trace it back to the code that produces it and quote that code when you can find it.
- **Status.** Give each finding one of three statuses:
  - **Found**: the code shows the failure, or the scanner reported it and you confirmed it in the code.
  - **Confirm in a browser**: the code points to the failure, but only the running page can settle it, or the browser pass reported it and you could not trace it in the code. Give the rule's `manual_test`.
  - **Needs your judgement**: the code shows what the rule describes, and a person has to decide whether it is wrong here. Explain what to weigh. Every finding for a rule tagged "Judgement" gets this status. Other rules can need it in a particular case, such as a field whose purpose fits more than one autocomplete value, or two labels that may or may not name the same action. Use it there too, and say why.
- **One finding per rule.** When a rule fails in several places, list every location in that one finding. If its locations have different statuses, mark each location's status and give the finding the strongest one: Found, then Confirm in a browser, then Needs your judgement.
- **Certain from the code.** A rule that usually needs a browser can still be Found when the code makes the answer certain, such as two literal colours whose contrast you can calculate. Show the calculation.
- **No guessing.** When the code points neither way, the rule is not a finding. List it under "Not decided" with its manual test.

## Accuracy rules

- Use the severity in the rule file. Never raise a UX failure to an Accessibility failure.
- The rule file decides its own edge cases. When it says a case is advice only, good practice, or not a failure on its own, do not report that case as a finding. Put it under Notes and say what the rule file says.
- Cite every WCAG criterion and heuristic in the rule's `anchor`, in the order the rule file lists them. Never add a criterion or change a level.
- Do not write out what a screen reader would announce. Describe the problem in plain terms, such as "this button has no name".
- Use plain language. Explain any technical term the first time you use it.
- **faceup-redundant-entry-multistep needs extra care.** Matching field names across steps flagged 13 repeats in 20 real multi-step forms, and none were real. Treat a repeated field as a lead only. Report it as Found only when an earlier step clearly collects the same details about the same person and nothing carries the answer forward. Otherwise report it as Needs your judgement.

## The WCAG sweep

Every one of the 55 criteria in `wcag-criteria.md` ends up in exactly one group: Fails, Passes or Needs a person.

- **Fails** when you have evidence of a failure from any of these: a Found Face Up finding whose rule file treats it as a failure of that criterion, a confirmed `axeOther` entry tagged with it, or your own reading of the code. A failure needs the same evidence as a finding, and a fix.
- **Face Up rules cover only the failures they describe.** A criterion's rules finding nothing does not make it pass. Use its "Scanner" note to see what was checked automatically, and check the rest yourself.
- **Passes** only when every part of the criterion was checked, by the rules, the scanner or your reading, and nothing was wrong. A criterion about something the project does not have, such as captions on a site with no video, passes as not applicable.
- **Needs a person** when any part could not be checked. This includes a part "decided by the running page" when the browser pass did not run or could not check the pages that matter, and a criterion whose covering finding is Confirm in a browser or Needs your judgement. Criteria that apply to every screen, such as 2.4.3 Focus Order and 2.4.7 Focus Visible, pass only when the browser pass reached every screen, including each dialog and view; otherwise they need a person.
- Judge each criterion by what the W3C's Understanding document for it requires. Never invent a requirement, a criterion number or a level.
- The sweep covers Level A and AA only. AAA criteria cited in rule anchors stay in the findings.
- "Passes" means nothing wrong was found in what could be checked. Never describe the project as conformant.

## Report format

Start with one paragraph on what was reviewed: the path, the framework, the flows and pages you traced, whether the code scan and browser pass ran, and any files or pages they could not check.

Then list findings under two headings, in this order: **Accessibility failures**, **UX failures**. Leave out a heading with no findings. Write each finding like this:

```
faceup-div-as-button: Clickable element that is not a button
Accessibility failure. WCAG 4.1.2 Name, Role, Value (Level A); WCAG 2.1.1 Keyboard (Level A). Found.
src/components/SaveBar.jsx:14
  <div className="btn" onClick={save}>Save</div>
The Save control is a div with a click action. The keyboard cannot reach it.
Fix: use a button element.
```

A rule with no WCAG criterion cites its heuristic instead:

```
faceup-missing-empty-state: Empty list shows nothing
UX failure. Heuristic: Nielsen: visibility of system status; Heuristic: Nielsen: help users recognise, diagnose, and recover from errors. Found.
src/pages/Orders.jsx:31-36
  {orders.map(order => <OrderRow key={order.id} order={order} />)}
When there are no orders, the page shows a heading and nothing under it.
Fix: when the list is empty, say why and give one next step.
```

Then these sections, leaving out any that would be empty. Keep the lists short: they show the work was done, and the findings are what matter.

- **WCAG 2.2 A and AA.**
  - *Fails*: each failing criterion, headed like "WCAG 1.1.1 Non-text Content (Level A). Fails.", then its evidence and fix in the same layout as a finding. When the failure is already a Face Up finding above, name the rule instead of repeating the evidence. Failures no Face Up rule covers are real and need fixing, but they are not counted as Face Up findings.
  - *Needs a person*: one line per criterion, with its manual test cut to one short sentence. When a finding or rule above already gives the same test, name it instead.
  - *Passes*: one line listing the criterion numbers, with "(not applicable)" after any that passed for that reason.
- **Not decided**: one line per rule you could not decide, with its manual test.
- **Checked, no findings**: one line listing the rule IDs that applied and passed. Rules whose only matches went to Notes belong here.
- **Not applicable**: one line listing the rule IDs that do not apply.
- **Notes**: at most five, most important first: anything a rule file asks you to note that is not a finding, such as a flow with no help at all under faceup-consistent-help, and cases a rule file calls advice only.
- **Outside the catalogue**: at most five, most important first: real problems no rule covers, such as keyboard focus lost when a step changes, and axe best practices. They are not counted.
- **Count**, in this form, where the rule numbers add up to 59 and the WCAG numbers add up to 55: "3 findings: 2 Accessibility failures, 1 UX failure. 2 Found, 0 Confirm in a browser, 1 Needs your judgement. 4 rules not decided, 30 checked with no findings, 22 not applicable. WCAG: 3 criteria fail, 40 pass, 12 need a person."

The report ends with this sentence, exactly as written:

Findings are against the Face Up catalogue only. Zero findings is not a claim of WCAG conformance.

## Fixing findings

After the closing sentence, in a separate message if you can send one, offer to fix the findings. Fix only when the person says yes, and only the findings they choose.

1. **One finding at a time**: Accessibility failures first, then UX failures, then WCAG failures outside the catalogue. For those, follow the W3C Understanding document's sufficient techniques.
2. **Follow the rule file's fix**, written in the project's own framework and conventions. Change only what the finding needs. Never quiet a check with a workaround, such as an `aria-label` that does not match the visible text.
3. **Ask first** when the fix is a product, design or content decision: adding an undo or a confirm step, changing colours or layout, or changing any words people read, such as button and link text, labels, headings, alt text and error messages. Offer one or two options and wait. If the person then approves in general terms, such as "fix the outstanding issues", without choosing, use the first option for each and say which one you used.
4. **Verify each fix** against the rule file's fix and its "How it is detected". Then run the scanner check that found it again: the code scan, or the browser pass on the same page. The browser pass runs 1280 pixels wide by default; for a finding at another width, add `--viewport` with that width, such as `--viewport 375`. When no scanner check covers the finding, follow the rule file's manual test and report it as needing a person to confirm. A fix is done only when it matches the rule file's fix and the check no longer reports it.
5. **Report the outcome** after each one: fixed and confirmed, fixed but needs a person to confirm (give the manual test), or not fixed and why.
6. **At the end, run the whole code scan again, and the browser pass if it ran before**, so a fix in one place has not caused a finding somewhere else.

## Other frameworks

- **Vue, Svelte, Angular and Astro**: the code scan reads only their plain HTML and CSS files, so most of its checks find nothing there. Read the component files against every rule yourself, and rely on the browser pass for what it measures.
- **Plain HTML sites**: the code scan reads the HTML and CSS. Use `file://` addresses for the browser pass if no server runs.
- **Plain JavaScript apps**: the code scan also reads markup built in template strings, such as markup set with `innerHTML` or returned from render functions, and reports it at its own line. Pieces it could not read are listed in `notAssessed`; read those yourself. Markup built with `createElement` is seen only by the browser pass, so use `--steps` to reach the screens it builds.
- **Where the page language and titles live**:
  - Next.js app router: `app/layout.tsx` and `metadata` or `generateMetadata` in each route.
  - Next.js pages router: `pages/_document` and `next/head`.
  - Vite, Create React App and Vue: `index.html`, plus whatever sets `document.title`, such as route meta.
  - SvelteKit: `src/app.html` and `<svelte:head>`.
  - Astro: the layout component's `<html>` and `<title>`.
