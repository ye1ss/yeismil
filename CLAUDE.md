# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**yeismil.com** — personal portfolio of Yeismil del Rosario (full-stack developer, Madrid). Static HTML/CSS/JS, no framework, no runtime dependencies. English by default with a Spanish toggle; dark by default with a light mode.

The previous version (free-resources landing with Brevo + Cloudflare Worker) is preserved in the git tag `v1-recursos`.

## Architecture

```
content/projects.mjs   → ALL project content (EN + ES). Edit this to add/change projects.
scripts/build.mjs      → Generates index.html and projects/<slug>/index.html from the content.
index.html             → GENERATED. Home: cover + profile + socials + projects + about.
projects/<slug>/       → GENERATED. One case-study page per project with `page: true`.
assets/site.css        → All styles (tokens on :root / [data-theme="light"]).
assets/site.js         → Theme toggle, EN/ES toggle, copy email, scroll reveal, cover dot-field canvas.
assets/img/projects/   → Project screenshots (WebP, 1600px wide desktop / 640px mobile).
cv/                    → CV source (cv.html) and the PDF linked from the site.
img/pulpo.png          → Favicon and current avatar placeholder.
```

**Never edit `index.html` or `projects/` by hand** — change `content/projects.mjs` or `scripts/build.mjs` and run:

```bash
node scripts/build.mjs
```

## Conventions

- **Bilingual content**: every visible string is rendered twice, `<x lang="en">` and `<x lang="es">`; CSS hides the inactive one via `html[data-lang]`. In the build script use the helpers `t(en, es, tag?)` / `bi({en, es}, tag?)`.
- **Theme/lang** are set before paint by an inline script in `<head>` from `localStorage` (`theme`, `lang`).
- **Design language**: hairline borders, square corners (no rounded cards), Inter Tight + JetBrains Mono, accent `--accent` (#2f6bff dark / #0050ff light). Avatar uses a solid blue offset shadow.
- **Images**: `img()` in the build reads WebP dimensions to set width/height (no layout shift). Thumbnails on the home share a `view-transition-name` with the case-study hero, so navigation animates between them (cross-document View Transitions).
- **Performance**: the cover canvas caches colours (updated on `themechange`), pauses when off-screen or the tab is hidden, and respects `prefers-reduced-motion`.

## Screenshots

Project screenshots were captured from the live sites with Playwright (from `repfy/node_modules/playwright-core`) at 1440×900 @2x and 390×844 @2x, then converted with `cwebp -resize 1600 0 -q 78` (mobile: 640).

## Local preview

```bash
python3 -m http.server 5174
```

Paths are absolute (`/assets/...`), so serve from the repo root.
