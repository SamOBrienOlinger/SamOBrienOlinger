"""Offline integrity checks for the static portfolio and its case studies."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT / 'index.html', *sorted((ROOT / 'work').glob('*.html'))]

class Document(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.links, self.assets, self.headings, self.errors = path, [], [], [], [], []
    def handle_starttag(self, tag, items):
        attrs = dict(items)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'a':
            self.links.append(attrs.get('href', ''))
        if tag in ('img', 'script') and 'src' in attrs:
            self.assets.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') in ('stylesheet', 'icon'):
            self.assets.append(attrs.get('href', ''))
        if tag == 'img':
            if 'alt' not in attrs:
                self.errors.append('Image has no alternative-text attribute')
            if not all(attrs.get(a, '').isdigit() and int(attrs[a]) > 0 for a in ('width', 'height')):
                self.errors.append('Image must reserve intrinsic dimensions')
        if tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            self.headings.append(int(tag[1]))

pages = {}
for path in PAGES:
    doc = Document(path)
    doc.feed(path.read_text())
    pages[path.resolve()] = doc
errors = []
for path, doc in pages.items():
    errors.extend(f'{path.relative_to(ROOT)}: {error}' for error in doc.errors)
    for identity, count in Counter(doc.ids).items():
        if count > 1:
            errors.append(f'{path.name}: Duplicate id {identity}')
    if doc.headings.count(1) != 1:
        errors.append(f'{path.name}: Expected one primary heading')
    for previous, current in zip(doc.headings, doc.headings[1:]):
        if current > previous + 1:
            errors.append(f'{path.name}: Heading level skipped: h{previous} to h{current}')
    for value in [*doc.links, *doc.assets]:
        parts = urlsplit(value)
        if parts.scheme or parts.netloc:
            continue
        if not value:
            errors.append(f'{path.name}: Empty URL')
            continue
        target = (path.parent / unquote(parts.path)).resolve() if parts.path else path
        if not target.exists():
            errors.append(f'{path.name}: Missing local target {value}')
        elif parts.fragment and target in pages and unquote(parts.fragment) not in pages[target].ids:
            errors.append(f'{path.name}: Missing anchor {value}')
    for target in ('main', 'top', 'contact', 'site-nav'):
        if target not in doc.ids:
            errors.append(f'{path.name}: Missing landmark {target}')
for filename in ('package.json',):
    json.loads((ROOT / filename).read_text())
if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print(f'PASS: {len(pages)} pages; local routes, assets, anchors, image dimensions, headings and JSON.')
