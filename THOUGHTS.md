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

Dates use `YYYY-MM-DD`, cannot be future dates, and slugs use lowercase ASCII letters, numbers, and hyphens. Supported Markdown is limited to headings, paragraphs, lists, links, emphasis, and blockquotes. Raw HTML and unsupported constructs render as text.

Run `npm install`, then `npm run build` with Node `26.1.0` before merging. Astro writes homepage and Thoughts static output to ignored `.astro-build/`. Assets in `public/` are emitted at root-relative URLs; generated Thoughts pages, RSS, and sitemap stay out of committed repository paths.

Merge Markdown changes to `master` to trigger Cloudflare Pages production build. Cloudflare publishes `.astro-build/` with no adapter, server runtime, or client framework. See [DEPLOYMENT.md](DEPLOYMENT.md) for Pages settings and domain cutover.
