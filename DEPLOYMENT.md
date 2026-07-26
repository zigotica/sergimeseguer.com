# Deployment

`sergimeseguer.com` is deployed as a static Astro site through Cloudflare Pages.

## Deployment choice

Use **Cloudflare Pages Git integration**, connected to GitHub repository `zigotica/sergimeseguer.com`. Do not use Workers static assets. This repository is static Astro (`output: 'static'`), so Pages provides direct Git-based builds. Workers would add deployment and runtime configuration without providing a runtime behavior this site needs.

Cloudflare builds from repository source. `.astro-build/` is generated output, remains in `.gitignore`, and must never be committed or pushed.

## Cloudflare Pages settings

Create or configure Pages project with these settings:

- Production branch: `master`
- Automatic production builds: enabled for pushes to `master`
- Build command: `npm run build`
- Build output directory: `.astro-build`
- Node.js version: `26.1.0`
- Preview deployments: disabled for pull requests and non-production branches

Cloudflare dashboard labels can change. Preserve these values when following current Pages documentation. Set `NODE_VERSION=26.1.0` in Pages build environment if current dashboard requires an environment variable; `.nvmrc`, `.node-version`, and `package.json` `engines.node` already pin the same exact version.

### Node compatibility check

Check Cloudflare's current [Pages build image documentation](https://developers.cloudflare.com/pages/configuration/build-image/) before creating the project. At this setup check, Pages build image v3 lists Node.js `22.16.0` as its default, accepts **Any version**, and supports `.nvmrc` and `.node-version`; `26.1.0` is therefore retained. Do not select a Node version from the dashboard by guesswork.

If Cloudflare no longer supports `26.1.0`, stop setup. Select newest Cloudflare-supported Node LTS, then set that identical exact version in `.nvmrc`, `.node-version`, `package.json` `engines.node`, and Pages' current Node configuration. Reinstall dependencies with `npm install`; commit any generated `package-lock.json` change. Run both `npm test` and `npm run build` successfully before continuing.

## Local pre-push check

Local hooks are not installed by cloning. Each developer must install and verify hook on each participating machine. This hook runs project tests and non-zero test exit blocks push:

```sh
mkdir -p .git/hooks
cat > .git/hooks/pre-push <<'EOF'
#!/bin/sh
set -eu
repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"
npm test
EOF
chmod +x .git/hooks/pre-push
test -x .git/hooks/pre-push
.git/hooks/pre-push
```

Verify hook through Git push path with a dry run:

```sh
git push --dry-run origin master
```

A failed `npm test` exits non-zero and Git blocks push. `git push --no-verify` can bypass hook. Hook is local protection only, not a server-enforced gate; Cloudflare still deploys any pushed `master` commit, including one from a machine without hook or using `--no-verify`.

No GitHub Actions CI workflow, Cloudflare deploy hook, or deploy-hook secret is part of this design.

## One-time rollout

Complete steps in order:

1. On exact configured Node version, run `npm install`, `npm test`, and `npm run build`. Review build output locally. Do not add `.astro-build/`.
2. Merge and push current changes to GitHub `master`. GitHub's managed `pages-build-deployment` may attempt to deploy this commit and fail. This does not replace the last successful GitHub Pages deployment; do not change GitHub Pages settings or DNS yet.
3. Confirm GitHub `master` contains current source and that `CNAME` is absent. Keep it removed. Git history may recover old configuration only if a separate future decision explicitly restores GitHub Pages; GitHub Pages is not maintained as rollback target.
4. Create Pages project from GitHub repository and select `master`.
5. Apply settings above, create first production deployment, and inspect Cloudflare build logs. Confirm build succeeds and publishes `.astro-build`.
6. Validate temporary Pages URL completely before attaching `sergimeseguer.com`.
7. Attach `sergimeseguer.com` under Pages custom domains. Follow Cloudflare-provided DNS changes. Wait for active custom-domain status and Cloudflare-managed HTTPS certificate.
8. Verify DNS, HTTPS, canonical host behavior, and production paths again on `https://sergimeseguer.com`.
9. After Cloudflare production verification passes, unpublish GitHub Pages under GitHub repository **Settings → Pages**. This retires GitHub Pages; it is not retained as a rollback environment.

