import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { codeToHast } from 'shiki';
import { parse as parseYaml } from 'yaml';

export interface ThoughtPost {
  title: string;
  titleHtml: string;
  date: string;
  description: string;
  descriptionHtml: string;
  slug: string;
  html: string;
  sourcePath: string;
}

const POSTS_DIRECTORY = join(process.cwd(), '_thoughts', 'posts');
const REQUIRED_FIELDS = ['title', 'date', 'description', 'slug'] as const;
const ALLOWED_HTML_TAGS = ['a', 'br', 'code'];
const ALLOWED_NODES = new Set([
  'root',
  'heading',
  'paragraph',
  'text',
  'emphasis',
  'strong',
  'list',
  'listItem',
  'link',
  'blockquote',
  'code',
  'inlineCode',
]);

let postsPromise: Promise<ThoughtPost[]> | undefined;

function fail(sourcePath: string, message: string): never {
  throw new Error(`Thoughts build error in ${sourcePath}: ${message}`);
}

function parseSource(sourcePath: string): { frontmatter: Record<string, unknown>; body: string } {
  const source = readFileSync(sourcePath, 'utf8');
  if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) {
    fail(sourcePath, 'missing front matter; begin file with ---');
  }

  const closingMark = /\r?\n(?:---|\.\.\.)\s*(?:\r?\n|$)/g;
  closingMark.lastIndex = 4;
  const closing = closingMark.exec(source);
  if (!closing) {
    fail(sourcePath, 'malformed front matter; missing closing ---');
  }

  const frontmatterText = source.slice(4, closing.index);
  let frontmatter: unknown;
  try {
    frontmatter = parseYaml(frontmatterText);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(sourcePath, `malformed front matter: ${detail}`);
  }
  if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    fail(sourcePath, 'front matter must be a mapping of fields');
  }

  const body = source.slice(closing.index + closing[0].length);
  if (!body.trim()) {
    fail(sourcePath, 'body must contain non-empty Markdown content');
  }
  return { frontmatter: frontmatter as Record<string, unknown>, body };
}

function requiredString(sourcePath: string, frontmatter: Record<string, unknown>, field: string): string {
  const value = frontmatter[field];
  if (typeof value !== 'string' || !value.trim()) {
    fail(sourcePath, `front matter field "${field}" must be a non-empty string`);
  }
  return value.trim();
}

function validateDate(sourcePath: string, value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(sourcePath, `date "${value}" must use ISO YYYY-MM-DD format`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    fail(sourcePath, `date "${value}" is not a real calendar date`);
  }
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (parsed.getTime() > todayUtc) {
    fail(sourcePath, `date "${value}" cannot be in the future`);
  }
  return value;
}

function validateSlug(sourcePath: string, value: string): string {
  if (!/^[a-z0-9-]+$/.test(value) || value.startsWith('-') || value.endsWith('-')) {
    fail(
      sourcePath,
      `slug "${value}" must contain only lowercase ASCII letters, numbers, and hyphens, without leading or trailing hyphens`,
    );
  }
  return value;
}

function textContent(node: any): string {
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(textContent).join('');
}

function safeLink(url: string): string | undefined {
  const trimmed = url.trim();
  const protocol = trimmed.replace(/[\u0000-\u0020\u007f-\u009f]/g, '');
  if (/^(?:javascript|vbscript|data):/i.test(protocol)) return undefined;
  return trimmed;
}

function sanitizeNode(node: any): any {
  if (node.type === 'html') {
    const tag = node.value.match(/^<\/?([a-z][\w-]*)\b/i)?.[1]?.toLowerCase();
    return tag && ALLOWED_HTML_TAGS.includes(tag)
      ? node
      : { type: 'text', value: node.value };
  }
  if (node.type === 'image' || node.type === 'imageReference') {
    return { type: 'text', value: node.alt ?? '' };
  }
  if (node.type === 'thematicBreak') return { type: 'text', value: '---' };
  if (node.type === 'break') return { type: 'text', value: '\n' };
  if (node.type === 'link') {
    const url = safeLink(node.url ?? '');
    if (!url) return { type: 'text', value: textContent(node) };
    return { ...node, url, children: (node.children ?? []).map(sanitizeNode) };
  }
  if (!ALLOWED_NODES.has(node.type)) return { type: 'text', value: textContent(node) };
  if (node.children) return { ...node, children: node.children.map(sanitizeNode) };
  return node;
}

function plainMarkdownText(value: string): string {
  const tree = unified().use(remarkParse).parse(value);
  return textContent(sanitizeNode(tree)).trim();
}

async function renderInlineMarkdown(sourcePath: string, value: string): Promise<string> {
  const html = await renderMarkdown(sourcePath, value);
  return html.replace(/^<p>([\s\S]*)<\/p>\n?$/, '$1');
}

