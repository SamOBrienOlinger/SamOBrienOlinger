# Design QA — Focus diagram text layout

## Scope

- Branch: `portfolio-redesign`
- Verified implementation commit: `1718f9e081a3cee760276c79aee9bc61cb392770`
- Live URL: `https://samobrienolinger.github.io/SamOBrienOlinger/?release=1718f9e`
- Requested fix: make the text inside the Focus diagram readable, consistently wrapped and contained within the three coloured regions.

## Evidence

- Source visual truth: `IMG_1083.jpeg`
- Browser-rendered implementation: `portfolio-focus-text-fixed-live-1718f9e.jpg`
- Focused comparison: `focus-text-comparison-1718f9e.jpg`
- Source pixels: 1125 × 1166, supplied iPhone screenshot at approximately 3× density
- Implementation pixels: 1348 × 926
- Browser CSS viewport: 1363 × 936 at DPR 1
- Density normalization: both focused panel crops were resized to 650 px high for side-by-side inspection
- State: light theme, homepage Focus panel

## Findings

- No remaining P0, P1 or P2 findings.
- Fonts and typography: mobile title sizing was reduced from the earlier 4.5vw/1.35rem rule to 3.6vw/0.95rem; descriptions now use 2.5vw/0.72rem, 1.25 line height and balanced wrapping.
- Spacing and layout rhythm: mobile labels receive smaller internal padding and stable percentage zones. Software and Research are centred in the upper lobes; People remains centred in the lower lobe.
- Colours and tokens: existing cobalt, turquoise, light navy and deep navy remain unchanged. Foreground contrast is preserved for all three labels.
- Image quality and asset fidelity: the existing WebP diagram remains sharp and unchanged; only the semantic HTML text overlay was corrected.
- Copy and content: wording remains exactly “Full-stack digital products.”, “Evidence, policy and social science.” and “Supporting communities.”
- Responsive behaviour: Android Chromium and iOS WebKit workflow checks passed. The deployed desktop capture has zero horizontal overflow; the mobile rules now constrain title and copy sizes rather than allowing the earlier oversized wrapping.

## Primary interactions tested

- Software links to `#work`.
- Research links to `#research`.
- People links to `#about`.
- Focus image loads successfully.
- No site-origin console errors were recorded.

## Comparison history

- Earlier finding (P2): at iPhone width, title and description sizes consumed too much of each lobe; Research crowded the right edge and descriptions wrapped into uneven tall columns.
- Fix: reduced mobile typography and padding, tightened line height, balanced copy wrapping, widened the mobile label zones and moved Research inward.
- Post-fix evidence: deployed browser capture shows compact label groups; automated iOS WebKit and Android Chromium responsive checks pass without overflow.

## Final result

passed
