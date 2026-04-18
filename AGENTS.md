# Developer Commands

- `npm run build` - build site (source: `src/` → output: `docs/`)
- `npm run lint` / `npm run lint:fix` - lint JS

No test framework currently (test script exits 1)

# Build Process

- Single static site build via `build.js` using `marked`
- Templates (YAML) are in `src/templates/` (home, article, default)
- Article markdown goes to `src/articles/`
- `docs/` output is the live site root; NEVER edit directly
- Articles: `YYYY-MM-DD-slug.md` → `/articles/YYYY-MM-DD-slug.html`
- All templated pages get `{{build-date}}` from root of `default.html` footer
- Apps in `src/apps/` are copied verbatim; they are not templated

# Architecture

- Plain HTML + vanilla JS (no framework)
- Source code lives in `src/` directory - any and all code changes happen ONLY IN src/!
- Output in `docs/` directory - NO CODE CHANGE HERE!

# PWA Apps

- Installable apps live in `src/apps/{app-name}/`
- App data comes from `src/apps/versions.json`
- Apps directory is excluded from templating

# Style Rules

- No semicolons at end of statements unless necessary
- Avoid obvious comments; prefer "why" over "what"
- Write logical code with appropriate abstractions
- Prefer small functions with clear purpose and scope
- Avoid functions that only call other functions
- Prefer const instead of let
- Prefer early exit, with guard close, instead of deep nesting
- When catching errors, log them with console.error

# Important

- Single-file build (`build.js`) - keep it idiomatic and simple
- When committing, append "\nwith AI ($model_name)" to the commit message, using the actual model name (e.g. "claude-sonnet-4-6")
- Don't ever push to source control