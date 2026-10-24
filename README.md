# Lived Data Collective

Static website for the Lived Data Collective.

## Code map

- `index.html`, `people.html`, `research.html`, `join-us.html`, and `publications.html` contain page structure. The site header is intentionally repeated in each page so the site can be opened directly without a build step; keep its navigation labels and order in sync.
- `styles.css` contains shared tokens and page styles. Sections are organized in page order after the shared foundations.
- `scripts/shared.js` provides the shared header scroll state.
- `alive.css` and `scripts/alive.js` add the "alive" layer on every page: the heart mascot (on the home page the `ldc-seal.png` stays still and only the heart's eyes follow the mouse; a companion heart sits beside the wordmark; a heart peeks up as the back-to-top button), page-to-page transitions, title squiggles and scroll rises. All motion respects reduced-motion settings.
- `assets/mascot/heart-face.svg` is the vector heart (traced from `ldc-seal.png`) used for the header and back-to-top hearts. `assets/paper-dark.jpg` is the seamless paper texture behind every page.
- `scripts/home.js`, `scripts/people.js`, and `scripts/research.js` contain behavior used only by their matching pages.
- `scripts/publications-data.js` is the single source of truth for publication content.
- `scripts/publications.js` renders publication cards, filters, and the featured-work carousel.

## Add A Publication

Add one object to `scripts/publications-data.js`. Provide the title, authors, lab member names, venue, year, type, theme, links, and thumbnail. The publication page derives the featured carousel, archive cards, and filter options from that data automatically.

Add an optional `award` (for example `award: "Best Short Paper Award"`) to show an ochre trophy badge on that publication's card. Use a `paper`, `poster`, `web`, or `video` link type. Empty link URLs render as unavailable placeholders, so they can be added before all materials are published.

The All Work archive groups publications by their numeric `year`, newest first. Adding a publication from another year automatically creates its year heading. Filters apply across all years and hide any year groups with no matching papers. The featured carousel automatically shows the first five publications in this order (or all available entries when there are fewer than five), with one navigation dot per entry. Entries within the same year follow their order in the data file.

Filter options are generated from the publication data, so new venues and types appear automatically. Use consistent venue labels such as `IEEE VIS` and `ACM CHI`. Archive thumbnails share a 16:9 frame, while titles wrap at a consistent size.

## Prospective PhD popup

Edit the `prospective-phd-dialog` content in `join-us.html`. Its trigger is in the Students card. `scripts/join-us.js` handles opening, closing, and focus restoration; `.join-phd-*` rules in `styles.css` control its appearance.
