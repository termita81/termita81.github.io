# Developer Commands
- `npm run build` - build site (source: `src/` → output: `docs/`)
- `npm run lint` / `npm run lint:fix` - lint JS

# Build Process
- Single static site build via `build.js` using `marked`
- Templates (YAML) are in `src/templates/` (home, article, default)
- Article markdown goes to `src/articles/`
- `docs/` output is the live site root; never edit directly
- Articles: `YYYY-MM-DD-slug.md` → `/articles/YYYY-MM-DD-slug.html`
- All templated pages get `{{build-date}}` from root of `default.html` footer
- Apps in `src/apps/` are copied verbatim; they are not templated

# Architecture
- Plain HTML + vanilla JS (no framework)
- Source code lives in `src/` directory
- Output in `docs/` directory

# PWA Apps
- Installable apps live in `src/apps/{app-name}/`
- App data comes from `src/apps/versions.json`
- Apps directory is excluded from templating

# Style Rules (from AGENTS.md)
1. No semicolons at end of statements unless necessary
2. Avoid obvious comments; prefer "why" over "what"
3. Write logical code with appropriate abstractions
4. Avoid functions that only call other functions

# Constraints
- No test framework currently (test script exits 1)
- Single-file build (`build.js`) - keep it idiomatic and simple
