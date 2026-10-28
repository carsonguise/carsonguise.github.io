# Carson Guise — Marketing Portfolio

A responsive, static marketing portfolio with separate Home, Experiences, Projects, About Me, and Contact Me pages. Includes six case studies, project filters/search, accessible case dialogs, year-based Spotify playlist cards, and email/LinkedIn footer links.

## Run locally

Requires Python 3. No package installation, API keys, database, or backend is needed.

```bash
python3 scripts/build-pages.py
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000/`. Use a local web server rather than opening the HTML files directly: navigation and assets use site URLs.

The ZIP already includes a built `dist/` directory, so you can also serve that directory immediately.

## Add to a GitHub repository

Unzip the download and commit or upload the **contents** of the `carson-guise-portfolio` folder to your repository root. The archive includes source files and ready-to-serve website files, without an existing Git history or hosting-account configuration.

## Build for a URL subdirectory

For hosting under a repository or other subdirectory, pass that URL path when building:

```bash
python3 scripts/build-pages.py --base-path /YOUR_REPOSITORY_NAME
```

For example, `--base-path /carson-portfolio` makes navigation, scripts, images, case-study links, and fonts work under `/carson-portfolio/`. Publish the contents of `dist/` at the matching URL path using your chosen static-hosting setup.

For a site served at a domain root, omit `--base-path`. Run the default build again before using the root-level local-preview command above.

Access control is provided by your hosting service; this static export does not include the private Sites sign-in gate.

## Where to edit

| File or directory | Purpose |
| --- | --- |
| `src/pages/` | Main content for the five pages, including the playlists |
| `scripts/build-pages.py` | Shared navigation, footer, titles, page assembly, and base-path support |
| `src/case-dialog.html` | Case-study dialog shell |
| `dist/projects.js` | Project case studies, skills, metrics, and source notes |
| `dist/app.js` | Project filtering, search, dialogs, and case navigation |
| `dist/site.js` | Compatibility for older links and experience return links |
| `dist/styles.css` | Fira Sans typography, green palette, and responsive styling |
| `dist/assets/` | Logos, headshot, concept moodboard, paper, and local fonts |
| `CONTENT_NOTES.md` | Case-study attribution and playlist-year mappings |

After editing `src/pages/`, shared navigation/footer, or `src/case-dialog.html`, rerun the build command. CSS, JavaScript, and asset edits in `dist/` are retained by the page builder.

## Checks

The export was built for both a domain root and a sample repository subdirectory. Local page links, asset paths, playlist targets, five-skill case-study content, and ZIP integrity were checked. JavaScript files pass `node --check` when Node.js is available.

Fira Sans is distributed with its included license in `dist/assets/fonts/OFL.txt`.
