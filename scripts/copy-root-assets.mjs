import { access, cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = join(repositoryRoot, '.astro-build');
const requiredInputs = ['index.html', 'fonts', 'favicon.ico', 'sergi-meseguer.jpg'];

for (const input of requiredInputs) {
  try {
    await access(join(repositoryRoot, input));
  } catch {
    throw new Error(`Required deployment input is missing: ${input}`);
  }
}

await mkdir(outputDirectory, { recursive: true });
for (const input of requiredInputs) {
  await cp(join(repositoryRoot, input), join(outputDirectory, input), { recursive: true });
}
