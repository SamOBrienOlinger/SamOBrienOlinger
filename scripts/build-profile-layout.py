#!/usr/bin/env python3
"""Build script-free profile components using the portfolio's dark palette.

Only assets/profile/ux/*.svg is written. Existing artwork and the animated
hero in assets/profile/ui are deliberately untouched. Python standard library only.
"""
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'profile' / 'ux'
FONT = '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif'
PAPER, SURFACE, INK, BLUE, BORDER = '#111e2d', '#172638', '#edf4ff', '#b7d5ed', '#647b93'


def svg(width: int, height: int, title: str, body: str) -> str:
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}" role="img" aria-labelledby="title">\n'
            f'<title id="title">{escape(title)}</title>\n{body}\n</svg>\n')


def heading(title: str, mobile: bool) -> str:
    width, height, font_size, x, y = (420, 88, 34, 24, 57) if mobile else (840, 104, 44, 32, 68)
    body = (f'<rect width="{width}" height="{height}" rx="16" fill="{PAPER}"/>\n'
            f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{font_size}" '
            f'font-weight="700" letter-spacing="-1" fill="{INK}">{escape(title)}</text>')
    return svg(width, height, title, body)


ICONS = {
    'portfolio': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
    'live': '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    'source': '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
    'preview': '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8m-4-4v4M3 8h18"/>',
}


def button(label: str, width: int, icon: str, primary: bool) -> str:
    background, foreground = (BLUE, '#152b46') if primary else (SURFACE, INK)
    body = (f'<rect x="1" y="1" width="{width-2}" height="46" rx="10" '
            f'fill="{background}" stroke="{background if primary else BORDER}"/>\n'
            f'<g transform="translate(12 12)" fill="none" stroke="{foreground}" '
            f'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{ICONS[icon]}</g>\n'
            f'<text x="46" y="30" font-family="{FONT}" font-size="16" font-weight="600" '
            f'fill="{foreground}">{escape(label)}</text>')
    return svg(width, 48, label, body)


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, title in [('work', 'Explore my work'), ('experience', 'Work in context'),
                        ('research', 'Research & writing'), ('approach', 'People first'),
                        ('contact', 'Let’s talk')]:
        for mobile in (False, True):
            suffix = '-mobile' if mobile else ''
            (OUT / f'{name}{suffix}.svg').write_text(heading(title, mobile), encoding='utf-8')
    for name, label, width, icon, primary in [
        ('portfolio', 'Portfolio', 144, 'portfolio', True),
        ('live', 'Open site', 140, 'live', True),
        ('source', 'View code', 144, 'source', False),
        ('preview', 'UI preview', 148, 'preview', True),
    ]:
        (OUT / f'{name}.svg').write_text(button(label, width, icon, primary), encoding='utf-8')
    print(f'Built 14 profile components in {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    build()
