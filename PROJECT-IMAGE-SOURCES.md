# Project carousel image sources

Verified against all nine live homepages on **4 November 2026**. Beaver v Otter was recaptured and reverified on **12 November 2026**. Each portfolio preview now uses the current live hero artwork. Where the hero combines multiple images, HTML or CSS, the preview is a fresh capture of that complete rendered composition.

All previews are served locally as WebP. The image dimensions in `index.html` match the prepared files, and `object-fit: contain` preserves the complete composition in the carousel's existing frame. Landscape and portrait artwork are not cropped to fill the frame.

| Project | Portfolio image | Current live source | Selection and verification |
| --- | --- | --- | --- |
| Saggart & Citywest Together | `assets/images/projects/hero-sct-20261104.webp` (1400 × 933) | [Hero v12](https://samobrienolinger.github.io/saggart-and-citywest-together/assets/images/hero-saggart-citywest-v12.jpg) | The live `.home-hero-art > img.home-hero-still` uses this image. It is also the completed state after the temporary sunrise animation. |
| SpoodleSpace | `assets/images/projects/hero-spoodle-20261109.webp` (740 × 1400) | [Live homepage](https://spoodle-space-pp5.herokuapp.com/) | User-supplied mobile landing page screenshot added on 9 November 2026, showing the navigation, running cockapoo, welcome message and both action buttons. |
| Beaver v Otter | `assets/images/projects/hero-beaver-no-sun-trees-20261112.webp` (601 × 539) | [Live homepage](https://samobrienolinger.github.io/beaver-v-otter/) | Fresh capture on 12 November 2026 of `#home .river-scene`: paired animals, rock, seven data centres (including the larger central facility between their faces), open hills and river. The sun and tree layers have been removed. No single source image contains the complete scene. |
| A New Life in Ireland / Journeys to Ireland | `assets/images/projects/hero-new-life-20261104.webp` (1400 × 788) | [Dublin and countryside hero](https://samobrienolinger.github.io/My-New-Life-in-Ireland/images/ireland-rural-dublin-hero.webp) | Both the live `.hero-section` background and `img.hero-mobile-image` use this image. The portfolio's existing “Every journey to Ireland is different.” HTML overlay is retained. |
| Both Sides | `assets/images/projects/hero-both-sides-20261104.webp` (1024 × 470) | [Live homepage](https://samobrienolinger.github.io/stopped-both-sides/) · [Public perspective](https://samobrienolinger.github.io/stopped-both-sides/assets/heroes/public-1600.webp?v=irish-streetlights-1) · [Garda perspective](https://samobrienolinger.github.io/stopped-both-sides/assets/heroes/garda-1600.webp?v=irish-streetlights-1) | Fresh capture of `.reference-landing .overlapping-heroes`, preserving both current street scenes, their perspective buttons and captions. |
| Beetlejuice | `assets/images/projects/hero-beetlejuice-20261104.webp` (1348 × 726) | [Live homepage](https://samobrienolinger.github.io/Beetlejuice-Beetlejuice-Beetlejuice/) | Fresh capture of `main#main-content`, including `its-showtime2.gif`, the green welcome panel and the `bats-and-moon.jpg` background. |
| Know Yellowknife | `assets/images/projects/hero-yellowknife-20261104.webp` (1400 × 798) | [Graphic-novel hero](https://samobrienolinger.github.io/know-yellowknife/assets/images/hero-yellowknife-graphic-novel.webp) | The live `.hero-illustration > img` uses this daytime city, lakes and autumn forest illustration. |
| AllyIndex | `assets/images/projects/hero-allyindex-20261104.webp` (1348 × 695) | [Live homepage](https://declan444.github.io/24-7-hackathon-team9/index.html) | Fresh capture of `section.carousel-container`, including the live Pride-photo carousel, welcome card and overlaid navigation. The unused `.hero` background rule is not the current homepage hero. |
| The White Whale vs Old Thunder | `assets/images/projects/hero-white-whale-20261104.webp` (841 × 1400) | [Live JPEG fallback](https://samobrienolinger.github.io/the-white-whale-vs-old-thunder/assets/images/IMG_0954.jpeg) · [Active AVIF](https://samobrienolinger.github.io/the-white-whale-vs-old-thunder/assets/images/landing-moby-pequod.avif?v=20260913-1) | The live `picture.landing-artwork` still uses the ship-and-whale illustration. The higher-resolution JPEG fallback supplies the same current artwork with more detail; the full portrait is preserved. |

## Capture and preparation notes

The composite previews were captured from the actual live pages without changing their DOM, styles or animation behaviour. Animated scenes are represented by a static rendered frame. The captures omit unrelated page sections while retaining the complete hero component:

- The supplied SpoodleSpace screenshot was resized proportionally to 740 × 1400 and saved as WebP.
- Beaver v Otter (refreshed 12 November 2026): the complete `.river-scene` at scroll position zero, captured from a 1363 × 936 browser viewport. The returned 1348 × 926 screenshot was cropped proportionally at `x=665, y=151, width=601, height=539` to match the component bounds.
- Both Sides: the complete paired hero was extracted from a native 1363 × 936 viewport capture using `x=162, y=101, width=1024, height=470`, at `scrollY=608`.
- Beetlejuice: page-coordinate rectangle `x=0, y=129, width=1348, height=726`, at scroll position zero.
- AllyIndex: page-coordinate rectangle `x=0, y=0, width=1348, height=695`, at scroll position zero.

Source images and captures were converted to WebP and proportionally limited to a maximum dimension of 1400 pixels where needed. Existing descriptive project copy, links and carousel behaviour are retained. The dated filenames distinguish this refresh from older assets and avoid stale cached previews.

Existing third-party assets retain their original ownership and reuse terms. These previews are a snapshot of the live sites on the verification date; they do not update automatically when those sites change.
