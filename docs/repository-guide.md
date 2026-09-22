# Repository setup & credits

[Back to my profile](../README.md)

This repository contains the README displayed on my GitHub profile and the source of my portfolio website. The profile is written in GitHub Markdown; the website has its own HTML, CSS and JavaScript.

| Path | Purpose |
| --- | --- |
| [README.md](../README.md) | GitHub profile introduction, selected work and contact links |
| [assets/profile/](../assets/profile/) | Profile banner and screenshots |
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

The profile uses native headings, wrapping images and one disclosure for additional projects. It does not depend on inline CSS, scripts, remotely generated badges or live statistics services. Text links describe each project separately from its screenshot. The compact banner is selected with a `picture` source for narrow screens.

The September 2026 redesign draws on the screenshots and direct contact links in the April 2025 and August 2026 profiles, and the clearer project descriptions in the September 2026 README. It also reuses the “Curiosity. Creativity. Purpose.” identity from the portfolio. Older material remains in [Git history](https://github.com/SamOBrienOlinger/SamOBrienOlinger/commits/main/README.md) and the [original profile record](https://github.com/SamOBrienOlinger/SamOBrienOlinger/blob/e913e4a3696655da181c6bb3ccbe584e8880d786/README.md).

## Credits and reuse

Profile screenshots show the public homepages of Saggart & Citywest Together, SpoodleSpace's design preview, A New Life in Ireland and Stopped: Both Sides, captured on 22 September 2026. Their artwork and third-party media retain the credits and terms in their respective repositories. Screenshots show interfaces, not evidence that every application feature or learning outcome has been validated.

The earlier portfolio's whale photograph attribution remains: [How do whales sleep? — Special Tours](https://specialtours.is/blog/how-do-whales-sleep/).

No repository-level licence is added by this profile update. Linked projects, publications, photographs and third-party assets retain their own ownership and reuse terms.
