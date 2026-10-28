#!/usr/bin/env python3
"""Build the portfolio's five static pages with one shared navigation/footer."""
from pathlib import Path
from html import escape
import argparse
import re

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Build the static portfolio pages.')
parser.add_argument('--base-path', default='', help='Optional hosting subdirectory, such as /my-portfolio.')
args = parser.parse_args()
segments = [segment for segment in args.base_path.split('/') if segment]
if any(segment in {'.', '..'} or not re.fullmatch(r'[A-Za-z0-9._~-]+', segment) for segment in segments):
    parser.error('--base-path must be a URL path using letters, numbers, hyphens, underscores, or dots.')
BASE_PATH = '/' + '/'.join(segments) if segments else ''
PAGES = [
    ('home', '', 'Carson Guise — RIT Marketing Portfolio', 'Meet Carson Guise, a fourth-year RIT Marketing student. Explore professional experiences and selected marketing projects.'),
    ('experiences', 'experiences', 'Experiences — Carson Guise', 'Explore Carson Guise’s professional experiences at Paylocity, Kevin Guest House, and Florania.'),
    ('projects', 'projects', 'Projects — Carson Guise', 'Selected case studies in marketing strategy, research, public relations, international work, music, and fashion.'),
    ('about', 'about', 'About Me — Carson Guise', 'Meet Carson Guise, a fourth-year Marketing student at RIT with interests in strategy, music, fashion, and culture.'),
    ('contact', 'contact', 'Contact Me — Carson Guise', 'Connect with Carson Guise by email or LinkedIn.'),
]
NAV = [('experiences', 'Experiences'), ('projects', 'Projects'), ('about', 'About Me'), ('contact', 'Contact Me')]

for page, directory, title, description in PAGES:
    links = '\n'.join(f'      <a href="/{key}/"'+(' aria-current="page"' if key == page else '')+f'>{label}</a>' for key, label in NAV)
    header = f'''  <header class="site-header">
    <a class="identity" href="/" aria-label="Carson Guise, home"{' aria-current="page"' if page == 'home' else ''}><img src="/assets/cg-full.svg" alt="Carson Guise CG monogram" width="60" height="39"></a>
    <nav aria-label="Main navigation">
{links}
    </nav>
  </header>'''
    footer = '''  <footer><a class="footer-brand" href="/" aria-label="Carson Guise, home"><img src="/assets/cg-full.svg" width="45" height="29" alt=""><span>Carson Guise<br><small>Marketing student @ RIT</small></span></a><div class="footer-links" role="group" aria-label="Contact Carson"><a href="mailto:guisecarson@gmail.com">guisecarson@gmail.com</a><a href="https://www.linkedin.com/in/carson-guise/" target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span></a></div><a href="#top">Back to top ↑</a></footer>'''
    scripts = '  <script src="/site.js" defer></script>'
    if page == 'projects':
        scripts += '\n  <script src="/projects.js" defer></script>\n  <script src="/app.js" defer></script>'
    content = (ROOT / 'src/pages' / f'{page}.html').read_text().rstrip()
    modal = (ROOT / 'src/case-dialog.html').read_text().rstrip() if page == 'projects' else ''
    document = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="description" content="{escape(description, quote=True)}">
  <meta name="theme-color" content="#f9f6e6">
  <meta name="portfolio-base-path" content="{escape(BASE_PATH, quote=True)}">
  <title>{escape(title)}</title>
  <link rel="icon" href="/assets/cg-full.svg" type="image/svg+xml">
  <link rel="preload" href="/assets/fonts/FiraSans-Regular.woff" as="font" type="font/woff" crossorigin>
  <link rel="stylesheet" href="/styles.css">
{scripts}
</head>
<body class="page-{page}" data-page="{page}">
  <a class="skip-link" href="#top">Skip to content</a>
{header}
  <main id="top" tabindex="-1">
{content}
  </main>
{footer}
{modal}
</body>
</html>
'''
    if BASE_PATH:
        document = re.sub(r'''(\b(?:href|src)=["'])/(?!/)''', lambda match: match.group(1) + BASE_PATH + '/', document)
    destination = ROOT / 'dist' / directory
    destination.mkdir(parents=True, exist_ok=True)
    (destination / 'index.html').write_text(document)
    print(f'Built {BASE_PATH}/{directory + "/" if directory else ""}')

(ROOT / 'dist' / '.nojekyll').touch()
