---
id: faceup-infinite-scroll-no-url-state
title: "Infinite scroll loses the person's place"
summary: "A feed that loads more as you scroll forgets your place when you leave or reload. Save the position in the web address so you come back to where you were."
failure_mode: flow-and-memory
tier: 2
severity: ux-failure
anchor:
  wcag: []
  heuristic:
    - "Nielsen: user control and freedom"
    - "Nielsen: visibility of system status"
  ai_signature: "A scroll listener appends the next page of results to a list with no history entry and no URL parameter, so the scroll position and page depth live only in transient component state."
surfaces: [route, flow]
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
  manual_test: "Scroll several pages into the feed, open an item, press Back, and confirm the feed returns you to the same item and depth."
related: [faceup-back-discards-data, faceup-missing-loading-state, faceup-focus-obscured-sticky]
added: 2026-09-07
---

## What it looks like

A feed loads more items as you scroll, but saves nothing to the web address or the browser history.

```jsx
function Feed() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    function onScroll() {
      if (nearBottom()) setPage((p) => p + 1);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetchPage(page).then((next) => setItems((prev) => [...prev, ...next]));
  }, [page]);

  return (
    <>
      {items.map((it) => <Card key={it.id} item={it} />)}
      <footer>About - Terms - Contact</footer>
    </>
  );
}
```

If you open the 40th item and press Back, the feed starts again at the top. The footer also keeps moving away as more items load, so you never reach it.

## Why it fails

- Keyboard and switch users, people with motor impairments, and people on slow connections have to scroll the whole way down again, and footer links such as terms, privacy and contact stay out of reach.
- This is not a WCAG failure, but it fails two Nielsen heuristics: user control and freedom, and visibility of system status.
- WCAG 2.2 success criterion 2.4.5, Multiple Ways, Level AA, covers the ways people find pages and is listed here as related context only.

## The fix

Save the number of loaded pages in the web address, so the feed can reload those pages and restore the scroll position when the person returns.

```jsx
function Feed() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") ?? "1");
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(0);
  const restored = useRef(false);

  useEffect(() => {
    if (loaded >= page) return;
    const wanted = Array.from({ length: page - loaded }, (_, i) => loaded + i + 1);
    Promise.all(wanted.map(fetchPage)).then((batches) => {
      setItems((prev) => [...prev, ...batches.flat()]);
      setLoaded(page);
    });
  }, [page, loaded]);

  useEffect(() => {
    if (restored.current || loaded < page) return;
    restored.current = true;
    window.scrollTo(0, Number(sessionStorage.getItem("feed-scroll") ?? "0"));
  }, [page, loaded]);

  useEffect(() => {
    const save = () => {
      if (restored.current) sessionStorage.setItem("feed-scroll", String(window.scrollY));
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);

  function loadMore() {
    setParams({ page: String(page + 1) }, { replace: true });
  }

  return (
    <>
      {items.map((it) => <Card key={it.id} item={it} />)}
      <button type="button" onClick={loadMore}>Load more</button>
      <footer>About - Terms - Contact</footer>
    </>
  );
}
```

Loading more replaces the current history entry instead of adding one, so a single press of Back leaves the feed. The "Load more" button also gives people a way to reach the footer. If the feed must load on scroll, still save the page number and restore the position, and move the footer links somewhere other than below the list.

## How it is detected

**What checks it today.**
- The Face Up skill reads the code for lists that load more on scroll but save nothing to the web address or history.
- The scanner does not check this rule, and no finding blocks a release.

**What it cannot catch.**
- Whether the person's place is actually lost, since the code pattern is only a warning sign.
- Whether the restored position is right, or whether the footer links can be reached.

## Related rules

- `faceup-back-discards-data` - going back throws away what you entered or where you were
- `faceup-missing-loading-state` - new content loads with no sign of progress
- `faceup-focus-obscured-sticky` - a pinned bar covers the item the keyboard is on
