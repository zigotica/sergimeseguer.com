import { execFileSync } from 'node:child_process';
import type { APIRoute } from 'astro';
import { getPosts } from '../lib/posts';

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LEGACY_HOME_LASTMOD = '2026-06-29';

function homepageLastmod() {
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', 'index.html'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return ISO_DATE.test(date) ? date : LEGACY_HOME_LASTMOD;
  } catch {
    return LEGACY_HOME_LASTMOD;
  }
}

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const urls = [
    { loc: 'https://sergimeseguer.com/', lastmod: homepageLastmod() },
    { loc: 'https://sergimeseguer.com/thoughts/' },
    ...posts.map((post) => ({
      loc: `https://sergimeseguer.com/thoughts/${post.slug}/`,
      lastmod: post.date,
    })),
  ];

  const entries = urls
    .map(({ loc, lastmod }) => `
  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`)
    .join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<!-- generated: thoughts-blog-markdown -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</urlset>
`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
