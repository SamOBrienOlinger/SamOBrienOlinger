# Design QA — Random scroll reveal for career Venn

## Scope

- Branch: `feature/random-venn-scroll`, based on `portfolio-redesign`.
- Replace the four career statements in the Approach section with individually animated SVG circles.
- Reveal in a random order 600 ms apart once 25% of the diagram enters the viewport; reset after it fully leaves and choose a different order on return.

## Timing update — 29 October 2026

- The user requested 25% slower motion: playback is now 75% of its former speed. The reveal lasts 866.67 ms (formerly 650 ms); stagger is 600 ms (formerly 450 ms), and the initial delay is 160 ms (formerly 120 ms).
- The easing curve, random order, reset and reduced-motion behaviour are unchanged. Five targeted regression tests pass at the new timing. Prior visual/layout evidence below still applies; the delay arrays below record the original browser check.
- MP4 and GIF previews are re-rendered using the same 0.75 speed factor.

## Evidence and fidelity

- Source: approved four-circle graphic, `exec-9e171cc4-e26f-469c-8930-7f304f0ab7e7.png` (1536 × 1024), with the updated “Over a decade working in the Community & Voluntary sector” wording.
- Browser screenshots captured in the task workspace: `venn-desktop.jpg`, `venn-mobile.jpg`, and `venn-comparison.jpg`.
- Desktop: 1363 × 936 CSS px. Mobile: 375 × 812 iframe, 360 px usable content width with the browser scrollbar.
- Side-by-side visual review preserves the four-circle arrangement, blue/amber complementary palette, navy background and highlighted keywords. Live vector text uses shorter lines for mobile readability; the raster texture is replaced by flat translucent fills to support independent circles.
- [P2, fixed] The Community label initially touched the left circle edge. Shifted its text inward and reduced its font size slightly; the final desktop and mobile screenshots show clear spacing.
- Exact wording is present in the SVG description for assistive technology; visual groups are hidden from accessibility APIs to avoid duplicate announcements.

## Verification

- Browser: initial hidden state, full reveal, complete off-screen reset, and return with a different sequence all confirmed. First and repeat delay arrays were `[0.12, 1.02, 0.57, 1.47]` and `[1.47, 0.57, 1.02, 0.12]` seconds.
- Mobile: all four labels visible and no horizontal overflow.
- Five Node regression tests pass: threshold/stagger, no restart during scroll jitter, fresh return order, reduced-motion changes/fallbacks, and browser-history restoration.
- Without JavaScript or observer support the diagram remains visible. Reduced motion bypasses the reveal, and print styles show all circles.
- No application console errors observed; browser-extension metadata warnings were unrelated to the page.
- Full existing Playwright suite is delegated to the repository's pull-request CI; it was not executed locally.

## Final result

passed — visual and targeted interaction checks. Full CI status is reported separately on the pull request.

---

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
