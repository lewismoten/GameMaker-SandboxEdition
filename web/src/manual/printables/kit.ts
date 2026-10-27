// Shared bits for the paper in the box: sheets of a given size, map pictures, and the
// note that says the addresses are made up.
import { h } from '../../editor/core/ui';
import { mapShot } from '../../gfx/gameShots';
import { frameShot } from '../../gfx/frameShot';
import type { ShotFrame } from '../../gfx/shotFrame';
import { builtHeroPath, heroOf } from '../../gfx/levelPicture';
import type { CatalogEntry } from '../../project/files';
import type { MapPanel, PrintablesFile, Portrait, SpriteArt } from './types';
import { fetchGameFile } from '../../project/files';
import { parseCharacter } from '../../formats/character';
import { BACKBL, BLEN, CHARBL, MONBL, TRANSPARENT, parseBlocks } from '../../formats/blocks';
import { parsePalette } from '../../formats/palette';
import { paintIndexed } from '../../editor/core/draw';
import { bbsName } from '../../retro/bbs/bbsName';
import { sandboxMarkEl } from './sandboxMark';

/** Printed on everything with an address on it. */
export const FICTIONAL_NOTE =
  'Fictional address. This is a 1990s-style shareware manual recreated today. Nothing to mail: registration is free and everything is in the box.';

export const BBS_PHONE = '1-412-555-SAND';

export interface PrintContext {
  entry: CatalogEntry;
  /** Every Sandbox Software game in the catalog. */
  family: CatalogEntry[];
  printables: PrintablesFile;
  /** The manual's pages (head + html), for key descriptions and the hint offer. */
  manual: { title: string; pages: { head: string; html: string }[] };
  /** A map window as a PNG data URL (cached); with `frame`, that moment of play when the site has it (gfx/shotFrame.ts). */
  shot(panel: Pick<MapPanel, 'map' | 'x' | 'y' | 'w' | 'h'> & { frame?: ShotFrame }): Promise<string | undefined>;
}

export function shotCache(entry: CatalogEntry): PrintContext['shot'] {
  const cache = new Map<string, Promise<string | undefined>>();
  return (p) => {
    const key = `${p.map}:${p.x}:${p.y}:${p.w}:${p.h}:${p.frame ? JSON.stringify(p.frame) : ''}`;
    let hit = cache.get(key);
    if (!hit) {
      const frame = p.frame;
      hit = (async () => (frame && (await frameShot(entry, { map: p.map, ...frame }))) || mapShot(entry, p.map, p.x, p.y, p.w, p.h))()
        .then((c) => c?.toDataURL())
        .catch(() => undefined);
      cache.set(key, hit);
    }
    return hit;
  };
}

/** One printed piece: w x h inches. Inside it, size things in cqw (1cqw = 1% of its width). */
export interface Sheet {
  el: HTMLElement;
  w: number;
  h: number;
}

export function sheet(w: number, h_: number, cls: string, ...children: (Node | string | null | undefined | false)[]): Sheet {
  // the outer box is the size container, so the sheet's own font sizes in cqw work too
  const el = h(
    'div',
    { class: 'pp-paper', style: `aspect-ratio: ${w} / ${h_}` },
    // a section, so a printed piece's own <header> is its letterhead, not the page's banner landmark
    h(
      'section',
      {
        class: `pp-sheet ${cls
          .split(/\s+/)
          .filter(Boolean)
          .map((c) => `pp-${c}`)
          .join(' ')}`,
      },
      ...children,
    ),
  );
  el.dataset.w = String(w);
  el.dataset.h = String(h_);
  return { el, w, h: h_ };
}

/** Simple HTML from our own JSON files. */
export function html(tag: keyof HTMLElementTagNameMap, cls: string, markup: string): HTMLElement {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  el.innerHTML = markup;
  return el;
}

/** A picture of a map window, screened like a magazine photo. */
export async function mapPicture(ctx: PrintContext, p: MapPanel, cls = ''): Promise<HTMLElement> {
  const src = await ctx.shot(p);
  const fig = h('figure', { class: `pp-photo ${cls}` });
  if (src) fig.append(h('span', { class: 'pp-shot' }, h('img', { src, alt: p.caption ?? 'Picture', width: p.w * 20, height: p.h * 20 })));
  else fig.append(h('div', { class: 'pp-photo-missing', style: `aspect-ratio: ${p.w} / ${p.h}` }));
  if (p.caption) fig.append(h('figcaption', null, p.caption));
  return fig;
}

/** The publisher's little logo: its mark (sandboxMark.ts) and the name. */
export function sandboxLogo(cls = ''): HTMLElement {
  const mark = sandboxMarkEl('pp-logo-mark');
  mark.setAttribute('aria-hidden', 'true');
  return h('div', { class: `pp-logo ${cls}` }, mark, h('span', null, 'SANDBOX', h('br'), 'SOFTWARE'));
}

/** THE -= S A N D B O X =- BBS in its colors, as everywhere (retro/bbs/bbsName.ts). */
export function sandboxBanner(): HTMLElement {
  const el = bbsName();
  el.classList.add('pp-sandbox-banner');
  return el;
}

