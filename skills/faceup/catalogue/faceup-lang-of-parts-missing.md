---
id: faceup-lang-of-parts-missing
title: Passage in another language is not marked
summary: "Passages in a different language from the rest of the page must be marked with their language. Otherwise screen readers mispronounce them, and translation tools treat them as the page's language."
failure_mode: naming-and-semantics
tier: 2
severity: failure
anchor:
  wcag:
    - criterion: "3.1.2"
      name: Language of Parts
      level: AA
  heuristic: []
  ai_signature: "Generated content drops foreign-language quotes, titles and language names into the page as plain text, with no lang attribute on the element that holds them."
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
  manual_test: "Read the page for quotes, titles and passages in a language other than the page's own, and check that each one sits in an element with a lang attribute naming its language."
related: [faceup-lang-missing, faceup-control-missing-name, faceup-heading-order]
added: 2026-10-21
---

## What it looks like

An English page quotes a French review and lists language names in their own languages, but none of them is marked with its language.

```jsx
<blockquote>
  <p>Un séjour inoubliable, le personnel était aux petits soins.</p>
  <footer>Review from Lyon</footer>
</blockquote>

<ul className="language-switcher">
  <li><a href="/en">English</a></li>
  <li><a href="/de">Deutsch</a></li>
  <li><a href="/ja">日本語</a></li>
</ul>
```

Because the page is marked as English, everything inside it counts as English.

## Why it fails

- Screen readers pronounce the French with English sounds and may misread the Japanese, and braille displays and translation tools rely on the same language code.
- Fails WCAG 2.2 success criterion 3.1.2, Language of Parts, Level AA, when a passage in another language is not marked in the code.
- Not a failure: proper names, technical terms, words whose language is unclear, and borrowed words such as "café" or "déjà vu".

## The fix

Put a `lang` code, such as "fr" or "ja", on the element that holds the passage.

```jsx
<blockquote lang="fr">
  <p>Un séjour inoubliable, le personnel était aux petits soins.</p>
  <footer lang="en-AU">Review from Lyon</footer>
</blockquote>

<ul className="language-switcher">
  <li><a href="/en" lang="en">English</a></li>
  <li><a href="/de" lang="de" hrefLang="de">Deutsch</a></li>
  <li><a href="/ja" lang="ja" hrefLang="ja">日本語</a></li>
</ul>
```

Elements inside a marked element inherit its code, which is why the footer sets English again. For translated text, store the language of each piece and set it on the element that shows it.

## How it is detected

**What checks it today.**
- The Face Up skill reads components and content for text in another language with no `lang`.
- A person confirms each finding, and no finding blocks a release.
- The scanner does not check this rule. When axe, a widely used testing tool, finds an invalid code such as `lang="french"`, the scanner reports it outside the Face Up catalogue.
- axe cannot detect a missing code, which is what this rule covers.

**What it cannot catch.**
- Whether a word is borrowed, or whether a code names the right language, which needs someone who reads the content.
- Text loaded from an outside source while the page runs.

## Related rules

- `faceup-lang-missing` - the page has no valid language code
- `faceup-control-missing-name` - a control announced with no name
- `faceup-heading-order` - heading levels skip or run out of order