## Deployment URL validation

Use temporary URL `https://<project>.pages.dev`; replace `<slug>` with representative post slug, such as `header-is-not-decoration`:

- `https://<project>.pages.dev/`
- `https://<project>.pages.dev/thoughts/`
- `https://<project>.pages.dev/thoughts/<slug>/`
- `https://<project>.pages.dev/thoughts/rss.xml`
- `https://<project>.pages.dev/sitemap.xml`
- `https://<project>.pages.dev/fonts/...` (check representative emitted font, such as `fonts/playfair-roman.woff2`)
- `https://<project>.pages.dev/favicon.ico`
- `https://<project>.pages.dev/sergi-meseguer.jpg`

For every page, confirm successful response, expected content, no missing files, no unexpected redirects, and no browser console or network errors. Confirm:

- HTML canonical URLs use `https://sergimeseguer.com`, not Pages hostname.
- `/thoughts/`, post routes, RSS, and sitemap use trailing slashes where configured. A no-slash request must redirect to its configured slash URL, or show the exact documented Pages static-host behavior without route breakage.
- RSS and sitemap load as XML and contain canonical `https://sergimeseguer.com` URLs.
- Root assets load with status 200.

Do not attach custom domain until this validation passes. After attachment, verify DNS resolves through Cloudflare, Pages custom-domain status is active, certificate is issued, HTTPS has no certificate error, and `https://sergimeseguer.com` serves the Pages deployment. Check both canonical host and any configured alternate-host redirect.

## Ongoing publishing

Posts remain Markdown files in `_thoughts/posts/*.md`. Run `npm test` before every push. A tested push to GitHub `master` causes Cloudflare Pages Git integration to build repository source with `npm run build` and publish `.astro-build` automatically. Generated pages, RSS, sitemap, and build output are not committed.

After each production deployment, check `/`, `/thoughts/`, one post route, `/thoughts/rss.xml`, `/sitemap.xml`, fonts, `/favicon.ico`, `/sergi-meseguer.jpg`, canonical URLs, trailing-slash behavior, DNS, HTTPS, and browser console/network results.

## Troubleshooting

- **Local tests fail:** do not push. Read failing assertion, fix source or post data, then rerun `npm test` and `npm run build`.
- **Cloudflare build fails:** inspect build logs, confirm repository commit, Node version, dependency install, and `npm run build`. Unsupported Node requires version fallback above, reinstall, lockfile review, tests, and build.
- **Empty output or 404 routes:** output directory must be exactly `.astro-build`, not `dist`. Confirm `astro.config.mjs` still has static output and inspect Astro logs.
- **Missing asset:** verify asset exists under `public/`, request root-relative path, and confirm it appears in `.astro-build` locally. Never fix by committing generated output.
- **DNS or certificate pending:** leave Pages deployment intact. Check Cloudflare DNS records and custom-domain status, remove conflicting records only when safe, then wait for DNS and certificate propagation. Do not attach or announce cutover until HTTPS validates.
- **Production validation fails before cutover:** stop domain cutover, fix source or Pages settings, deploy again, and repeat temporary URL validation.
- **Production regression after cutover:** revert offending commit on GitHub `master` and let Pages automatically redeploy, or select and redeploy a known-good Pages deployment using supported Cloudflare controls. Do not restore GitHub Pages as rollback target.

A failed new build leaves the last successful Pages deployment serving according to Cloudflare's deployment behavior. Confirm active deployment before changing domain or DNS. Git history is recovery source for removed GitHub Pages files, not an inactive production environment.
