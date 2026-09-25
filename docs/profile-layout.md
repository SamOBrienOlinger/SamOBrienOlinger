# Profile layout and maintenance

[Back to the profile](../README.md) · [Existing artwork and credits](repository-guide.md)

## What the profile changes

The README is the branded introduction inside GitHub, not a replacement for GitHub's native app or web interface. It reuses Sam Tim Solutions' dark palette: navy `#111e2d`, surface `#172638`, light text `#edf4ff` and blue `#b7d5ed`.

The reading order is Work, Experience, Research, Approach, Contact. Saggart & Citywest Together, SpoodleSpace and Beaver v Otter have immediately visible artwork. All nine projects have a visible description and separate site/preview and source-code links. The six other previews can be expanded without hiding essential project information or links. The portfolio's project order is preserved.

Site and source-code controls are real links around 48-pixel-high SVG images, with destination-specific alternative text. Buttons can wrap onto another line rather than forcing a narrow screen to scroll sideways. Section headings have separate desktop and mobile graphics. Custom anchors preserve both the shorter navigation links and the previous section URLs.

The original whale artwork, its 1.2-second pause and 0.8-second reveal, and its reduced-motion alternative are unchanged. The existing LinkedIn and GitHub logo buttons are reused. No changes are made to portfolio HTML, CSS, JavaScript, publishing configuration, profile settings, avatar or repository pins.

## Rebuild and check

From the repository root:

```bash
python3 scripts/build-profile-assets.py
python3 scripts/build-profile-layout.py
python3 scripts/check-profile-layout.py
```

The first script builds the existing artwork in `assets/profile/ui`. The second builds only the new section headings and action buttons in `assets/profile/ux`. It uses Python's standard library and makes no network requests. The check script validates link visibility, custom anchors, local asset references, SVG structure and optional-preview markup. It does not test whether external services are available.

## Validation scope

The September 2026 update was checked in offline Chromium layouts at widths of 320, 375, 390, 430, 680, 768, 1024 and 1440 pixels. New SVG components were rendered and checked for text clipping. The layout fixtures retained the dimensions of the unchanged artwork; they were not live GitHub screenshots. The tested layouts had no horizontal overflow, kept 48-pixel-high action images, and allowed keyboard operation of all six preview disclosures and navigation to the contact anchor.

A live GitHub-rendered visual check and testing in GitHub's native iOS app remain separate checks. Local tests do not prove that every GitHub client renders all Markdown features identically.

## GitHub-managed controls

The app's header, navigation, background theme and repository overview layout are controlled by GitHub, not README code. Avatar, short bio, social profile fields and pinned repositories are account-level controls and are not changed by these files. The full interactive Sam Tim Solutions design remains on the portfolio website.

Relevant GitHub documentation:

- [About personal profiles](https://docs.github.com/en/account-and-profile/concepts/personal-profile)
- [Custom anchors, images and the picture element](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [Pinning items to your profile](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile)
- [GitHub's Markdown rendering and HTML sanitization](https://github.com/github/markup)
