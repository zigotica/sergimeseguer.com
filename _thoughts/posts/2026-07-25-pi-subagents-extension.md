---
title: I don't want AI agents to *start coding*. I want them to **understand work first**.
date: 2026-07-25
description: "pi-subagents is a workflow I built around a simple belief: the interface with AI is a spec, not a prompt. It makes agents understand, plan, build, and validate work — while keeping judgment where it belongs: with you."
slug: pi-subagents-extension
---

Most AI coding workflows optimise for the first edit.

Give an agent a task. It reads a few files, picks a plausible direction, and starts changing code. Fast feels productive — until it is not. A small request quietly contains product decisions, architectural constraints, edge cases, and assumptions nobody has made explicit. An agent can produce convincing code while solving the wrong problem perfectly.

That is not a failure of the model. It is a failure of the interface.

My view is that **the interface with AI is a spec, not a prompt**. Judgment about what matters, how a system should be structured, and when a spec is wrong stays mine. AI makes execution faster; it does not remove the need for intent.

This is why I build tools around how I want to work, instead of adapting my process to whatever tool happens to ship. [pi-subagents](https://github.com/zigotica/pi-subagents) is one of them: an extension for [Pi](https://pi.dev) that turns agent work into a deliberate loop — understand, agree, build, check.

## Pi gave me right starting point

Pi is intentionally small. It does not ship subagents as a core feature. It has an [official example extension](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions/subagent) that shows how to run another Pi process and bring the result back.

That is a useful primitive, not the workflow I wanted.

I did not want to wrap that example in different labels. I wanted a working system for my own practice: planning that retains context, build steps chosen to fit the risk, and orchestration I can test without burning model calls.

## Plan is conversation, not ceremony

`/plan <task>` starts with a **scout subagent** that reads the codebase using a cheap model and records relevant context in `.ai/features/{slug}/scout.md`.

Then the **planner subagent** uses a more capable model, since it is the core of the workflow. It receives the task and reconnaissance. Crucially, the planner works in an _interactive mode_, remaining in the same child session while I answer its questions. It returns a numbered batch. I reply. It challenges or refines the plan with context still intact. Only explicit confirmation produces `STATUS: SPEC_READY` and `.ai/features/{slug}/spec.md`.

That changes interaction.

A persistent planner feels more like a _design conversation_: someone has read the material, can explain trade-offs, and does not forget an answer from the previous minute. It is not overhead before “real” work.

> **Planning** is the place where expensive mistakes are *cheapest* to prevent.

## Build needs proportion, not theatre

`/build <task>` runs a chain of cheaper, focused agents in a _non-interactive mode_. **Builder** implements. **Linter** checks static quality. **Tester** runs the test suite. **Validator** checks the result against the agreed spec. **Auditor** adds a security review where needed.

_Not every task needs the full chain_. A contained change may need the builder only. Security-focused work can use the builder plus the auditor. The point is not maximum ceremony; it is applying enough scrutiny for the change being made.

Each step receives output from the previous one. The validator does not invent its own version of the task — it checks the implementation against the specification we agreed on. That makes quality a traceable part of delivery, not an optimistic final prompt.

For now, I kept the workflow deliberately direct: `/build` runs a chain. _When a step fails, its feedback goes back to the builder, which fixes the issue and reruns that step until it passes_. A dashboard, state machine, retries, or resume commands may earn their place later — when a real need makes their complexity worthwhile. Today, they would solve problems I do not have. Boring is a feature.

## Configuration belongs to person doing work

Different stages benefit from different model and thinking settings. Most subagents can be fast. Planner needs a stronger model.

pi-subagents supports per-agent configuration, with fallback to the parent session settings. Agents and prompts remain Markdown files in normal Pi project or global directories. No locked-in policy, hidden state, or configuration buried in code.

That is the same principle as the rest of the tool: enough structure to make good practice easy, and enough transparency to keep judgment with the person using it. I am not trying to build an autonomous software factory.

> I am **building tools** that let me work with more clarity, *more intent*, and better feedback loops.

## Source code

pi-subagents is open source, [available on GitHub](https://github.com/zigotica/pi-subagents).
