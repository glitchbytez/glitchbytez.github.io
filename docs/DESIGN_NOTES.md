# Design notes

> The written rationale behind this site. The "Craft" section on the page is a summary of this file.
> TODO(Ronald): read this through and reword anything that doesn't sound like you. It's written in the first person.

## Design intent

This site is for two readers: recruiters skimming between many tabs, and hiring managers checking whether the work holds up. It optimises for clarity in the first 30 seconds (who I am, what I build, where the proof is) and then offers depth for anyone who keeps scrolling. The calm look is deliberate: the restraint is meant to show judgement, not hide a lack of content.

## Principles → decisions

The visual language is wabi-sabi: imperfection, impermanence and restraint. Each principle had to turn into a concrete decision, or it was dropped.

| Principle | What it means | The decision it led to |
|---|---|---|
| **Ma** (間) | Meaningful space | One idea per section, long vertical rhythm, body text capped at about 65 characters per line so reading stays easy. |
| **Kanso** (簡素) | Simplicity | One primary action per section, no stacked shadows or gradients, two typefaces only. |
| **Fukinsei** (不均整) | Asymmetry | Off-centre hero, a 12-column grid where cards sit at different offsets, a divider that starts right of centre. No rigid three-equal-column template. |
| **Shizen** (自然) | Naturalness | Muted earth palette, a faint paper grain, a hand-drawn ensō whose stroke thins as it goes, a divider with a gentle wobble. |
| **Kintsugi** (金継ぎ) | Golden repair | Gold is used only for lines: the divider, the hover underline and the edge of project details. It is never used for text. |
| **Seijaku** (静寂) | Stillness | Slow, small motion: one ensō draw and a 12px fade-in per section. Everything works with motion turned off. |

## Accessibility and performance

- **Contrast:** every text and background pair was checked against WCAG AA in both themes. The original moss green (`#6B7152`) only reached 4.23:1 on the paper background, so I darkened it to `#5F6548` (5.05:1 on paper, 4.60:1 on cards). Stone and gold are reserved for lines and never carry text.
- **Keyboard:** skip link, a visible 2px clay focus ring on every control, and a logical tab order. Project details open with a real `<button>` exposing `aria-expanded`, and book notes reveal on focus as well as hover.
- **Motion:** `prefers-reduced-motion` turns off the ensō draw, the reveals and all transitions. Content is never hidden by CSS unless the script has first confirmed it can show it again.
- **Themes:** light ("washi") and dark ("sumi night"). The site follows the system setting, a toggle overrides it, and the choice is remembered. The toggle exposes its state through `aria-pressed`.
- **Small screens:** tested at 320px and 360px with no horizontal scrolling. Long links wrap and touch targets are at least 44px.
- **Fonts:** the first Lighthouse run scored 58 for Performance. Google Fonts serves these two Japanese families as a 455 KB stylesheet with 486 `@font-face` rules, and it blocked rendering. Self-hosting only the Latin subsets (48 KB in total, OFL-licensed) and putting the hero copy in the HTML (so nothing shifts when `content.json` loads) brought it to 99.
- **Lighthouse (12.8, mobile, simulated throttling, 15 October 2026, local server):** Performance 99, Accessibility 100, Best Practices 100, SEO 100. The remaining suggestions (text compression, cache headers) are handled by GitHub Pages.

## Decisions and trade-offs

- **No carousel.** Carousels hide content behind interaction and are rarely advanced past the first slide. Projects are laid out so they can all be seen at once.
- **No skill-percentage bars.** "Java 80%" tells a reader nothing. Plain grouped lists are honest and easy to scan, and every item is something I can talk about in an interview.
- **Dark mode follows the system, but can be overridden.** The system setting is the best guess at a visitor's preference. The toggle exists for people who want something different on this one site.
- **Content is data-driven.** All text, links, projects and books live in `content.json`, so I can update the site without touching the markup. There's a `<noscript>` fallback with the essentials. Unfinished fields show visible `TODO` markers locally but never in production, and placeholder books hide the shelf until real ones replace them.
- **No framework or build step.** It's a small static page, so plain HTML, CSS and JavaScript load fastest and will still work in five years.

## Next

- A small case study for the Splitwise front end: wireframes for the balances screen, focused on making "who owes whom" readable at a glance. Not started yet, so it's listed here rather than shown.
