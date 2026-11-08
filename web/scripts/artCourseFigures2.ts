// Draws the figures of art course 2 ("Shadows and depth") into src/artCourses/figures/: real indexed 20x20 blocks
// (a shadow is the same ground one step down its color ramp), built from a small set of blocks and counted.
// Run from web/: npx vite-node scripts/artCourseFigures2.ts
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { C, GRASS, hash, save, strip, wall } from './artCourseKit';

const grass = (): Pixels =>
  new Pixels(20, 20).map((x, y) => {
    const v = hash(x, y, 9);
    return GRASS[v < 0.1 ? 1 : v < 0.82 ? 2 : 3];
  });
const sky = (): Pixels => new Pixels(20, 20, C.sky);

/** Two steps down the grass ramp: the shadow color of a ground pixel. */
const dark = (c: number): number => {
  const i = GRASS.indexOf(c);
  return i < 0 ? c : GRASS[Math.max(0, i - 2)];
};
type Mode = 'solid' | 'dither';
/** Shades the pixels of `g` where `inside(x, y)` is true, solid or as a checkerboard. */
function shade(g: Pixels, inside: (x: number, y: number) => boolean, mode: Mode = 'solid'): Pixels {
  return g.map((x, y) => {
    if (!inside(x, y)) return g.get(x, y);
    return mode === 'solid' || (x + y) % 2 === 0 ? dark(g.get(x, y)) : g.get(x, y);
  });
}

/** Lays blocks out on a grid and counts how many different blocks that takes. */
function scene(rows: Pixels[][]): { img: Pixels; blocks: number } {
  const img = new Pixels(rows[0].length * 20, rows.length * 20);
  const seen = new Set<string>();
  rows.forEach((r, y) =>
    r.forEach((b, x) => {
      img.blit(b, x * 20, y * 20);
      seen.add(Array.from(b.px).join(','));
    }),
  );
  return { img, blocks: seen.size };
}

// Light comes from the upper left, so every shadow slides to the right (and down).
const BAND = 7;
const shadeBlock = (kind: 'full' | 'capR', mode: Mode = 'solid', depth = BAND): Pixels =>
  shade(grass(), (x, y) => y < depth && (kind === 'full' || x < 6), mode);

const deck = (leg: boolean): Pixels => {
  const p = sky();
  p.rect(0, 3, 20, 1, C.w3).rect(2, 4, 2, 5, C.w1).rect(12, 4, 2, 5, C.w1);
  p.rect(0, 9, 20, 1, C.w3).rect(0, 10, 20, 5, C.w2).rect(0, 15, 20, 1, C.w0).rect(0, 12, 20, 1, C.w1);
  if (leg) p.rect(8, 16, 4, 4, C.w1).rect(8, 16, 1, 4, C.w2).rect(11, 16, 1, 4, C.w0);
  return p;
};

function figBridge(): void {
  const flat = Array.from({ length: 8 }, sky);
  const deckRow = [sky(), deck(true), deck(false), deck(false), deck(false), deck(false), deck(true), sky()];
  const g = grass();
  const bare = scene([flat, deckRow, Array(8).fill(g)]);
  const f = shadeBlock('full');
  const shaded = scene([flat, deckRow, [g, f, f, f, f, f, shadeBlock('capR'), g]]);
  save('shadow-bridge', strip([bare.img, shaded.img], 8), 3);
  console.log('bridge blocks: without', bare.blocks, 'with', shaded.blocks);
}

function figSolidDither(): void {
  const row = (mk: () => Pixels): Pixels => scene([Array.from({ length: 5 }, mk)]).img;
  const solid = row(() => shadeBlock('full', 'solid'));
  const dith = row(() => shadeBlock('full', 'dither'));
  // A solid core with a two-pixel dithered fringe along its lower edge.
  const soft = row(() =>
    shade(
      shade(grass(), (_x, y) => y < 5),
      (_x, y) => y >= 5 && y < 7,
      'dither',
    ),
  );
  const out = new Pixels(100, 20 * 3 + 8, C.bg);
  [solid, dith, soft].forEach((r, i) => out.blit(r, 0, i * 24));
  save('shadow-solid-dither', out, 4);
}

function figEdgeSet(): void {
  const g = grass();
  const band = shadeBlock('full', 'solid', 5);
  const cap = shadeBlock('capR', 'solid', 5);
  save('shadow-edge-set', strip([g, band, cap], 6), 6);
  const w = wall(0, 0, 20, 20, 3, false);
  const top = sky().rect(0, 8, 20, 2, C.r2).rect(0, 10, 20, 8, C.r1).rect(0, 18, 20, 2, C.r0);
  const above = [
    [sky(), top, top, top, top, top, sky()],
    [sky(), w, w, w, w, w, sky()],
  ];
  const bare = scene([...above, Array(7).fill(g)]);
  const made = scene([...above, [g, band, band, band, band, band, cap]]);
  save('shadow-wall', strip([bare.img, made.img], 8), 3);
  console.log('wall blocks: without', bare.blocks, 'with', made.blocks);
}

function figDirection(): void {
  const house = (p: Pixels, x: number): void => {
    p.rect(x - 3, 8, 46, 6, C.r1)
      .rect(x - 3, 8, 46, 1, C.r2)
      .rect(x, 14, 40, 26, C.w2)
      .rect(x, 14, 40, 2, C.w1);
    p.rect(x + 16, 24, 8, 16, C.w0)
      .rect(x + 5, 22, 7, 6, C.sky)
      .rect(x + 28, 22, 7, 6, C.sky);
  };
  const field = (secondShadowX: number): Pixels => {
    const p = new Pixels(140, 60, C.sky);
    p.rect(0, 40, 140, 20, GRASS[2]);
    p.map((x, y) => (y >= 40 && hash(x, y, 4) < 0.15 ? GRASS[1] : p.get(x, y)));
    p.rect(50, 40, 14, 7, GRASS[0]).rect(secondShadowX, 40, 14, 7, GRASS[0]);
    house(p, 10);
    house(p, 80);
    p.rect(2, 2, 6, 6, C.yel).rect(3, 1, 4, 8, C.yel).rect(1, 3, 8, 4, C.yel);
    return p;
  };
  save('shadow-direction', strip([field(120), field(66)], 8), 3);
}

function figCost(): void {
  const roof = sky().rect(0, 6, 20, 2, C.r2).rect(0, 8, 20, 10, C.r1).rect(0, 18, 20, 2, C.r0);
  const w = wall(0, 0, 20, 20, 12, false);
  const door = wall(0, 0, 20, 20, 12, false).rect(5, 5, 10, 15, C.w0).rect(6, 6, 8, 14, C.w1).set(12, 13, C.yel);
  const g = grass();
  const top = [sky(), roof, roof, roof, roof, roof, sky()];
  const mid = [sky(), w, w, door, w, w, sky()];
  const lit = scene([top, mid, Array(7).fill(g)]);
  const band = shadeBlock('full', 'solid', 5);
  const shaded = scene([top, mid, [g, band, band, band, band, band, shadeBlock('capR', 'solid', 5)]]);
  save('shadow-cost', strip([lit.img, shaded.img], 8), 3);
  console.log('cost blocks: without', lit.blocks, 'with', shaded.blocks);
}

figBridge();
figSolidDither();
figEdgeSet();
figDirection();
figCost();
