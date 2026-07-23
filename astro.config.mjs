import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  output: 'static',
  site: 'https://sergimeseguer.com',
  trailingSlash: 'always',
  outDir: fileURLToPath(new URL('./.astro-build/', import.meta.url)),
});
