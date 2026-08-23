# Thoughts

Posts live in `_thoughts/posts/*.md`. Each file needs non-empty `title`, `date`, `description`, and `slug` front matter, followed by Markdown content:

```markdown
---
title: A post title
date: 2020-01-15
description: Short description for listings and feeds.
slug: a-post-title
---

Post content.
```

Dates use `YYYY-MM-DD`, cannot be future dates, and slugs use lowercase ASCII letters, numbers, and hyphens. Supported Markdown is limited to headings, paragraphs, lists, links, emphasis, and blockquotes. Figure component syntax is supported; raw HTML outside supported tags and unsupported constructs render as text.

Add figures with component-style syntax. Source names resolve from `public/` (for example, `figures/diagram.svg`). SVG files are injected inline for CSS styling; other image files render as `<img>`:

```html
<Figure srcs="figures/diagram.svg" alts="Diagram" caption="Optional caption" />
<Figure srcs="figures/mobile.svg,figures/desktop.svg" alts="Mobile view,Desktop view" caption="Responsive diagram" />
<Figure cells srcs="figures/first.svg,figures/second.svg,figures/third.svg" caption="Related diagrams" />
```

With two sources and no flag, first renders in `div.figure-portrait` on viewports under 500px with portrait aspect, and second renders in `div.figure-landscape` otherwise. `cells` always renders every source in `div.figure-cell`: one column below 500px and side by side from 500px. Use comma-separated `srcs` and `alts` for any number of image files and labels.

Run `npm install`, then `npm run build` with Node `26.1.0` before merging. Astro writes homepage and Thoughts static output to ignored `.astro-build/`. Assets in `public/` are emitted at root-relative URLs; generated Thoughts pages, RSS, and sitemap stay out of committed repository paths.

Merge Markdown changes to `master` to trigger Cloudflare Pages production build. Cloudflare publishes `.astro-build/` with no adapter, server runtime, or client framework. See [DEPLOYMENT.md](DEPLOYMENT.md) for Pages settings and domain cutover.
