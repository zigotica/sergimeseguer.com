---
title: Software, **for one**
date: 2026-08-22
description: "I wanted graphics for my writing, something that belonged to the same **visual system** as the rest of my site: geometric, slightly imperfect, and **recognizable** from one article to the next. So I did what any respectable nerd would do in 2026: *I built an app with one purpose, and an audience of one*."
slug: software-for-one
og: figures/software-for-one/og.png
---

A few years ago, building something this specific would have been difficult to justify. Today, the calculation is different. The cost of making exactly what I want is getting close enough to the cost of adapting my workflow around somebody else's tool.

That made me realize something had changed:

> When **software becomes cheap enough** to build, adapting your needs to someone else's tool stops being the *obvious choice*.

## Software for an audience of one

There's nothing particularly new about software built for a small audience. In 2004, Clay Shirky described [situated software](http://shirky.com/essays/situated-software/): software designed for a particular context, rejecting the assumption that scalability, generality, and completeness are always virtues.

The extreme version is software built for yourself. **Personal software**, or software for an audience of one, is having something of a revival as coding agents change what is worth building. An idea explored recently by Phill Johntony in [Personal Software: Apps for an Audience of One](https://philljohntony.com/blog/2026-06-30-personal-software-ai/) and Adam Waxman in [Software for One](https://www.ajwaxman.com/writing/software-for-one), among others.

**Figure Studio** fits that description particularly well. I know exactly who its user is, what machine it runs on, what website its output is for, and which problems it doesn't need to solve.

It needs no authentication, accounts, collaboration, cloud storage, analytics, onboarding, or deployment infrastructure. Those aren't missing features. I simply don't need them.

## A deliberately constrained tool

Figure Studio knows how to make one kind of thing: figures for my articles.

Its visual vocabulary is intentionally small: a handful of geometric shapes, a fixed palette derived from the site, thin connections, organic boundaries, and sparse compositions.

Using it is equally simple. A prompt only needs to describe the idea I want to represent:

<Figure 
    srcs="figures/software-for-one/ai-prompt.png"
    alts="Example prompt: A single change propagates through several independent parts of a system."
    cells
    caption="A prompt describing the idea behind a figure."
/>

Figure Studio interprets that idea within its visual system and produces two compositions:

<Figure 
    srcs="figures/software-for-one/change-propagation-portrait-square.svg, figures/software-for-one/change-propagation-landscape-square.svg"
    alts="One input spreading into four outputs in a vertical composition, Same topology arranged in a horizontal composition"
    cells
    caption="Same idea, composed for portrait and landscape."
/>

AI doesn't generate the final image. Instead, it produces a structured description of the figure: its elements, their semantic roles, and their **topology**, what connects to what, what contains what, and how the parts relate.

The renderer takes care of the rest:

`prompt → AI → FigureSpec → deterministic renderer → SVG`

The model can decide that an idea is best represented as a convergence, sequence, cluster, boundary, or fan-out. It cannot suddenly introduce gradients, 3D icons, or a completely different visual style. Those decisions belong to the system.

## Same topology, different geometry

Responsive figures introduced an interesting problem.

The site needs landscape graphics on wider screens and portrait graphics on narrow ones. My first attempt treated that as a CSS problem: rotate the landscape SVG and compensate for the space it occupied.

Technically possible, compositionally wrong. A good horizontal composition isn't automatically a good vertical one.

Figure Studio instead produces **two projections** of the same `FigureSpec`. They preserve the same topology, the same elements and relationships, while arranging their geometry independently for each canvas.

Both compositions are visible while I'm working, and each can be refined and exported independently.

This separation between semantics and geometry is also what makes AI useful without giving it control of the visual system. The model gets the part where ambiguity helps: interpreting what I mean and proposing a semantic structure. Everything that needs to remain consistent, including topology, palette, shapes, rendering rules, and output format, becomes software.

The constraints don't require the input itself to be diagrammatic. Figure Studio can interpret something much more abstract:

> An old system has accumulated many moving parts and dependencies over time. The replacement accomplishes the same job with a much smaller set of responsibilities and clearer relationships.

<Figure 
    srcs="figures/software-for-one/ai-prompt-result-portrait.svg,figures/software-for-one/ai-prompt-result-landscape.svg"
    alts="Figure Studio's interpretation of a complex system becoming simpler"
    caption="The abstract idea from the previous quote, interpreted within the same visual system."
/>

AI proposes; the system constrains.

## Built with AI, using AI

There's another reason Figure Studio exists in this form: it was built with AI, and it also uses AI.

Coding agents made it reasonable for me to build such a specific application in the first place. AI reduces the cost of building the tool, while *encoded constraints* reduce the amount of work AI needs to do inside it.

Instead of explaining the same visual rules in every prompt, I can make them part of the software.

## Local by design

Figure Studio is open source, but that doesn't mean it needs to become a service. I run it on my machine or in my homelab, use it while writing, export the two SVGs, and commit them with the article. That's the whole workflow.

Open sourcing it simply means someone else can inspect it, modify it, or make it theirs. I don't need to turn that possibility into product requirements.

This is perhaps what I like most about personal software: **it can be complete without being general**.

## What becomes worth building?

There are countless problems too small or too specific to justify conventional software development. Historically, we solved many of them with spreadsheets, scripts, awkward combinations of existing tools, or simply tolerated the friction.

Increasingly, another option is available: build the thing.

> Coding agents don't just make existing software development **faster**. They change the threshold at which writing software becomes *rational*.

That doesn't mean every inconvenience deserves an application, or that the cost becomes zero. **Software still needs judgment**, maintenance, and occasionally restraint.

But *lowering the cost* of building software doesn't just change how quickly we build. It *changes what we consider worth building* in the first place.

## Source

Figure Studio is open source, [available on GitHub](https://github.com/zigotica/figure-studio).