function preserveCodeMeta() {
  return (tree: any): void => {
    function visit(node: any): void {
      if (node.tagName === 'code' && typeof node.data?.meta === 'string') {
        node.properties = {...node.properties, dataCodeMeta: node.data.meta};
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}

function codeLanguage(properties: Record<string, unknown> | undefined): string {
  const classes = properties?.className;
  const values = Array.isArray(classes) ? classes : [classes];
  const language = values.find((value) => typeof value === 'string' && value.startsWith('language-'));
  return typeof language === 'string' ? language.slice('language-'.length) : 'text';
}

function codeTitle(meta: unknown): string | undefined {
  if (typeof meta !== 'string') return undefined;
  const match = /(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|(\S+))/.exec(meta);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function highlightCodeBlocks() {
  return async (tree: any): Promise<void> => {
    async function visit(node: any): Promise<void> {
      if (!node.children) return;
      for (let index = 0; index < node.children.length; index++) {
        const child = node.children[index];
        const code = child.tagName === 'pre' && child.children?.find((item: any) => item.tagName === 'code');
        if (code) {
          try {
            const highlighted = await codeToHast(textContent(code), {
              lang: codeLanguage(code.properties),
              theme: 'github-dark',
            });
            const title = codeTitle(code.properties?.dataCodeMeta);
            const replacement = title
              ? [{
                  type: 'element',
                  tagName: 'div',
                  properties: {className: ['code-block']},
                  children: [
                    {
                      type: 'element',
                      tagName: 'div',
                      properties: {className: ['code-block-title']},
                      children: [{type: 'text', value: title}],
                    },
                    ...highlighted.children,
                  ],
                }]
              : highlighted.children;
            node.children.splice(index, 1, ...replacement);
            index += replacement.length - 1;
          } catch {
            // Unknown language: preserve safe, unhighlighted code block.
          }
          continue;
        }
        await visit(child);
      }
    }
    await visit(tree);
  };
}

function sanitizeHtmlTree(node: any): any {
  if (node.type === 'root') {
    return { ...node, children: node.children.flatMap(sanitizeHtmlTree) };
  }
  if (node.type !== 'element') return node;

  const children = (node.children ?? []).flatMap(sanitizeHtmlTree);
  if (!ALLOWED_HTML_TAGS.includes(node.tagName)) return { ...node, children };

  const properties: Record<string, unknown> = {};
  if (node.tagName === 'a') {
    const href = typeof node.properties?.href === 'string' ? safeLink(node.properties.href) : undefined;
    if (href) properties.href = href;
    if (node.properties?.className) properties.className = node.properties.className;
    if (node.properties?.dataCursorTarget !== undefined) properties.dataCursorTarget = '';
  }
  if (node.tagName === 'code') {
    if (node.properties?.className) properties.className = node.properties.className;
    if (node.properties?.dataCodeMeta) properties.dataCodeMeta = node.properties.dataCodeMeta;
  }
  return { ...node, children, properties };
}

async function renderMarkdown(sourcePath: string, body: string): Promise<string> {
  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      // rehype-raw drops HAST `data`; retain fenced-code metadata as a property.
      .use(preserveCodeMeta)
      .use(rehypeRaw)
      .use(() => (tree) => sanitizeHtmlTree(tree))
      .use(highlightCodeBlocks)
      .use(() => (tree) => sanitizeHtmlTree(tree))
      .use(rehypeStringify);
    const tree = processor.parse(body);
    const sanitizedTree = sanitizeNode(tree);
    const result = await processor.run(sanitizedTree);
    return String(processor.stringify(result));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(sourcePath, `Markdown parse failure: ${detail}`);
  }
}

async function loadPostsUncached(): Promise<ThoughtPost[]> {
  let names: string[] = [];
  try {
    names = readdirSync(POSTS_DIRECTORY).filter((name) => name.endsWith('.md')).sort();
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const parsed = names.map((name) => {
    const sourcePath = join(POSTS_DIRECTORY, name);
    const { frontmatter, body } = parseSource(sourcePath);
    for (const field of REQUIRED_FIELDS) requiredString(sourcePath, frontmatter, field);
    const titleSource = requiredString(sourcePath, frontmatter, 'title');
    const descriptionSource = requiredString(sourcePath, frontmatter, 'description');
    return {
      sourcePath,
      title: plainMarkdownText(titleSource),
      titleSource,
      date: validateDate(sourcePath, requiredString(sourcePath, frontmatter, 'date')),
      description: plainMarkdownText(descriptionSource),
      descriptionSource,
      slug: validateSlug(sourcePath, requiredString(sourcePath, frontmatter, 'slug')),
      body,
    };
  });

  const bySlug = new Map<string, string>();
  for (const post of parsed) {
    const previous = bySlug.get(post.slug);
    if (previous) fail(post.sourcePath, `duplicate slug "${post.slug}"; already used by ${previous}`);
    bySlug.set(post.slug, post.sourcePath);
  }

  const posts = await Promise.all(
    parsed.map(async (post) => ({
      title: post.title,
      date: post.date,
      description: post.description,
      slug: post.slug,
      titleHtml: await renderInlineMarkdown(post.sourcePath, post.titleSource),
      descriptionHtml: await renderInlineMarkdown(post.sourcePath, post.descriptionSource),
      html: await renderMarkdown(post.sourcePath, post.body),
      sourcePath: post.sourcePath,
    })),
  );
  return posts.sort((left, right) => right.date.localeCompare(left.date) || left.slug.localeCompare(right.slug));
}

export function getPosts(): Promise<ThoughtPost[]> {
  if (import.meta.env.DEV) return loadPostsUncached();
  postsPromise ??= loadPostsUncached();
  return postsPromise;
}
