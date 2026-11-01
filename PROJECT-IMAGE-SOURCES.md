# Project image sources

The `profesh` refinement combines the original portfolio artwork with real interface captures from the three featured projects. Existing attribution and reuse terms remain in force.

## Live interface captures — 1 November 2026

The nine WebP files in `assets/images/interfaces/` are full, unaltered viewport captures of the live projects, converted from JPEG to WebP without changing their dimensions. Desktop views are 1440 × 1000; phone views are 390 × 844. These are screenshots of working interfaces, not device mockups or generated illustrations. `manifest.json` records the exact URL, viewport, page title and capture time of each image.

| Files | Source and interaction |
| --- | --- |
| `saggart-home`, `saggart-services`, `saggart-mobile` | [Saggart & Citywest Together](https://samobrienolinger.github.io/saggart-and-citywest-together/): homepage, Citywest supports directory, local-services section on a phone |
| `journeys-decision`, `journeys-feedback`, `journeys-mobile` | [Journeys to Ireland](https://samobrienolinger.github.io/My-New-Life-in-Ireland/): Kwame's planning stage, feedback after checking a response, Fact or Fiction on a phone |
| `stopped-public`, `stopped-garda`, `stopped-mobile` | [Stopped: Both Sides](https://samobrienolinger.github.io/stopped-both-sides/): the same street encounter before and after switching perspective, then its Garda view on a phone |

Capture provenance: [GitHub Actions run 41257240267](https://github.com/SamOBrienOlinger/SamOBrienOlinger/actions/runs/41257240267), using `scripts/capture-projects.cjs` at `eba5ca84244b25acb4007f39cf7d84613e7960c8`. The script uses normal navigation and interaction, light mode and reduced motion, and waits for visible images before capture. The screenshot viewer supports keyboard opening, native Escape/close and focus restoration; its links open the source images when JavaScript is unavailable.

## Retained project artwork

Rechecked 6 September 2026 against the live sites, their repositories and the original portfolio. Five previews restore the complete original project images in place of isolated photos or scene layers. The other four retain their verified current artwork. These are existing assets, not newly captured screenshots.

| Project | Portfolio image | Source | Selection |
| --- | --- | --- | --- |
| Saggart & Citywest Together | `assets/images/projects/carousel-sct.webp` | [Original asset](https://samobrienolinger.github.io/saggart-and-citywest-together/assets/images/hero-saggart-citywest-v10.webp) | preserve previous image |
| SpoodleSpace | `assets/images/projects/spoodlespace.webp` | [Original asset](https://res.cloudinary.com/dzhbg6go0/image/upload/v1692012034/PP5-multiscreen_hucdla.jpg) | restore original complete preview |
| Beaver v Otter | `assets/images/beaver-v-otter-portfolio.jpeg` | [Original asset](https://raw.githubusercontent.com/SamOBrienOlinger/SamOBrienOlinger/b8e31efb86127c0526caa958e46673a23655c3aa/assets/images/beaver-v-otter-portfolio.jpeg) | restore original complete preview |
| A New Life in Ireland | `assets/images/projects/carousel-new-life.webp` | [Original asset](https://samobrienolinger.github.io/My-New-Life-in-Ireland/images/migrant-pathways-hero.jpg) | preserve previous image |
| Both Sides | `assets/images/projects/both-sides.webp` | [Original asset](https://samobrienolinger.github.io/stopped-both-sides/assets/heroes/public-960.webp) | Current public-perspective landing artwork, checked 13 September 2026 |
| Beetlejuice | `assets/images/projects/preview-beetlejuice.webp` | [Original asset](https://raw.githubusercontent.com/SamOBrienOlinger/Beetlejuice-Beetlejuice-Beetlejuice/main/assets/images/readme-images/landing-page.png) | restore original complete preview |
| Know Yellowknife | `assets/images/projects/carousel-yellowknife.webp` | [Original asset](https://samobrienolinger.github.io/know-yellowknife/assets/images/hero-yellowknife-v5.webp) | preserve previous image |
| AllyIndex | `assets/images/allyindex-home.webp` | [Original asset](https://raw.githubusercontent.com/SamOBrienOlinger/SamOBrienOlinger/f959428a69952d0b950973a6d481932ba9d97570/assets/images/allyindex-home.webp) | restore original complete preview |
| The White Whale vs Old Thunder | `assets/images/projects/carousel-white-whale.webp` | [Original asset](https://samobrienolinger.github.io/the-white-whale-vs-old-thunder/assets/images/IMG_0954.jpeg) | preserve previous image |

SpoodleSpace uses its original multi-device project screenshot. Beaver v Otter shows the complete river scene. Beetlejuice uses its full landing-page screenshot. AllyIndex uses the supplied welcome screen and retains its three detailed screenshot links. Portrait images remain uncropped.

Existing third-party assets retain their original rights.
