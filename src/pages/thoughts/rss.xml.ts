import type { APIRoute } from 'astro';
import { getPosts } from '../../lib/posts';

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const items = posts
    .map((post) => {
      const url = `https://sergimeseguer.com/thoughts/${post.slug}/`;
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <dc:date>${post.date}</dc:date>
      <description>${escapeXml(post.description)}</description>
    </item>`;
    })
    .join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<!-- generated: thoughts-blog-markdown -->
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Sergi Meseguer Thoughts</title>
    <link>https://sergimeseguer.com/thoughts/</link>
    <description>Thoughts on engineering, products, and the craft of building well.</description>${items}
  </channel>
</rss>
`;

  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
