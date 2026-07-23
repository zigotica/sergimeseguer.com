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

Run `npm install`, then `npm run build` before committing. Astro builds into ignored `.astro-build/`; the post-build sync writes committed `thoughts/`, `thoughts/rss.xml`, and `sitemap.xml` output into repository paths. Generated output must be committed. No client JavaScript or browser framework runtime is used for Thoughts pages.

GitHub Pages remains managed by repository Pages settings. No custom deployment workflow is required.
