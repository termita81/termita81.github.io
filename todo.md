# Website Project Plan

## Overview
Simple blog-style website hosted on GitHub Pages with plain HTML/CSS/JS and markdown articles.

## Technical Approach
- **No frameworks** - plain HTML/CSS/minimal JavaScript
- **Build system** - Node.js script converts markdown to HTML
- **Output directory** - `/docs` (served by GitHub Pages)
- **Markdown parser** - `marked.js` or similar
- **Hosting** - GitHub Pages from `/docs` folder

## Directory Structure
```
/
├── src/
│   ├── articles/           # Markdown files (YYYY-MM-DD-title.md)
│   ├── templates/          # HTML templates (article, page layouts)
│   └── styles/             # CSS files
├── docs/                   # Build output (committed, served by GitHub Pages)
├── build.js                # Markdown → HTML conversion script
└── package.json            # Dependencies and build scripts
```

## Features

### Pages
- **Home page** - lists all articles with dates
- **About page** - static content
- **Article pages** - individual articles from markdown
- **Custom content section** - separate path for miscellaneous content

### Layout
- Full viewport width and height (100vw/100vh)
- Consistent header across all pages
- Navigation links: Home, About
- Main content area

### Theming
- Light and dark themes
- Theme switcher (toggle button)
- CSS variables for easy theme management

### Articles
- Written in Markdown
- Filename format: `YYYY-MM-DD-title.md`
- Support for text, images, videos
- Display metadata (date created/modified)

## Workflow
1. Write article in `src/articles/YYYY-MM-DD-title.md`
2. Run `npm run build` to generate HTML in `/docs`
3. Commit both source and build files
4. Push to GitHub
5. GitHub Pages auto-deploys from `/docs` folder

## Setup Steps
1. Create directory structure
2. Initialize npm project (`package.json`)
3. Install dependencies (marked.js, etc.)
4. Create build script (`build.js`)
5. Create HTML templates
6. Create CSS with theme support
7. Add theme switcher JavaScript
8. Configure GitHub Pages to serve from `/docs` folder
