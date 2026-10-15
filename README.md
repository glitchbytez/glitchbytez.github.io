# Ronald (glitchbytez) — portfolio

A static, single-page portfolio. Plain HTML, CSS and a little vanilla JavaScript: no framework, no build step, no dependencies.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` straight from disk won't load `content.json`, so use a local server.

On `localhost`, unfinished fields show as dashed **TODO** markers and the placeholder books are visible. On any other host (production), TODOs are hidden and the Shelf section (with its nav link) stays hidden until at least one real book replaces the placeholders.

## Editing content

Almost everything lives in **`content.json`**: bio, links, projects, skills and books.

- **Project links** (`repo`, `docs`, `demo`) only render as buttons when the URL is non-empty and not a TODO.
- **Project screenshot:** add `assets/img/<name>.webp` (1200×750 recommended) and set `imageAlt`. The image is skipped until the alt text is real.
- **Books:** `status` is `reading`, `read` or `next`. Remove `"placeholder": true` from real entries.

The hero copy, `<noscript>` fallback, meta tags and JSON-LD in `index.html` repeat a few facts (name, positioning, bio, links) so the page paints instantly and works without JavaScript. If you change those in `content.json`, update `index.html` too.

## Structure

```
index.html            page shell, Craft section, SEO tags
content.json          all editable content
css/tokens.css        fonts, colour, type, spacing, motion tokens
css/base.css          reset, typography, layout primitives, paper grain
css/components.css    header, cards, shelf, craft, polish and motion
js/theme-init.js      applies the saved theme before first paint
js/main.js            renders content.json, theme toggle, reveal-on-scroll
assets/               fonts, favicon, OG image, screenshots
docs/DESIGN_NOTES.md  design rationale (summarised on the page)
```

## Deploy (GitHub Pages)

Push to a repo named `glitchbytez.github.io`, then go to **Settings → Pages** and select **Deploy from a branch → `main` / root**. If the site ends up at a different URL, update the canonical, OG and JSON-LD URLs in `index.html`, plus `robots.txt` and `sitemap.xml`.

See `PORTFOLIO_SPEC.md` for the full spec.
