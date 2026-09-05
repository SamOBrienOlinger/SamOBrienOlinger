# Design QA — Focus label colour refinement

## Scope

- Branch: `portfolio-redesign`
- Request: change the highlighted Research and People text from black to coordinated tones derived from the existing white Software text.
- Candidate asset: `assets/images/focus-venn-labelled-v5.webp`.

## Evidence

- Source visual truth: user-supplied screenshot `IMG_1088.jpeg`.
- Prototype: local cloud-browser homepage at 1363 × 936 CSS px, DPR 1, light theme, top-of-page state.
- The revised WebP loaded at its intrinsic 980 × 1090 pixels.

## Comparison history

- [P1, fixed] Black Research copy crossed the dark overlap and disappeared visually; black People copy felt disconnected from the white Software treatment.
- Fix: Research now uses a soft aqua-white heading and a related pale aqua-white description. People uses a cool white heading and a slightly quieter pale blue-white description.
- The existing Software whites remain unchanged as the palette anchor.

## Fidelity surfaces

- Typography: wording, hierarchy, weight, line breaks and alignment remain intact; only the requested foreground colours changed.
- Spacing and layout: the 980 × 1090 visual remains contained in the Focus panel and scales as one object.
- Colours: the three existing shape colours are preserved; all label colours now belong to a coordinated cool-white family.
- Image quality: the revised flattened WebP retains a clean white background and crisp type at the rendered size.
- Copy: Software — “Full-stack digital products.”; Research — “Evidence, policy and social science.”; People — “Supporting communities.”

## Verification

- Local cloud browser: `focus-venn-labelled-v5.webp` loaded successfully, all three labelled hotspots remain present, and page overflow is 0 px.
- Accessibility: the semantic hotspot names and destinations are unchanged; the visible type is now consistently light against the coloured fields.
- No P0, P1 or P2 visual issues remain in the requested Focus section state.

## Final result

passed

---

# Design QA — AllyIndex portfolio card

## Scope

- Branch: `portfolio-redesign`
- Request: add AllyIndex to the selected-work portfolio and use the supplied images.

## Evidence and fidelity

- Source visual truth: supplied AllyIndex welcome, LGBTQ+ quiz and terminology mobile screenshots.
- The card uses the three supplied screens as an image gallery, retains their original proportions, and gives each an accurate, descriptive alternative text.
- Copy communicates the project purpose without copying the source interface verbatim: LGBTQ+ terminology, diverse history, allyship learning and a quiz.
- The live-site and repository destinations are explicit links, separated from the non-interactive project description.

## Verification

- Local cloud browser: all three image assets loaded at their 1125 px native width after entering the work section.
- The AllyIndex card was present beside the other selected-work cards, with no page-level horizontal overflow at the desktop verification viewport.
- Responsive Playwright coverage checks the three screens, both external destinations and horizontal-overflow safety on the configured mobile device profiles.

## Final result

passed
