---
title: When deployment **becomes boring again**
date: 2026-08-08
description: Good infrastructure should match the problem it's solving. This migration was less about hosting and more about choosing the smallest system that could do the job.
slug: when-deployment-becomes-boring-again
og: figures/when-deployment-becomes-boring-again/og.png
---

One of my favourite properties of a software system is that it eventually becomes **boring**. Not because nobody cares about it, but because it disappears into the background. You stop thinking about deployment, certificates, DNS, or build pipelines and get back to the work the system exists to support.

That is exactly what happened when I moved this site from a single HTML file on GitHub Pages to [Astro](https://astro.build/) running on the [Cloudflare Developer Platform](https://www.cloudflare.com/developer-platform/).

The motivation was never to leave GitHub Pages. It served this site perfectly well while it was just one file. The change came when I wanted to write articles in Markdown and let Astro generate the site. Once a build step became part of the workflow, the deployment model became more important than the hosting provider.

## Complexity should match the problem

AWS can do everything this setup does. It can also do much more. That flexibility is exactly what makes it valuable for larger systems.

It also comes with decisions, permissions, services, credentials, and operational surface area that simply do not solve a problem I have.

For a personal website, I wanted the smallest system that could do the job well.

[Cloudflare Pages](https://pages.cloudflare.com/) reduces publishing to four things:

- a Git repository
- a branch
- a build command
- an output directory

Push to `master`, Cloudflare builds the Astro project and publishes it automatically.

That's it.

> Infrastructure earns its place when it stays **out of the way.**

## Choosing the smallest system

One thing I keep noticing, whether I'm designing software systems or AI workflows, is that unnecessary complexity rarely announces itself. It usually arrives disguised as flexibility or future-proofing.

Sometimes those trade-offs are absolutely worth making. Sometimes they are just overhead.

For this site, I wanted to optimise for writing, not infrastructure.

Cloudflare's developer platform connects directly to GitHub, detects changes on `master`, runs `npm run build`, serves the generated files from its global network, manages HTTPS, and gives me DNS control for the domain. The free tier is generous enough for a personal website, which means I spend my attention on content instead of operations.

## Clear ownership

The migration also simplified ownership. GitHub stores the source. Cloudflare builds and serves production. Namecheap remains the domain registrar.

Each service has one clear responsibility. There is very little to configure, and even less to remember.

GitHub Pages is unpublished. `sergimeseguer.com` and `www` both point to the same deployment, with `www` permanently redirecting to the apex domain. One site, one deployment path.

## Boring is a feature

I've been writing recently about AI workflows, planning before implementation, and building systems that remove unnecessary friction instead of adding more automation.

This migration reminded me that the same principle applies to infrastructure.

The best deployment pipeline is not the one with the most features.

It is the one you stop thinking about.

<Figure
    srcs="figures/when-deployment-becomes-boring-again/over-engineered-system-to-boring-system-portrait.svg,figures/when-deployment-becomes-boring-again/over-engineered-system-to-boring-system-landscape.svg"
    alts="Same job. Fewer moving parts."
    caption="Same job. Fewer moving parts."
/>

> The system is now _small enough_ to understand in one sitting — and **boring enough to leave alone afterward.**
