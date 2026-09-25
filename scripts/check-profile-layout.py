#!/usr/bin/env python3
"""Check profile links, local assets, disclosure structure and SVG components.

Run from any directory. This is a source-level check, not a substitute for
checking GitHub's rendered README or the native GitHub Mobile app.
"""
import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = [
    'saggart-and-citywest-together', 'spoodle-space-pp5', 'beaver-v-otter',
    'My-New-Life-in-Ireland', 'stopped-both-sides',
    'Beetlejuice-Beetlejuice-Beetlejuice', 'know-yellowknife',
    '24-7-hackathon-team9', 'the-white-whale-vs-old-thunder',
]


class Profile(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.links = []
        self.assets = []
        self.anchors = []
        self.errors = []
        self.disclosures = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('script', 'style', 'iframe', 'button', 'table'):
            self.errors.append(f'Unsupported or non-responsive layout element: {tag}')
        if any(key == 'style' or key.startswith('on') for key in a):
            self.errors.append(f'Unsafe or unsupported attributes: {tag}')
        if tag == 'details':
            self.depth += 1
            self.disclosures += 1
        if tag == 'a':
            if 'name' in a:
                self.anchors.append(a['name'])
            if 'href' in a:
                self.links.append((a['href'], self.depth))
        if tag == 'img':
            if 'alt' not in a:
                self.errors.append('Image missing alt attribute')
            if a.get('height') == '48' and not a.get('alt'):
                self.errors.append('Button missing accessible label')
            self.assets.append(a.get('src', ''))
        if tag == 'source':
            self.assets.append(a.get('srcset', ''))

    def handle_endtag(self, tag):
        if tag == 'details':
            self.depth -= 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--asset-manifest', type=Path,
                        help='Verified repository paths for a partial local checkout')
    args = parser.parse_args()
    manifest = set(args.asset_manifest.read_text().splitlines()) if args.asset_manifest else set()
    text = (ROOT / 'README.md').read_text(encoding='utf-8')
    profile = Profile()
    profile.feed(text)
    assert not profile.errors, profile.errors
    assert profile.depth == 0 and profile.disclosures == 6, 'Unexpected preview disclosure structure'
    assert len(profile.anchors) == len(set(profile.anchors)), 'Duplicate custom anchors'
    anchors = set(profile.anchors)
    links = profile.links + [(url, 0) for url in re.findall(r'(?<!!)\[[^\]\n]+\]\(([^)]+)\)', text)]
    for url, depth in links:
        if url.startswith('#'):
            assert url[1:] in anchors, f'Broken section link: {url}'
        else:
            assert urlsplit(url).scheme in ('', 'https', 'mailto'), f'Unexpected URL scheme: {url}'
    for src in profile.assets:
        assert src and not urlsplit(src).scheme, f'Asset is not repository-local: {src}'
        assert (ROOT / src).is_file() or src in manifest, f'Missing asset: {src}'
    for slug in PROJECTS:
        assert any(slug in url and 'github.io/' in url and depth == 0 for url, depth in profile.links), \
            f'Website link hidden or missing: {slug}'
        assert any(slug in url and url.startswith('https://github.com/') and depth == 0
                   for url, depth in profile.links), f'Code link hidden or missing: {slug}'
    components = sorted((ROOT / 'assets/profile/ux').glob('*.svg'))
    assert len(components) == 14, 'Expected 14 generated components'
    for path in components:
        root = ET.parse(path).getroot()
        assert root.get('viewBox') and root.find('{http://www.w3.org/2000/svg}title') is not None, path
        assert not any('href' in key for node in root.iter() for key in node.attrib), path
    assert 'interface; sign-in and account features require' in text, 'Preview limitation lost'
    print('PASS: all nine project site/code links visible; navigation resolves; all assets referenced; '
          'six optional previews; 14 valid self-contained SVGs; no page scripts or table layout.')


if __name__ == '__main__':
    main()
