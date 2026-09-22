---
title: Stop designing for **features you don't need** *yet*.
date: 2026-09-22
description: The first implementation makes an idea usable. Real _use is better at finding the next requirement_ than speculation.
slug: stop-designing-features-you-dont-need
og: figures/stop-designing-features-you-dont-need/og.png
---

I have already written about why I built [agent-sandbox](/thoughts/trust-ai-agent-harness/) and why I use [pi-subagents](/thoughts/pi-subagents-extension/) to plan and validate work.

Recently, both changed. Not because I had more features planned, but because I kept using them.

> Building solves the problems you started with. _Using what you built reveals the ones you missed_.

The first `/build` workflow in pi-subagents ran its checks sequentially. It was simple and worked well for smaller tasks, but as I started using it on more complex work, the cost became obvious: independent checks were waiting for each other for no reason.

So _I made them concurrent_.

<Figure 
    srcs="figures/pi-subagents-extension/build-subagent-portrait.svg, figures/stop-designing-features-you-dont-need/build-subagent-concurrent-portrait.svg"
    alts="Sequential subagents, Concurrent subagents"
    cells
    caption="Sequential vs concurrent subagents"
/>

That made builds faster and immediately exposed the next problem. Several agents were now working at once, but from one terminal I could not see what each was doing.

So _I made the concurrency visible_. When Pi runs inside [Herdr](https://herdr.dev/), each subagent gets its own named pane. Pi still owns the workflow; Herdr only exposes what is happening inside it.

Something similar happened with [agent-sandbox](https://github.com/zigotica/agent-sandbox).

Testing it with a new project exposed a boundary I had missed. The source code needed to be shared between macOS and the Linux sandbox, but `node_modules` did not. Architecture-specific dependencies installed on the host could fail inside Linux, so the project's tests could not run inside the sandbox.

The **source belongs to the project**. The _dependencies belong to the environment_. So agent-sandbox now keeps sandbox dependencies isolated while the source and lockfile remain shared.

None of these changes came from trying to anticipate every possible requirement. I could have designed all of this upfront. I probably would have designed more than I needed.

Every design decision introduces trade-offs. The right ones become clearer when the constraints are real.

> Don't optimize for predicting what comes next. _Optimize for learning and adapting_.

## Source

[agent-sandbox](https://github.com/zigotica/agent-sandbox) and [pi-subagents](https://github.com/zigotica/pi-subagents) are open source.
