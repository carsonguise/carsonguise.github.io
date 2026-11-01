# Carson Guise — Marketing Portfolio

This is the simplified, ready-to-upload website export. All files are in one folder, and every page has a unique filename. No installation or build step is needed.

## Preview on your computer

Keep every file together and serve the folder with an HTTP static server, then open `index.html` through that server. This lets the inline document viewer load its preview files.

## Upload to a GitHub repository

1. Extract the ZIP fully.
2. Open the extracted folder. You should see `index.html`, `experiences.html`, `projects.html`, `about.html`, `contact.html`, and the image/font/code files beside them.
3. In your private GitHub repository, choose **Add file → Upload files**.
4. Select all the extracted files and upload them together into the repository's top level. Keep their filenames unchanged. There is no `dist` folder or nested page folder in this export.
5. Commit the changes. Uploading code to GitHub stores it; it does not itself turn the repository into a running website.

These pages use relative links, so they work at a domain root or under a repository subdirectory without editing paths. The document viewer loads its preview JSON through the static host; use an HTTP server when testing locally.

## Hosting and privacy

The original Sites portfolio remains privately hosted. This export contains no authentication system. A private GitHub repository does not automatically make a GitHub Pages website private. GitHub Pages access control requires a supported GitHub Enterprise Cloud organization setup. Keep hosting on private Sites unless you intentionally choose another host with access control. This export does not enable or deploy GitHub Pages.

For an already configured static host, serve this folder as the site's root; `index.html` is the homepage. If it serves another directory, change that host's publish directory to the folder containing `index.html`.

## Edit the site

- `index.html`: Home
- `experiences.html`: Paylocity, Kevin Guest House, Florania
- `projects.html`: Filterable project gallery and case-study dialog
- `about.html`: Biography, headshot, and Spotify playlists
- `contact.html`: Simple “Let’s Connect!” page with email and LinkedIn links
- `styles.css`: Shared design and responsive layout
- `site.js`: Legacy links, company timeline controls, skills gallery filters, and cursor ripples
- `projects.js`: Case-study content, five skills per case, and result context
- `app.js`: Project filters, search, case navigation, and copy links
- `viewer.js`: Inline project-page viewer with swiping, page selection, document switching, enlargement, and page text
- The preview `.json` files: Self-contained pages for each document; keep them beside the HTML and code files
- `CONTENT_NOTES.md`: Content sources and metric limitations

The website displays original project pages inline, with no project-file download controls or raw PDFs in this export. Project cards are text-based, and the rectangular home headshot links to About Me.

The header and footer are present in each HTML file. Apply shared edits to all five pages. Font files are self-hosted; Fira Sans's license is included in `OFL.txt`. No license is granted here for Carson's original photos, logo, or portfolio materials.
