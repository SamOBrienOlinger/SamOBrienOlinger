# Design QA — Focus labelled hexagon diagram

## Scope

- Branch: `portfolio-redesign`
- Request: make the Software, Research and People content readable inside the supplied interlocking hexagon diagram on mobile.
- Release: `7bd38b65abd1c73990e49048993abbb65ebed176`.

## Evidence

- Source visual truth: user-supplied mobile screenshot `IMG_1083.jpeg`.
- Browser-rendered implementation: `https://samobrienolinger.github.io/SamOBrienOlinger/?release=7bd38b6`.
- Implementation capture: cloud-browser homepage view at 1363 × 936 CSS px, DPR 1, light theme, top-of-page state.
- Responsive device checks: Android Chromium at 360 × 800 and 412 × 915; iOS WebKit at 375 × 667 and 393 × 852.

## Comparison history

- [P1, earlier] Independent browser text overlays could wrap or drift over the translucent shapes at narrow widths.
- [P1, interim] Moving the words into separate cards made them legible but did not meet the requested labelled-diagram composition.
- Fix: composed the labels into `assets/images/focus-venn-labelled-v4.webp` so the type and hexagons scale as one visual; invisible semantic hotspots preserve the three corresponding section links.

## Fidelity surfaces

- Typography: the field titles retain high contrast; supporting text has fixed line breaks inside its own hexagon field, with no browser-controlled wrapping.
- Spacing and layout: the 980 × 1090 visual renders as 389 × 433 CSS px in the desktop verification view and remains contained with zero page overflow.
- Colours: cobalt, turquoise, light navy and deep navy from the existing palette are retained.
- Image quality: flattened WebP background matches the white Focus panel, avoiding transparency artefacts.
- Copy: Software — “Full-stack digital products.”; Research — “Evidence, policy and social science.”; People — “Supporting communities.”

## Verification

- Live browser: the `focus-venn-labelled-v4.webp` asset loaded, all three labelled hotspots are present, and page overflow is 0 px.
- Accessibility: the hotspots provide the full text as accessible link names, point to Work, Research and Approach, have visible keyboard focus, and exceed 44 × 44 px.
- Automated checks: the `npm test` step passed in the Android Chromium and iOS WebKit workflow; the GitHub Pages deployment passed.
- Console: no visual error state appeared in the browser during the live smoke check.

## Final result

passed
