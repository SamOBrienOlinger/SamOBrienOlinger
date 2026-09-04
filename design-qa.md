# Design QA — portfolio hero copy

## Scope

- Deployed branch: `portfolio-redesign`
- Verified content commit: `33f860b6ca21a13ff068f050bb3c00e550b04eba`
- Live URL: `https://samobrienolinger.github.io/SamOBrienOlinger/?release=33f860b`
- Requested change: replace “community” in the hero description with “empowering people”

## Evidence

- Source visual truth: `/workspace/scratch/a4ba07158abf/upload/IMG_1077.jpeg`
- Browser-rendered implementation: `/workspace/scratch/portfolio-hero-copy-focused-33f860b.jpg`
- Side-by-side comparison: `/workspace/scratch/portfolio-hero-copy-comparison-33f860b.jpg`
- Source image: 1125 × 1190 pixels; annotated mobile crop
- Implementation image: 1363 × 936 pixels; 1363 × 936 CSS viewport at DPR 1
- State: light theme, hero copy and actions visible

The source is an annotated mobile crop rather than a full viewport reference, so the comparison is focused on the requested copy and preservation of the existing hero hierarchy. Exact cross-viewport geometry is not treated as a fidelity target.

## Findings

- No P0, P1 or P2 findings.
- The rendered sentence reads: “Software developer and researcher working across technology, policy and empowering people.”
- Fonts and typography: existing family, weight, line height and hierarchy preserved.
- Spacing and layout rhythm: no CSS changed; hero spacing and actions remain stable.
- Colours and visual tokens: unchanged.
- Image quality and asset fidelity: unchanged; no failed images detected.
- Copy and content: requested replacement is exact and grammatically integrated.

## Interaction and responsive verification

- Live desktop page has zero horizontal overflow and no site-origin console errors.
- Responsive device workflow passed all eight navigation, touch-target and overflow checks across the existing Android Chromium and iOS WebKit profiles.
- No focused interaction retest was necessary because only static text changed; the primary hero links remain present and unchanged.

## Comparison history

- Initial state: hero description ended with “community.”
- Fix: changed only the final concept to “empowering people.”
- Post-fix evidence: deployed browser capture shows the new sentence without layout or visual regression.

## Final result

passed
