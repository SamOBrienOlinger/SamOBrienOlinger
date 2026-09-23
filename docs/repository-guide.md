# Repository setup & credits

[Back to my profile](../README.md)

This repository contains the README displayed on my GitHub profile and the source of my portfolio website. The profile is written in GitHub Markdown; the website has its own HTML, CSS and JavaScript.

| Path | Purpose |
| --- | --- |
| [README.md](../README.md) | GitHub profile introduction, selected work and contact links |
| [assets/profile/](../assets/profile/) | Original profile artwork and project previews |
| [assets/profile/ui/](../assets/profile/ui/) | Self-contained profile hero, buttons and rounded preview frames |
| [scripts/build-profile-assets.py](../scripts/build-profile-assets.py) | Rebuild the profile SVGs from the original artwork |
| [index.html](../index.html) | Portfolio page structure and content |
| [styles.css](../styles.css) | Portfolio layout and presentation |
| [script.js](../script.js) | Portfolio interactions |

## Inspect the portfolio locally

Requires Git, Python 3 and a browser.

```bash
git clone https://github.com/SamOBrienOlinger/SamOBrienOlinger.git
cd SamOBrienOlinger
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000. Check navigation, project links, keyboard access and narrow-screen layouts before proposing a change.

## Profile design

The profile reuses the portfolio’s navy, blue and teal identity, rounded imagery and button styling. It uses native headings, links and keyboard-operable disclosures for project details. Saggart & Citywest Together is visible first, followed by the remaining projects in the same order as the portfolio. Content and navigation stay in the README; decorative frames and hero typography are SVG assets.

The hero uses a two-column layout on wider screens and a stacked version at viewport widths of 680 px or less. Its whale photograph starts with a **1.2-second pause**, then fades in over **0.8 seconds**, once per image load. The headline is visible immediately. Both variants reserve their full dimensions throughout the reveal. Visitors with `prefers-reduced-motion: reduce` see the photograph immediately. Light and dark palettes follow the browser’s colour-scheme preference. GitHub’s surrounding interface and any theme selected independently of the operating system remain under GitHub’s control.

GitHub profile READMEs do not run page JavaScript or arbitrary page CSS. The fade therefore lives inside a self-contained SVG image, with the existing photograph embedded unchanged. It needs no external animation service. Each project frame retains the complete original image using `preserveAspectRatio="xMidYMid meet"`.

Rebuild the assets with Python 3:

```bash
python3 scripts/build-profile-assets.py
```

The generator rewrites only `assets/profile/ui/*.svg`. The source image files remain unchanged. Check the actual GitHub-rendered README before publishing, including the hero, internal links and project disclosures.

The September 2026 redesign draws on the screenshots and direct contact links in the April 2025 and August 2026 profiles, and the clearer project descriptions in the September 2026 README. It also reuses the “Curiosity. Creativity. Purpose.” identity from the portfolio. Older material remains in [Git history](https://github.com/SamOBrienOlinger/SamOBrienOlinger/commits/main/README.md) and the [original profile record](https://github.com/SamOBrienOlinger/SamOBrienOlinger/blob/e913e4a3696655da181c6bb3ccbe584e8880d786/README.md).

## Credits and reuse

Profile screenshots show the public homepages of Saggart & Citywest Together, SpoodleSpace's design preview, A New Life in Ireland and Stopped: Both Sides, captured on 22 September 2026. Their artwork and third-party media retain the credits and terms in their respective repositories. Screenshots show interfaces, not evidence that every application feature or learning outcome has been validated.

The earlier portfolio's whale photograph attribution remains: [How do whales sleep? — Special Tours](https://specialtours.is/blog/how-do-whales-sleep/).

No repository-level licence is added by this profile update. Linked projects, publications, photographs and third-party assets retain their own ownership and reuse terms.
