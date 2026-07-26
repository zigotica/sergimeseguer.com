---
title: What it took to actually **trust** an *AI agent harness*.
date: 2026-04-13
description: I use three AI coding agents across different contexts. I've never fully trusted any of them with my machine. So I built a container sandbox that gives each one exactly what it needs — and nothing else.
slug: trust-ai-agent-harness
---

[Pi](https://pi.dev) clicked for me fast. The philosophy behind it resonates: small system prompt, minimal context and no features it does not need — while remaining extensible through TypeScript extensions, including ones written by the harness itself. It's a tool designed with real restraint, which is rarer than it sounds in this space.

Then I made the connection to [OpenClaw](https://openclaw.ai/) — a tool built on top of Pi by a different author. OpenClaw is powerful by design, but that power needs strong operational boundaries. A powerful tool plus a distracted afternoon is all it takes. Deleted directories, overwritten configs, gone. I didn't want to be that story.

> **Permission fatigue** is the real problem.

The usual approach is to ask: allow this action? Allow that one? It sounds safe, but in practice you end up accepting everything by reflex. It stops being a real decision and becomes a ritual. That's not protection — it's the appearance of it.

I wanted something structural. Not prompts to click through, but actual walls.

## What already existed

I used [Cursor](https://cursor.com/) for work — it's good, but the permission prompts are exactly the fatigue problem described above. For personal projects I'd been using [opencode](https://opencode.ai/) and liking it a lot. Pi was a recent discovery, and it immediately felt like where I wanted to be. Three agents, three contexts, the same underlying trust problem in each.

The space moves fast. I didn't want to solve this problem three times, and I didn't want to marry any single tool. What I wanted was one sandbox I could trust that worked for any agent, and that I could extend as tools change — because they will.

I looked at what already existed. Pi has an [official sandbox extension](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples/extensions/sandbox) using bwrap, which I liked conceptually — but when I ran it inside Docker, it dumped dotfiles straight into my project directory. `.bashrc`, `.env`, `.gitconfig`, `.zshrc` — all of them, right there in the project root. Hard no.

There's also [pi-less-yolo](https://github.com/cjermain/pi-less-yolo), a Docker-based approach that disables bwrap entirely with `--no-sandbox`. One layer of isolation instead of two, and still Pi-only.

Opencode has an external [sandbox via Daytona](https://github.com/daytonaio/daytona/tree/main/libs/opencode-plugin) (now private) that I couldn't get my head around well enough to trust. What I did understand was that git stays available inside it — which means an agent could touch your staging area, mess with your history, or push to your remotes. That was enough to move on.

## Four constraints, non-negotiable

1. Works for any agent. One solution, not three.
2. No git binary, no SSH client inside the container. This removes normal Git CLI and SSH-based access, but not direct access to mounted repository metadata or network access to HTTPS remotes. Good enough for my threat model.
3. No sandbox-created dotfiles or agent state leak into host project directory. Intended project changes persist; sandbox pollution does not.
4. If Pi's bwrap sandbox can work inside Docker, keep it. It adds another constraint around sandboxed shell commands.

## The bwrap problem

Most of the pain was here. My Pi setup uses Bubblewrap (`bwrap`) through its sandbox extension. Running bwrap inside a Docker container requires creating namespaces and mounting filesystems — operations Docker restricts by default.

About two hours cycling through the obvious attempts: `--cap-drop=ALL`, `--cap-add=SYS_ADMIN`, `--security-opt seccomp=unconfined`, various `--sysctl` combinations. None of them worked. The only configuration I found that made bwrap work inside Docker Desktop on macOS was `--privileged`.

`--privileged` is a tradeoff, not a free extra layer. It is required for nested bwrap in my environment and reduces Docker’s normal confinement guarantees. The container has no Docker socket and mounts only project and agent-state directories it needs.

Pi’s `bwrap` sandbox still constrains commands launched through its sandboxed execution path, limiting accidental destructive commands to writable mounted paths and unwanted host-state pollution — not a malicious process escaping a privileged container, secrets available through mounts, project data, or deliberate network exfiltration.

## Two directories, one clear boundary

Different agents store things in different places. Pi keeps everything in `~/.pi`. Opencode splits config into `~/.config/opencode` and session data into `~/.local/share/opencode`. agent-sandbox mounts each harness's config and session directories separately, so each harness sees its config and data exactly where it expects them — and nothing else from your home directory.

The container is configured to run as your UID and GID, so created files normally remain owned by you. No `sudo`. When the container exits (`--rm`), its unmounted filesystem is gone. Changes in bind-mounted project and agent-state directories persist. The base image is Chainguard's Node.js image, with only required runtime tools added.

The agent still has network access — it needs it for API calls. It can exfiltrate data over the network or access API keys passed through environment variables or stored in mounted config. This is **not a vault**. It's seatbelts: **a meaningful layer of protection against the most common failure modes**, not a guarantee against a determined attacker with code execution.

## Adding another agent

The sandbox is extensible. Pi and opencode are built in. Adding a new agent is three files — a script, a Dockerfile, and an entrypoint — plus a single `register` command. I'm using this daily with Pi and opencode. I've also tested Cursor support, though it isn't published yet.

## Source code

agent-sandbox is ooen source, [available on GitHub](https://github.com/zigotica/agent-sandbox). Installation options include Homebrew, npm, curl, and git clone.
