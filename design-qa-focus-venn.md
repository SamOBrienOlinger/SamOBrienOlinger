# Design QA — Focus section readability redesign

## Scope

- Branch: `portfolio-redesign`
- Verified implementation commit: `b3d799c0b0cb8a50193176fae0918423c9562ff7`
- Request: remove the congested, low-contrast text from the overlapping Focus graphic and bring the component to a production-quality responsive standard.

## Evidence

- Source: user-supplied mobile screenshot `IMG_1084.jpeg`.
- Implementation: published GitHub Pages homepage at 1363 × 936 CSS pixels.
- Automated coverage: Android Chrome at 360 × 800 and 412 × 915; iOS WebKit at 375 × 667 and 393 × 852.

## Findings

- The three overlapping shapes remain as the section's visual relationship.
- The diagram contains only the shared outcome, “Public value,” centred in a solid, high-contrast field.
- Software, Research and People now appear as separate semantic links below the diagram, so no explanatory copy crosses translucent overlaps.
- Supporting text is shorter and clearer: “Useful, accessible digital products,” “Evidence that informs decisions,” and “Technology that serves communities.”
- Each link has a distinct colour marker, visible boundary, hover/focus treatment and a touch target larger than 44 × 44 pixels.
- The links use a three-column tablet layout and a compact single-column mobile layout without horizontal overflow.
- Dark-theme contrast and reduced-motion preferences are preserved.

## Verification

- GitHub Pages deployment passed for commit `b3d799c0b0cb8a50193176fae0918423c9562ff7`.
- Responsive device checks passed across all four Android/iOS profiles.
- Published desktop view has zero horizontal overflow and all three links point to their corresponding sections.
- No P0, P1 or P2 findings remain.

## Final result

passed
