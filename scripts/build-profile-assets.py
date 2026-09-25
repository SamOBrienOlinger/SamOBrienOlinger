#!/usr/bin/env python3
"""Build self-contained SVGs for GitHub's script-free profile README.

Run from any directory with Python 3. Existing artwork is embedded unchanged.
The hero reveal plays once: 1.2 s pause, 0.8 s fade; reduced motion is static.
"""
from base64 import b64encode
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets' / 'profile'
OUT = ASSETS / 'ui'
OUT.mkdir(exist_ok=True)

# Keep the screenshot's dark identity regardless of the viewer's OS theme.
# GitHub itself controls the surrounding README text and page background.
PALETTE = '''
:root{color-scheme:dark;--paper:#111e2d;--ink:#edf4ff;--mid:#b7d5ed;--light:#92b8d6;--soft:#21364a;--line:#647b93;--button:#b7d5ed;--button-text:#152b46}
'''
FONT = '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif'

def data_uri(name):
    ext = Path(name).suffix
    mime = {'.jpeg':'image/jpeg','.webp':'image/webp','.png':'image/png'}[ext]
    return f'data:{mime};base64,' + b64encode((ASSETS / name).read_bytes()).decode()

def svg(width, height, title, content, styles=''):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title">
<title id="title">{escape(title)}</title>
<style>{PALETTE}{styles}</style>
{content}
</svg>\n'''

whales = data_uri('portfolio-whales.jpeg')
for mobile in (False, True):
    width, height = (600, 780) if mobile else (1200, 410)
    x, y, w, h = (28, 390, 544, 360) if mobile else (636, 28, 536, 354)
    content = f'''<rect width="{width}" height="{height}" rx="20" fill="var(--paper)"/>
<g font-family="{FONT}" font-size="108" font-weight="750" letter-spacing="-7">
<text x="28" y="118" fill="var(--ink)">Curiosity.</text>
<text x="28" y="229" fill="var(--mid)">Creativity.</text>
<text x="28" y="340" fill="var(--light)">Purpose.</text>
</g>
<defs><clipPath id="photo-frame"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18"/></clipPath></defs>
<g class="hero-photo" clip-path="url(#photo-frame)">
<image x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet" xlink:href="{whales}"/>
</g>'''
    styles = '''
.hero-photo{opacity:1;animation:hero-reveal .8s ease-out 1.2s 1 both}
@keyframes hero-reveal{from{opacity:0}to{opacity:1}}
@media(prefers-reduced-motion:reduce){.hero-photo{animation:none;opacity:1}}
'''
    (OUT / ('hero-mobile.svg' if mobile else 'hero.svg')).write_text(svg(width,height,'Curiosity. Creativity. Purpose. A pod of sperm whales beneath a diver.',content,styles))

# Brand paths from Bootstrap Icons (MIT), kept local with no CDN dependency.
# Sources: https://icons.getbootstrap.com/icons/linkedin/
#          https://icons.getbootstrap.com/icons/github/
# License: assets/profile/ui/bootstrap-icons-LICENSE.txt
SOCIAL_ICONS = {
    'linkedin': 'M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z',
    'github': 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8',
}

for name, label, width, primary in [
    ('explore-work','Explore my work',178,True),
    ('lets-talk','Let’s talk',120,False),
    ('email','Send me an email',188,True),
    ('linkedin','LinkedIn',144,False),
    ('github','GitHub',128,False),
]:
    # The README wraps the whole image in a real link, making the 48px-high
    # surface clickable and keyboard-operable without unsupported scripts.
    icon = SOCIAL_ICONS.get(name)
    icon_markup = (
        '<!-- Icon: Bootstrap Icons (MIT); see bootstrap-icons-LICENSE.txt. -->\n'
        f'<g transform="translate(18 12) scale(1.5)" fill="var(--ink)"><path d="{icon}"/></g>\n'
        if icon else ''
    )
    label_x = 52 if icon else width / 2
    label_anchor = 'start' if icon else 'middle'
    content = f'''<rect x="1" y="1" width="{width-2}" height="46" rx="9" fill="{'var(--button)' if primary else 'var(--paper)'}" stroke="{'var(--button)' if primary else 'var(--line)'}"/>
{icon_markup}<text x="{label_x}" y="29.5" text-anchor="{label_anchor}" font-family="{FONT}" font-size="16" font-weight="600" fill="{'var(--button-text)' if primary else 'var(--ink)'}">{escape(label)}</text>'''
    (OUT / f'{name}.svg').write_text(svg(width,48,label,content))

for name, filename, title in [
    ('sct','portfolio-sct.webp','Saggart & Citywest Together'),
    ('spoodlespace','portfolio-spoodlespace.webp','SpoodleSpace'),
    ('beaver','portfolio-beaver.jpeg','Beaver v Otter'),
    ('new-life','portfolio-new-life.webp','A New Life in Ireland'),
    ('both-sides','portfolio-both-sides.webp','Stopped: Both Sides'),
    ('beetlejuice','portfolio-beetlejuice.webp','Beetlejuice'),
    ('yellowknife','portfolio-yellowknife.webp','Know Yellowknife'),
    ('allyindex','portfolio-allyindex.webp','AllyIndex'),
    ('white-whale','portfolio-white-whale.webp','The White Whale vs Old Thunder'),
]:
    content = f'''<defs><clipPath id="frame"><rect width="800" height="500" rx="20"/></clipPath></defs>
<g clip-path="url(#frame)"><rect width="800" height="500" fill="var(--soft)"/>
<image width="800" height="500" preserveAspectRatio="xMidYMid meet" xlink:href="{data_uri(filename)}"/></g>'''
    (OUT / f'{name}.svg').write_text(svg(800,500,title,content))

print(f'Built {len(list(OUT.glob("*.svg")))} SVG assets in {OUT.relative_to(ROOT)}')
