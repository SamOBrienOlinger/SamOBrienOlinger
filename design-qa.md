# Design QA — Focus Venn diagram

## Scope

- Branch: `portfolio-redesign`
- Verified implementation commit: `b682eb74853ee05c332be04335121af6b1b4501e` (published in release `d37dfb5`)
- Live URL: `https://samobrienolinger.github.io/SamOBrienOlinger/?release=d37dfb5`
- Requested change: use the supplied interlocking-hexagon geometry for the Focus section, recoloured to the site's cobalt, turquoise, light-navy and deep-navy palette.

## Evidence

- Source visual truth: `IMG_1081.jpeg`
- Browser-rendered implementation: `portfolio-focus-venn-deployed-d37dfb5.jpg`
- Focused side-by-side comparison: `focus-venn-comparison-b682eb7.jpg`
- Source image: 1125 × 1117 pixels
- Implementation capture: 1363 × 936 CSS viewport at DPR 1; Focus panel crop normalized to the source height for comparison
- State: light theme, homepage at the top of the page

## Findings

- No P0, P1 or P2 findings.
- Three overlapping hexagons and a darker shared centre preserve the reference's visual relationship.
- Neon reference colours are replaced with the existing site's cobalt, turquoise, light-navy and deep-navy palette.
- Software, Research and People remain semantic, keyboard-focusable links to the corresponding page sections.
- Each title and description is positioned within its coloured field; Research uses a narrower right-hand zone for legibility.
- Narrow screens switch the panel to a single block, keeping the square diagram intact and preventing horizontal overflow.
- `assets/images/focus-venn-hexagons.webp` loads successfully.

## Verification

- Browser-rendered page: zero horizontal overflow and zero site-origin console errors.
- Focus panel: 434.3 × 474.6 CSS px; diagram: 389.1 × 389.1 CSS px in the desktop verification viewport.
- Responsive device-check workflow passed for the published commit and covers Android Chromium and iOS WebKit profiles.
- Pages build and deployment passed for the published commit.
- Stylesheet cache markers were advanced so the deployed page receives the final label positioning.

## Comparison history

- Initial Venn implementation was compressed by a stale stylesheet and a legacy mobile grid override.
- Fix: widened the hero grid, forced the Venn panel to block layout, invalidated the CSS cache and moved each label into its own colour field.
- Post-fix: deployed page shows the selected geometry, readable labels and preserved homepage hierarchy.

## Final result

passed
