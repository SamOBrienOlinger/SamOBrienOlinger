# Profesh portfolio redesign

This branch starts from the live source branch, `portfolio-redesign`, at `767c6410ba4f5045b274e9528de4eb979823d0e4`. It does not change the publishing branch, GitHub Pages configuration or live website.

## Experience

The opening restores the live `portfolio-redesign` presentation: a centred whale image (up to 44rem wide), followed by three bold navy-to-blue words. They sit in a row from 48rem and stack on smaller screens, using the original gentle staggered reveal. The opening stays above the offer, and its former “Discuss a project” / “See the work” buttons have been removed. Contact remains available in the navigation and sections.

- Audience: community organisations, NGOs, education and research teams, cultural organisations, social enterprises and collaborating development teams.
- Clear positioning and three services: websites/information hubs, interactive learning, and research/digital content.
- Three substantial case studies at `work/saggart-citywest.html`, `work/journeys-to-ireland.html` and `work/stopped-both-sides.html`.
- Six additional projects remain discoverable through a keyboard-operable native disclosure.
- The Research section uses “A foundation in evidence.” as its single collapsible heading, with the former heading block removed. All eight existing publication links remain directly accessible.
- Existing people/background copy and the animated credentials diagram are preserved.
- A four-step process includes scope, prototypes, review, handover and an agreed support plan.
- Direct email contact; there is no form pretending to submit to an unconfigured service.

## Refinement: offer, evidence and editorial rhythm

The whale photograph and “Curiosity. Creativity. Purpose.” signature lead the page, immediately below the navigation. The offer follows: “Websites & learning tools. Built around people.” The compact Software, Research and People strip has been removed. Background comes first, followed by Work in practice, Services, Research, The process and Contact. Work in practice appears once as the section heading, with the description directly beneath it on small screens. Main section labels use words without number or slash prefixes. Navigation follows this order on the homepage and case studies. All six main sections use the same 2px gold divider in light and dark modes. The opening “Independent development | Social research” label has been removed.

The three featured projects use nine real interface captures, including phone views and Stopped's two perspectives. An alternating project layout and a dark Stopped feature create variety while retaining the existing colours and typography foundations. Short, finite heading and interface entrances honour reduced motion. Screenshots can be enlarged with a native dialog and restore focus when closed; without JavaScript, they remain ordinary image links.

Each case study now identifies the brief, my contribution, three concrete implementation decisions and their tradeoffs, delivered scope, and the next evaluation step. Descriptions were checked against the current project sources on 1 November 2026: Saggart & Citywest Together `b0605db`, Journeys to Ireland `01f9173`, and Stopped: Both Sides `692368c`. Features and delivered content are distinguished from learning outcomes or client results that have not been measured. Capture provenance is recorded in `PROJECT-IMAGE-SOURCES.md` and the image manifest.

## Design references

The implementation is original. Dennis Snellenberg informed the use of generous space and deliberate motion; Harry Atkins informed clear project navigation; Christian MacMillan informed service, collaboration and support explanations. Niccolò Miranda informed the small editorial use of serif type. No code, imagery, testimonials or award claims were copied from those portfolios.

## Content evidence

Project descriptions are based on the portfolio and the connected repositories’ READMEs, reviewed during implementation. Case studies distinguish a project’s features and intended contribution from validated outcomes. Stopped: Both Sides remains an independent educational prototype, and Journeys to Ireland uses fictional characters. The new branch uses the requested Journeys to Ireland name while retaining the established repository URL.

The contact action is a rounded “Email me” button with an envelope icon. The email address remains only in its `mailto:` destination. Footer LinkedIn links use the original Bootstrap Icons LinkedIn mark, with a descriptive accessible link name; the MIT notice is retained in `assets/icons/bootstrap-icons-LICENSE.txt`.

## Implementation and accessibility

The homepage's six main sections (Background, Work in practice, Services, Research, The process and Contact) use independent native disclosures. They begin closed, with descriptive headings and plus/minus controls. The opening offer stays visible. Navigation and contact links open their destination; initial URL fragments, reloads, browser history and deeper anchors also reveal the relevant section. The existing More projects disclosure remains inside Work. Without JavaScript, visitors can open each section directly with its native summary control.

Each main disclosure and More projects also has a discreet “Collapse section” button at its bottom. It closes only its own disclosure, restores keyboard focus to the summary and brings that heading below the sticky navigation. Reduced motion disables the smooth return scroll. The buttons are revealed only after their handlers are ready; native summary controls remain available without JavaScript.

The site is static HTML, CSS and JavaScript, with relative links that support the GitHub Pages project path. Existing local images, original image dimensions and system fonts avoid new runtime dependencies. Additional images lazy-load. There are no automatically rotating project cards, scroll interception, custom cursors or looping decorative effects.

The mobile menu, saved light/dark theme, blocked-storage fallback and plain-text clipboard behaviour remain. Native navigation and the additional-project disclosure work without JavaScript. Entry effects never leave waiting text hidden, settle for keyboard interaction, and honour reduced-motion changes. The Background introduction sits directly below its section heading and stays visible while the section is closed. The credentials diagram leads the expanded section. The biography sits alongside this column on desktop and follows the diagram on mobile. The diagram retains its dedicated tested motion implementation and CSS.

The obsolete carousel and overlapping-accordion scripts and browser specifications are replaced by tests for the new visitor flows. The credentials unit tests and clipboard regression tests remain.

## Checks

- Offline integrity: all four HTML pages, local assets, cross-page anchors, heading hierarchy, image dimensions and package metadata.
- JavaScript syntax checks.
- Existing seven credentials-motion regression tests.
- Browser suite: navigation and focus, independent section disclosure operation, deep links and browser history, all case-study routes, mobile menu dismissal, breakpoint changes, light/dark persistence, reduced motion, missing observers, blocked storage, no JavaScript, 320px/enlarged text, image loading, horizontal overflow, screenshot-dialog keyboard use and native image-link fallback.
- Browser projects: Chromium, Firefox, WebKit, Android-sized Chromium, iPhone-sized WebKit and tablet-sized WebKit.

The session’s managed preview browser was unavailable. Local static and unit checks passed; the GitHub Actions run is the source of truth for browser results. Full-page homepage and case-study screenshots are included in the workflow artifact. Automated viewport checks are not a claim of testing every physical device or of an independent accessibility certification.

The preview server uses Python’s static HTTP server so case-study URLs are tested with their actual `.html` paths. Font enlargement is checked on all four pages, and screenshots wait for lazy-loaded project images. The inherited clipboard fallback test explicitly simulates missing clipboard data across all engines.

Run `npm run check`, `npm run test:venn`, or `npm test`. Browser tests require dependencies and Playwright browser installations. Python 3 is required for the offline integrity check.
