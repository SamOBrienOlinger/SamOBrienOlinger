# Design QA — Focus labelled hexagon diagram

## Scope

- Branch: `portfolio-redesign`
- Requested outcome: keep the supplied interlocking hexagons and make the Software, Research and People text readable inside them on mobile.
- Implemented revision: labels are part of the single responsive WebP visual; transparent hotspots retain keyboard and screen-reader navigation.

## Evidence

- Source visual truth: user-supplied mobile screenshot `IMG_1083.jpeg`.
- Implementation: browser-rendered homepage at `https://rawcdn.githack.com/SamOBrienOlinger/SamOBrienOlinger/RELEASE/index.html`.
- Browser viewport: 1363 × 936 CSS pixels, DPR 1, light theme, homepage top.
- Responsive workflow: Android Chromium at 360 × 800 and 412 × 915; iOS WebKit at 375 × 667 and 393 × 852.

## Findings

- [P1, fixed] Independent HTML labels could wrap or drift over the translucent hexagons at small widths.
  - Fix: composed the exact labels into `assets/images/focus-venn-labelled-v4.webp`, leaving only invisible accessible links over their corresponding regions.
  - Evidence after fix: rendered diagram is 389 × 433 CSS pixels with a 980 × 1090 source asset; all visible copy scales as one object, and page horizontal overflow is 0 pixels.

## Fidelity surfaces

- Typography: labels use strong, high-contrast title weights with supporting lines arranged within their own hexagon fields; no independent browser wrapping remains.
- Spacing and layout: fixed artwork preserves label-to-shape alignment at every scale; panel stays within its container.
- Colours: existing cobalt, turquoise, light-navy and deep-navy hexagons are retained.
- Image quality: flattened WebP has a white background matching the panel, preventing transparency/halo artefacts.
- Copy: Software — “Full-stack digital products.”; Research — “Evidence, policy and social science.”; People — “Supporting communities.”

## Verification

- Browser rendering: image loaded successfully, all three accessible hotspots present, no horizontal overflow.
- Interaction: hotspots link to Work, Research and Approach and meet the 44 × 44 px minimum touch target.
- Device workflow: Android Chromium and iOS WebKit checks are required for this revision.

## Comparison history

- Previous approach: separate text overlays and, later, separate text cards; both departed from the intended labelled-diagram composition.
- Current approach: labels baked into the responsive visual with semantic controls preserved over the matching regions.

## Final result

blocked
