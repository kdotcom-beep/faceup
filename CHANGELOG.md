# Changelog

What changed in the Face Up skill and its scanner, and why.

## Unreleased

These changes come from running the skill on two real projects, a static marketing site and a single-page app, where the browser pass missed problems that people then found by hand.

### Added

- **Screens behind a click.** The new `--steps` option checks screens reached by clicking after a page loads, such as views and dialogs in a single-page app. Before, only the first screen at each address was checked.
- **Window width.** The new `--viewport` option runs the browser checks at a chosen width, so a fix can be confirmed at the width where the problem appeared.
- **Moving backwards and phone widths.** The keyboard checks now also move back with Shift+Tab and repeat at 375 pixels wide. A sticky header mostly covers controls in those two cases, which forward tabbing at desktop width missed.
- **Pinned bars in the styles.** A code check finds a bar pinned to the top or bottom of the screen with no matching `scroll-padding`, so the problem is found without a browser.
- **Markup in template strings.** The code checks now read markup built in template strings in plain JavaScript, such as markup set with `innerHTML`. Before, they saw only the HTML files.
- **Text spacing, skip links and dark mode.** The browser pass applies the WCAG text spacing and reports text that is then cut off, reports skip links whose target is missing or hidden, and measures contrast again in dark mode.
- **Undecided axe results.** Places axe could not decide outside the catalogue, such as text over a picture, are now listed in `axeIncomplete` for a person to check. Before, they were dropped, so the report looked cleaner than the page was.

### Changed

- **Two more rules checked by the scanner.** axe's label-in-name and locked text spacing results now report under their Face Up rules instead of outside the catalogue.
- **Blurred headers count as covering.** A pinned layer that blurs what is behind it now counts as covering a control, as a solid one does.
- **Select menus.** A select menu with the same border as a failing text field is listed for a person to check, instead of being skipped.
- **Approving fixes.** When a person approves in general terms, such as "fix the outstanding issues", the skill uses the first option it offered for each and says which.
- **Statuses and passes.** Any rule can need a person's judgement in a particular case, not only rules tagged Judgement. Criteria that apply to every screen pass only when the browser pass reached every screen.
- **One way or two.** The single-way-to-page rule now says when a menu linking to every page is enough on its own.

### Fixed

- The focus outline check no longer reports elements the keyboard never reaches, such as a dialog with `tabindex="-1"`.
- The reduced-motion check accepts a reduce-motion rule that turns off a hover movement, and no longer reports icons that only rotate.

## 27 October 2026

- First release: 59 rules, the skill and its bundled scanner, under the MIT licence.
