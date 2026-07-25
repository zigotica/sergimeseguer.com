# Deployment

Cloudflare Pages is production deployment for `sergimeseguer.com`.

## Pages project settings

Configure Cloudflare Pages Git integration with GitHub repository `zigotica/sergimeseguer.com`:

- Production branch: `master`
- Build command: `npm run build`
- Build output directory: `.astro-build`
- Node.js version: `26.1.0` (`.nvmrc`, `.node-version`, and `package.json` engines match)
- Preview deployments: disabled for pull requests and non-production branches

Build uses Astro static output. Astro generates homepage and Thoughts routes from `src/pages/`, while assets under `public/` are emitted at their root-relative URLs. Output contains homepage, generated Thoughts pages, RSS, sitemap, fonts, favicon, and profile image. Source files, tests, and `node_modules` are not deployable output.

Cloudflare Pages serves output through its CDN. Attach custom domain `sergimeseguer.com` in Pages, configure the DNS record Cloudflare requests for the Pages project, and wait for custom-domain activation and an automatic HTTPS certificate. Verify these URLs before cutover:

- `https://sergimeseguer.com/`
- `https://sergimeseguer.com/thoughts/`
- `https://sergimeseguer.com/thoughts/<slug>/`
- `https://sergimeseguer.com/thoughts/rss.xml`
- `https://sergimeseguer.com/sitemap.xml`

Keep GitHub Pages and its `CNAME` configuration until custom-domain content and HTTPS checks pass. Then remove obsolete `CNAME` and retire GitHub Pages. During DNS propagation, keep both origins healthy. Canonical URLs remain `https://sergimeseguer.com`.

## Publishing Thoughts

Posts remain Markdown files in `_thoughts/posts/*.md`. Run `npm install` and `npm run build` locally with Node `26.1.0` to validate them. Merge valid Markdown to `master`; Cloudflare Pages runs production build and publishes `.astro-build/`. Astro owns homepage generation; `public/` owns root-relative deployed assets. Generated Thoughts pages, RSS, and sitemap are not committed.

If a production build fails, Cloudflare keeps previous successful deployment live. Roll back by selecting that deployment in Pages and activating it, then fix source Markdown before the next merge.
