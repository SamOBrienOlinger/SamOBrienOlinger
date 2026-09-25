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

for name, label, width, primary in [
    ('explore-work','Explore my work',178,True),
    ('lets-talk','Let’s talk',120,False),
    ('email','Send me an email',188,True),
    ('linkedin','LinkedIn',116,False),
]:
    content = f'''<rect x="1" y="1" width="{width-2}" height="46" rx="9" fill="{'var(--button)' if primary else 'var(--paper)'}" stroke="{'var(--button)' if primary else 'var(--line)'}"/>
<text x="{width/2}" y="29.5" text-anchor="middle" font-family="{FONT}" font-size="16" font-weight="600" fill="{'var(--button-text)' if primary else 'var(--ink)'}">{escape(label)}</text>'''
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
