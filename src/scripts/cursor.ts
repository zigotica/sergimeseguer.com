const INITIALIZED_KEY = '__siteCursorInitialized';

type CursorDocument = Document & {
  [INITIALIZED_KEY]?: boolean;
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function randomShape(n: number): number[][] {
  const cx = 24;
  const cy = 24;
  const r = 20;
  const points: number[][] = [];

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const jitter = 0.55 + Math.random() * 0.45;
    points.push([
      cx + Math.cos(angle) * r * jitter,
      cy + Math.sin(angle) * r * jitter,
    ]);
  }

  return points;
}

function resample(poly: number[][], n: number): number[][] {
  const lengths = poly.map((point, index) => {
    const next = poly[(index + 1) % poly.length];
    return Math.hypot(next[0] - point[0], next[1] - point[1]);
  });
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const step = total / n;
  const points: number[][] = [];

  for (let i = 0; i < n; i++) {
    let distance = i * step;
    let segment = 0;
    let segmentT = 0;

    for (let j = 0; j < poly.length; j++) {
      if (distance <= lengths[j] + 1e-9) {
        segment = j;
        segmentT = distance / (lengths[j] || 1);
        break;
      }
      distance -= lengths[j];
    }

    const start = poly[segment];
    const end = poly[(segment + 1) % poly.length];
    points.push([
      lerp(start[0], end[0], segmentT),
      lerp(start[1], end[1], segmentT),
    ]);
  }

  return points;
}

function getInteractiveElement(target: EventTarget | null): Element | null {
  return target instanceof Element
    ? target.closest('a, button, [role="button"]')
    : null;
}

export function initCursor(): void {
  const documentWithState = document as CursorDocument;
  if (documentWithState[INITIALIZED_KEY]) return;

  const cursor = document.querySelector<HTMLElement>('[data-cursor]');
  if (!cursor) return;

  documentWithState[INITIALIZED_KEY] = true;

  const ring = cursor.querySelector<HTMLElement>('[data-cursor-ring]');
  const poly = cursor.querySelector<SVGPolygonElement>('[data-cursor-polygon]');
  const hairlineX = cursor.querySelector<HTMLElement>('[data-cursor-hairline-x]');
  const hairlineY = cursor.querySelector<HTMLElement>('[data-cursor-hairline-y]');
  if (!ring || !poly || !hairlineX || !hairlineY) return;

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isFirefox = /Firefox/i.test(navigator.userAgent);
  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (isTouchDevice || !isFirefox || prefersReducedMotion) {
    ring.style.display = 'none';
    poly.style.display = 'none';
    hairlineX.style.display = 'none';
    hairlineY.style.display = 'none';
    return;
  }

  const ffCursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'6\' height=\'6\' viewBox=\'0 0 6 6\'%3E%3Crect width=\'6\' height=\'6\' fill=\'%23c9826b\'/%3E%3C/svg%3E") 3 3, auto';
  document.body.style.cursor = ffCursor;

  const interactiveCursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 6 6\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23c9826b\'/%3E%3C/svg%3E") 3 3, auto';
  document.querySelectorAll('a, button, [role="button"]').forEach((element) => {
    (element as HTMLElement).style.cursor = interactiveCursor;
  });

  let mx = 0;
  let my = 0;
  let rx = 0;
  let ry = 0;
  let morphT = 0;

  const MAX_PTS = 9;
  let fromShape = resample(randomShape(8), MAX_PTS);
  let toShape = resample(randomShape(5), MAX_PTS);

  document.addEventListener('mousemove', (event) => {
    mx = event.clientX;
    my = event.clientY;
    hairlineX.style.setProperty('--cursor-y', `${my}px`);
    hairlineY.style.setProperty('--cursor-x', `${mx}px`);
  });

  function animRing(): void {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.setProperty('--cursor-x', `${rx}px`);
    ring.style.setProperty('--cursor-y', `${ry}px`);

    morphT += 0.007;
    if (morphT >= 1) {
      morphT = 0;
      fromShape = toShape;
      const nextN = 3 + Math.floor(Math.random() * 7);
      toShape = resample(randomShape(nextN), MAX_PTS);
    }

    const et = easeInOut(morphT);
    const points = fromShape.map(
      (point, index) =>
        `${lerp(point[0], toShape[index][0], et).toFixed(2)},${lerp(point[1], toShape[index][1], et).toFixed(2)}`,
    );
    poly.setAttribute('points', points.join(' '));
    requestAnimationFrame(animRing);
  }

  document.addEventListener('pointerover', (event) => {
    const current = getInteractiveElement(event.target);
    const previous = getInteractiveElement(event.relatedTarget);
    if (current && current !== previous) ring.classList.add('is-hovering');
  });

  document.addEventListener('pointerout', (event) => {
    const current = getInteractiveElement(event.target);
    const next = getInteractiveElement(event.relatedTarget);
    if (current && current !== next) ring.classList.remove('is-hovering');
  });

  const heroTarget = document.querySelector<HTMLElement>('[data-cursor-target]');
  if (heroTarget) {
    heroTarget.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-targeting');
    });
    heroTarget.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-targeting');
    });
  }

  animRing();
}
