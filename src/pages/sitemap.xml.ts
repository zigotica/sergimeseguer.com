import type { APIRoute } from 'astro';
import { getPosts } from '../lib/posts';

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const urls = [
    { loc: 'https://sergimeseguer.com/' },
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