export function fictionalNote(): HTMLElement {
  return h('p', { class: 'pp-fictional' }, `(${FICTIONAL_NOTE})`);
}

export { splitTitle } from '../../project/gameTitle';

async function fetchFile(entry: CatalogEntry, name: string): Promise<Uint8Array | undefined> {
  return fetchGameFile(entry, name); // fetched once, shared
}

/** The hero as he stands in his first character sequence: top and bottom block, 20 x 40. */
export async function portrait(entry: CatalogEntry, p: Portrait): Promise<string | undefined> {
  // the hero the build drew (the disk label's and the manual cover's): a small picture instead of three game files
  const drawn = entry.heroShot ? heroOf(entry.original) : undefined;
  if (drawn && drawn.chr === p.chr && drawn.cbl === p.cbl && drawn.pal === p.pal && (drawn.seq ?? 0) === (p.seq ?? 0)) return `./${builtHeroPath(entry.id)}`;
  const [chrB, cblB, palB] = await Promise.all([p.chr, p.cbl, p.pal].map((f) => fetchFile(entry, f)));
  if (!chrB || !cblB || !palB) return undefined;
  try {
    const chr = parseCharacter(chrB);
    const blocks = parseBlocks(cblB, CHARBL);
    const frame = chr.sequences[p.seq ?? 0].frames[0];
    const px = new Uint8Array(BLEN * BLEN * 2).fill(TRANSPARENT);
    for (const [pic, y0] of [
      [frame.pic1, 0],
      [frame.pic2, BLEN],
    ] as const)
      if (blocks[pic]) px.set(blocks[pic].pixels, y0 * BLEN);
    const c = document.createElement('canvas');
    paintIndexed(c, px, BLEN, BLEN * 2, parsePalette(palB), true);
    return c.toDataURL();
  } catch {
    return undefined;
  }
}

/** Marks every pixel whose color shows along the picture's edge as ground. */
function edgeGround(px: Uint8Array, ground: Int16Array, w: number, h: number): void {
  const ring = new Set<number>();
  for (let x = 0; x < w; x++) ring.add(px[x]).add(px[(h - 1) * w + x]);
  for (let y = 0; y < h; y++) ring.add(px[y * w]).add(px[y * w + w - 1]);
  for (let i = 0; i < px.length; i++) if (ring.has(px[i])) ground[i] = px[i];
}

/** Clears the ground round a thing drawn on it: pixels that match the plain ground, reached from the edge. */
function cutAway(px: Uint8Array, ground: Int16Array, w: number, h: number): void {
  const seen = new Uint8Array(px.length);
  const stack: number[] = [];
  const push = (i: number) => {
    if (seen[i]) return;
    seen[i] = 1;
    if (px[i] === TRANSPARENT || px[i] === ground[i]) stack.push(i);
  };
  for (let x = 0; x < w; x++) (push(x), push((h - 1) * w + x));
  for (let y = 0; y < h; y++) (push(y * w), push(y * w + w - 1));
  while (stack.length) {
    const i = stack.pop()!;
    px[i] = TRANSPARENT;
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < px.length - w) push(i + w);
  }
}

/** Blocks from one of the game's block files, laid out in a grid, as a PNG data URL (transparent background). */
export async function spriteArt(entry: CatalogEntry, s: SpriteArt): Promise<string | undefined> {
  const [blB, palB] = await Promise.all([s.blocks, s.pal].map((f) => fetchFile(entry, f)));
  if (!blB || !palB) return undefined;
  try {
    const ext = s.blocks.toLowerCase().slice(-3);
    const blocks = parseBlocks(blB, ext === 'cbl' ? CHARBL : ext === 'bbl' ? BACKBL : MONBL);
    const cols = Math.max(1, ...s.grid.map((r) => r.length));
    const rows = s.grid.length;
    const grid = s.flip ? s.grid.map((r) => [...r, ...Array<number>(cols - r.length).fill(-1)].reverse()) : s.grid;
    const px = new Uint8Array(cols * BLEN * rows * BLEN).fill(TRANSPARENT);
    const W = cols * BLEN;
    const ground = new Int16Array(px.length).fill(-1);
    grid.forEach((row, gy) =>
      row.forEach((n, gx) => {
        const b = n >= 0 ? blocks[n] : undefined;
        if (!b) return;
        const u = typeof s.under === 'number' ? s.under : Array.isArray(s.under) ? s.under[gy]?.[s.flip ? row.length - 1 - gx : gx] : undefined;
        const under = u !== undefined && u >= 0 ? blocks[u] : undefined;
        for (let y = 0; y < BLEN; y++)
          for (let x = 0; x < BLEN; x++) {
            const at = (gy * BLEN + y) * W + gx * BLEN + (s.flip ? BLEN - 1 - x : x);
            px[at] = b.pixels[y * BLEN + x];
            if (under) ground[at] = under.pixels[y * BLEN + x];
          }
      }),
    );
    if (s.under === 'edge') edgeGround(px, ground, W, rows * BLEN);
    if (s.under !== undefined) cutAway(px, ground, W, rows * BLEN);
    const c = document.createElement('canvas');
    paintIndexed(c, px, W, rows * BLEN, parsePalette(palB), true);
    return c.toDataURL();
  } catch {
    return undefined;
  }
}
