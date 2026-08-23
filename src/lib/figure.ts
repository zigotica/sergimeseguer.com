import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIGURE_SOURCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*\.(?:svg|png|jpe?g|gif|webp|avif|bmp)$/i;

export type FigureAsset =
  | { type: 'svg'; content: string }
  | { type: 'image'; src: string };

export function figurePath(source: string): string {
  const value = source.trim().replace(/^\/+/, '');
  const path = value;
  const segments = path.split('/');

  if (
    !FIGURE_SOURCE_PATTERN.test(path) ||
    segments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error(`Figure source must be an image file in public: "${source}"`);
  }

  return `/${path}`;
}

export function readFigureAsset(source: string): FigureAsset {
  const path = figurePath(source);
  const filePath = join(process.cwd(), 'public', path.slice(1));
  if (!existsSync(filePath)) throw new Error(`Figure file not found: "${filePath}"`);

  if (!/\.svg$/i.test(path)) return { type: 'image', src: path };

  const svg = readFileSync(filePath, 'utf8');
  const content = svg.replace(/^\uFEFF/, '').replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '').trim();
  if (!/^<svg\b[\s\S]*<\/svg>$/i.test(content)) {
    throw new Error(`Figure file is not a valid SVG: "${filePath}"`);
  }
  return { type: 'svg', content };
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function figureAssetMarkup(source: string, alt = ''): string {
  const asset = readFigureAsset(source);
  return asset.type === 'svg'
    ? asset.content
    : `<img src="${asset.src}" alt="${escapeAttribute(alt)}" />`;
}

export function safeFigurePath(source: unknown): string | undefined {
  if (typeof source !== 'string') return undefined;
  try {
    return figurePath(source);
  } catch {
    return undefined;
  }
}
