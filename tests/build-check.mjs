import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const sourceDirectory = join(root, '_thoughts');
const outputDirectory = join(root, 'thoughts');
const sitemap = join(root, 'sitemap.xml');
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
`;

function build() {
  try {
    execFileSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    return { status: 0, output: '' };
  } catch (error) {
    return { status: error.status ?? 1, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  }
}

test('Thoughts generation fixture', async () => {
  const backup = await mkdtemp(join(tmpdir(), 'thoughts-build-check-'));
  try {
    await cp(sourceDirectory, join(backup, '_thoughts'), { recursive: true });
    if (existsSync(outputDirectory)) await cp(outputDirectory, join(backup, 'thoughts'), { recursive: true });
    if (existsSync(sitemap)) await cp(sitemap, join(backup, 'sitemap.xml'));

    await writeFile(fixture, validPost);
    assert.equal(build().status, 0);

    const postHtml = await readFile(join(outputDirectory, 'fixture-post', 'index.html'), 'utf8');
    const indexHtml = await readFile(join(outputDirectory, 'index.html'), 'utf8');
    const rss = await readFile(join(outputDirectory, 'rss.xml'), 'utf8');
    const generatedSitemap = await readFile(sitemap, 'utf8');
    assert.match(postHtml, /canonical.*thoughts\/fixture-post\//);
    assert.match(postHtml, /Raw &#x3C;em>HTML&#x3C;\/em>/);
    assert.doesNotMatch(postHtml, /<script|astro-island/);
    assert.match(indexHtml, /Fixture &lt;post&gt;/);
    assert.match(rss, /fixture-post/);
    assert.match(generatedSitemap, /thoughts\/fixture-post\//);

    await rm(fixture);
    assert.equal(build().status, 0);
    assert.equal(existsSync(join(outputDirectory, 'fixture-post')), false);
  } finally {
    await rm(sourceDirectory, { recursive: true, force: true });
    await cp(join(backup, '_thoughts'), sourceDirectory, { recursive: true });
    await rm(outputDirectory, { recursive: true, force: true });
    if (existsSync(join(backup, 'thoughts'))) await cp(join(backup, 'thoughts'), outputDirectory, { recursive: true });
    await rm(sitemap, { force: true });
    if (existsSync(join(backup, 'sitemap.xml'))) await cp(join(backup, 'sitemap.xml'), sitemap);
    await rm(backup, { recursive: true, force: true });
  }
});
