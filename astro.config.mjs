import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const thoughtsPostsDirectory = fileURLToPath(new URL('./_thoughts/posts/', import.meta.url));

export default defineConfig({
  output: 'static',
  site: 'https://sergimeseguer.com',
  trailingSlash: 'always',
  outDir: fileURLToPath(new URL('./.astro-build/', import.meta.url)),
  integrations: [
    {
      name: 'thoughts-content-watch',
      hooks: {
        'astro:server:setup': ({ server }) => {
          server.watcher.add(join(thoughtsPostsDirectory, '**/*.md'));
          server.watcher.on('all', (event, file) => {
            if (!['add', 'change', 'unlink'].includes(event) || !file.startsWith(thoughtsPostsDirectory)) return;
            server.moduleGraph.invalidateAll();
            server.ws.send({ type: 'full-reload', path: '*' });
          });
        },
      },
    },
  ],
});
