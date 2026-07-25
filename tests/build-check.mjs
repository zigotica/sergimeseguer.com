import { chmod, cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const sourceDirectory = join(root, '_thoughts');
const outputDirectory = join(root, '.astro-build');
const fixture = join(sourceDirectory, 'posts', 'fixture.md');
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const validPost = `---
title: "Fixture <post>"
date: ${yesterday}
description: "Safe & short description"
slug: fixture-post
---

# Heading

Raw <em>HTML</em>, **strong**, *emphasis*, and [link](https://example.com).

<a class="fixture-link" data-cursor-target href="#contact" style="color: red">Raw link</a>, <code class="language-js">raw code</code><br>next line.
`;

function build(env = {}) {
  try {
    execFileSync('npm', ['run', 'build'], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, ...env },
    });
    return { status: 0, output: '' };
  } catch (error) {
    return { status: error.status ?? 1, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  }
}

async function fakeGit(date) {
  const directory = await mkdtemp(join(tmpdir(), 'thoughts-git-'));
  const executable = join(directory, 'git');
  await writeFile(executable, `#!/bin/sh\nprintf '%s\\n' '${date}'\n`);
  await chmod(executable, 0o755);
  return { directory, path: `${directory}:${process.env.PATH ?? ''}` };
}

async function preserveOutput() {
  const backup = await mkdtemp(join(tmpdir(), 'thoughts-build-output-'));
  const hadOutput = existsSync(outputDirectory);
  if (hadOutput) await cp(outputDirectory, join(backup, '.astro-build'), { recursive: true });
  return async () => {
    await rm(outputDirectory, { recursive: true, force: true });
    if (hadOutput) await cp(join(backup, '.astro-build'), outputDirectory, { recursive: true });
    await rm(backup, { recursive: true, force: true });
  };
}

test('production output contains homepage, assets, Thoughts routes, RSS, and sitemap', async () => {
  const restoreOutput = await preserveOutput();
  const sourceBackup = await mkdtemp(join(tmpdir(), 'thoughts-build-source-'));
  const git = await fakeGit('2025-01-02');
  try {
    await cp(sourceDirectory, join(sourceBackup, '_thoughts'), { recursive: true });
    await writeFile(fixture, validPost);
    assert.equal(build({ PATH: git.path }).status, 0);

    const homepage = await readFile(join(outputDirectory, 'index.html'), 'utf8');
    const postHtml = await readFile(join(outputDirectory, 'thoughts', 'fixture-post', 'index.html'), 'utf8');
    const thoughtsIndex = await readFile(join(outputDirectory, 'thoughts', 'index.html'), 'utf8');
    const rss = await readFile(join(outputDirectory, 'thoughts', 'rss.xml'), 'utf8');
    const sitemap = await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8');

    assert.match(homepage, /Sergi[\s\S]*Meseguer/);
    assert.match(homepage, /Engineering Lead · Barcelona · Remote/);
    assert.match(homepage, /id="voronoiSvg"/);
    assert.match(homepage, /data-cursor(?:="true")?(?:\s|>)/);
    assert.match(homepage, /data-cursor-polygon/);
    assert.doesNotMatch(homepage, /id="cursorRing"/);
    assert.match(homepage, /href="\/thoughts\/"/);
    assert.match(homepage, /© 2026 Sergi Meseguer/);
    assert.ok((await readFile(join(outputDirectory, 'favicon.ico'))).length > 0);
    assert.ok((await readFile(join(outputDirectory, 'sergi-meseguer.jpg'))).length > 0);
    assert.ok((await readFile(join(outputDirectory, 'fonts', 'playfair-roman.woff2'))).length > 0);
    assert.match(postHtml, /canonical.*thoughts\/fixture-post\//);
    assert.match(postHtml, /id="contact"/);
    assert.match(postHtml, /href="#contact"/);
    assert.match(postHtml, /data-cursor(?:="true")?(?:\s|>)/);
    assert.match(postHtml, /data-cursor-polygon/);
    assert.match(postHtml, /Raw &#x3C;em>HTML&#x3C;\/em>/);
    assert.match(postHtml, /<a href="#contact" class="fixture-link" data-cursor-target>Raw link<\/a>/);
    assert.match(postHtml, /<code class="language-js">raw code<\/code><br>next line\./);
    assert.doesNotMatch(postHtml, /fixture-link[^>]*style=/);
    assert.doesNotMatch(postHtml, /astro-island/);
    assert.match(thoughtsIndex, /Fixture (?:&lt;|&#x3C;)post>/);
    assert.match(thoughtsIndex, /id="contact"/);
    assert.match(thoughtsIndex, /href="#contact"/);
    assert.match(thoughtsIndex, /data-cursor(?:="true")?(?:\s|>)/);
    assert.match(thoughtsIndex, /data-cursor-polygon/);
    assert.match(rss, /fixture-post/);
    assert.match(sitemap, /thoughts\/fixture-post\//);
    assert.match(sitemap, /<lastmod>2025-01-02<\/lastmod>/);

    for (const sourceOnly of ['_thoughts', 'scripts', 'tests', 'node_modules']) {
      assert.equal(existsSync(join(outputDirectory, sourceOnly)), false, `${sourceOnly} leaked into output`);
    }

    await rm(fixture);
    assert.equal(build({ PATH: git.path }).status, 0);
    assert.equal(existsSync(join(outputDirectory, 'thoughts', 'fixture-post')), false);
  } finally {
    await rm(fixture, { force: true });
    await rm(sourceDirectory, { recursive: true, force: true });
    await cp(join(sourceBackup, '_thoughts'), sourceDirectory, { recursive: true });
    await rm(sourceBackup, { recursive: true, force: true });
    await rm(git.directory, { recursive: true, force: true });
    await restoreOutput();
  }
});

test('sitemap uses deterministic fallback for invalid Git metadata', async () => {
  const restoreOutput = await preserveOutput();
  const sourceBackup = await mkdtemp(join(tmpdir(), 'thoughts-build-source-'));
  const git = await fakeGit('not-a-date');
  try {
    await cp(sourceDirectory, join(sourceBackup, '_thoughts'), { recursive: true });
    assert.equal(build({ PATH: git.path }).status, 0);
    const sitemap = await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8');
    assert.match(sitemap, /<lastmod>2026-06-29<\/lastmod>/);
  } finally {
    await rm(sourceDirectory, { recursive: true, force: true });
    await cp(join(sourceBackup, '_thoughts'), sourceDirectory, { recursive: true });
    await rm(sourceBackup, { recursive: true, force: true });
    await rm(git.directory, { recursive: true, force: true });
    await restoreOutput();
  }
});

test('build owns homepage output without legacy root index.html', async () => {
  const restoreOutput = await preserveOutput();
  try {
    assert.equal(existsSync(join(root, 'index.html')), false);
    assert.equal(build().status, 0);
    const homepage = await readFile(join(outputDirectory, 'index.html'), 'utf8');
    assert.match(homepage, /Sergi[\s\S]*Meseguer/);
    assert.match(homepage, /id="contact"/);
  } finally {
    await restoreOutput();
  }
});
