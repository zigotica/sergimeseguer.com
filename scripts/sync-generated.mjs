import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const stagingRoot = join(repositoryRoot, '.astro-build');
const stagingThoughts = join(stagingRoot, 'thoughts');
const targetThoughts = join(repositoryRoot, 'thoughts');
const marker = 'generated: thoughts-blog-markdown';

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function hasMarker(path) {
  try {
    return (await readFile(path, 'utf8')).includes(marker);
  } catch {
    return false;
  }
}

async function moveGeneratedChild(tempChild, targetChild) {
  if (existsSync(targetChild)) {
    if (!(await isDirectory(targetChild)) || !(await hasMarker(join(targetChild, 'index.html')))) {
      throw new Error(`Cannot replace hand-authored path ${targetChild}; choose a different post slug`);
    }
    await rm(targetChild, { recursive: true, force: true });
  }
  await rename(tempChild, targetChild);
}

async function sync() {
  if (!(await isDirectory(stagingThoughts))) throw new Error('Astro build did not produce thoughts output');
  if (!existsSync(join(stagingRoot, 'sitemap.xml'))) throw new Error('Astro build did not produce sitemap.xml');

  const tempRoot = await mkdtemp(join(repositoryRoot, '.thoughts-sync-'));
  const tempThoughts = join(tempRoot, 'thoughts');
  try {
    await cp(stagingThoughts, tempThoughts, { recursive: true });
    await cp(join(stagingRoot, 'sitemap.xml'), join(tempRoot, 'sitemap.xml'));
    await mkdir(targetThoughts, { recursive: true });

    const stagedEntries = await readdir(tempThoughts, { withFileTypes: true });
    const stagedPostSlugs = new Set(
      stagedEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
    );

    for (const slug of stagedPostSlugs) {
      const targetChild = join(targetThoughts, slug);
      if (existsSync(targetChild) && (!(await isDirectory(targetChild)) || !(await hasMarker(join(targetChild, 'index.html'))))) {
        throw new Error(`Cannot replace hand-authored path ${targetChild}; choose a different post slug`);
      }
    }

    const currentEntries = await readdir(targetThoughts, { withFileTypes: true });
    for (const entry of currentEntries) {
      if (!entry.isDirectory() || !stagedPostSlugs.has(entry.name)) {
        if (entry.isDirectory() && (await hasMarker(join(targetThoughts, entry.name, 'index.html')))) {
          await rm(join(targetThoughts, entry.name), { recursive: true, force: true });
        }
      }
    }

    for (const entry of stagedEntries) {
      if (entry.isDirectory()) {
        await moveGeneratedChild(join(tempThoughts, entry.name), join(targetThoughts, entry.name));
      }
    }

    for (const filename of ['index.html', 'rss.xml']) {
      const stagedFile = join(tempThoughts, filename);
      if (existsSync(stagedFile)) {
        await rename(stagedFile, join(targetThoughts, filename));
      }
    }
    await rename(join(tempRoot, 'sitemap.xml'), join(repositoryRoot, 'sitemap.xml'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

await sync();
