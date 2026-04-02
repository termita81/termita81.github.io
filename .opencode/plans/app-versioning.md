# App Versioning & Caching System - Todo

## Tasks

- [x] Create initial `src/apps/versions.json` file
- [x] Update `build.js` to auto-generate `versions.json` from apps directory
- [x] Enhance `src/service-worker.js` with dynamic caching and version checking
- [ ] Update `src/apps.html` with dynamic version display UI
- [ ] Add version check script to individual apps (fuel.js/breath.js)

---

## Implementation Notes

**Goal**: Simple PWA-based system where users can install/uninstall apps and receive update notifications.

**Key Components**:
1. Single root-level Service Worker (no per-app SW)
2. Manual version strings (e.g., `2026-04-02_1`)
3. Latest version only in `versions.json`
4. Version checks only on apps page (not individual apps)

**File Changes**:
- New: `src/apps/versions.json` (auto-generated)
- Modified: `build.js` (add version generation)
- Modified: `src/service-worker.js` (dynamic caching + messages)
- Modified: `src/apps.html` (dynamic version UI)
- Modified: `src/apps/fuel/fuel.js` (version check)
- Modified: `src/apps/breath/breath.js` (version check)

**Workflow**:
1. User visits apps page → fetches versions.json
2. Compares with localStorage → shows update banner
3. User clicks Install → SW caches app files
4. App runs offline from cache
5. User visits apps page again → check for updates
6. If newer version detected → show "Reload?" dialog
