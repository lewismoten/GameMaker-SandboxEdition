// The Sandbox Software regulars tucked into the render (games/kit/TIN-HEARTS.md): the tin heart
// in a corner of the Glass Garden's pond room, a painted Easter egg in its first room, and
// Watt from Ohm Sweet Ohm beside THE CHEZ in Teapot Temple, keeping an eye on its charge port.
// Each is a floor cell, ray traced like any other, with the kit's pixel art laid over it in the
// level's own colors (nearest match; the palette is picked without them, so no other block
// changes). Each keeps a block number of its own, high in the set, so no other number moves.
import { Pixels } from '../../../kit/pixels';
import { drawTinHeart } from '../../../kit/tinHeart';
import { drawEasterEgg } from '../../../kit/easterEgg';
import { wattCameo } from '../../../kit/cameos';
import type { Block } from '../../../../web/src/formats/blocks';
import type { Matcher } from '../render/quant';
import type { TileBook } from '../tiles/book';
import type { Plane } from '../tiles/cells';

/** The block numbers they keep (in every level's sets; only levels that use one fill it). */
export const HIDDEN: Record<string, number> = { tinHeart: 140, tinHeart2: 143, easterEgg: 141, watt: 142 };

export function pinHidden(book: TileBook): void {
  for (const [kind, n] of Object.entries(HIDDEN)) book.pin(kind, n);
}

/** Is block `n` one of them (left out when the level's colors are picked)? */
export const isHidden = (book: TileBook, n: number): boolean => !!book.keys[n] && book.keys[n].kind in HIDDEN;

/** Lays the art over their rendered floors, in both planes. */
export function overlayHidden(book: TileBook, blocks: Record<Plane, Block[]>, pal: Uint8Array, m: Matcher): void {
  const at = (r: number, g: number, b: number) => m.nearest(r, g, b);
  for (const [kind, n] of Object.entries(HIDDEN)) {
    if (book.keys[n]?.kind !== kind) continue;
    for (const p of ['near', 'far'] as Plane[]) {
      const blk = blocks[p][n];
      const px = new Pixels(20, 20);
      px.px.set(blk.pixels);
      // the heart and its shine (a glint crossing it now and then)
      if (kind.startsWith('tinHeart')) drawTinHeart(px, { ink: at(14, 14, 22), tin: [at(96, 102, 116), at(150, 156, 170), at(208, 212, 222)], white: at(252, 252, 250), dark: at(48, 50, 60) }, kind === 'tinHeart' ? 0 : 2);
      if (kind === 'easterEgg') drawEasterEgg(px, { ink: at(14, 14, 22), shell: [at(170, 40, 120), at(220, 90, 170), at(250, 160, 210)], paint: [at(40, 120, 220), at(110, 190, 255)], accent: at(255, 220, 90), white: at(252, 252, 250) }, 'bands', 0);
      if (kind === 'watt') px.blit(wattCameo(pal, 'down', 0, 'ok', { use: m.allowed }), 0, 0, 255);
      blk.pixels = Uint8Array.from(px.px);
    }
  }
}
