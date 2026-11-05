// The tip of the hat: a small plaque that says cOoL, the word GM.EXE hands its tools on their
// command line (code/GM/GMGEN.H:24). Two blocks wide (40x20), a slate board with a wood edge
// and chalk letters, hung where a scene starts. No game explains it. The letters keep that
// exact case (the 8x8 font has lowercase), so it is drawn with pcText, not the all-caps micro font.
//
// Drawn in fixed colors and put into a game's palette by nearest color (as saveSign.ts does).
// putCoolSign works on a copy of the scene's block set, in blocks the map never shows, and
// refuses to cover a block the player could stand on, touch or pick up.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

export const COOL_WORD = 'cOoL';

const RGB = { slate: [38, 66, 78], edge: [154, 106, 58], edgeDark: [106, 68, 34], chalk: [240, 236, 218], nail: [200, 204, 212] } as const;
type Ink = keyof typeof RGB;

function nearest(pal: Uint8Array, rgb: readonly number[], use: number[]): number {
  let best = use[0];
  let bd = Infinity;
  for (const j of use) {
    const d = 3 * (rgb[0] - pal[j * 3] * 4.05) ** 2 + 4 * (rgb[1] - pal[j * 3 + 1] * 4.05) ** 2 + 2 * (rgb[2] - pal[j * 3 + 2] * 4.05) ** 2;
    if (d < bd) ((bd = d), (best = j));
  }
  return best;
}

/** The plaque's two blocks over `under` (what lies behind each), in `pal` (768 bytes, 6-bit). */
export function coolSignBlocks(pal: Uint8Array, under: [Pixels, Pixels], use: number[] = Array.from({ length: 255 }, (_, i) => i)): [Pixels, Pixels] {
  const ink = (k: Ink) => nearest(pal, RGB[k], use);
  const sign = new Pixels(40, 20, 255);
  sign.rect(2, 4, 36, 12, ink('edgeDark'));
  sign.rect(2, 4, 36, 11, ink('edge'));
  sign.rect(4, 6, 32, 8, ink('slate'));
  sign.set(3, 5, ink('nail')).set(36, 5, ink('nail')).set(3, 14, ink('nail')).set(36, 14, ink('nail'));
  text(sign, 4, 6, COOL_WORD, ink('chalk'), 1, true);
  const half = (bg: Pixels, left: number) => {
    const p = new Pixels(20, 20);
    p.blit(bg, 0, 0);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const c = sign.get(left + x, y);
        if (c !== 255) p.set(x, y, c);
      }
    return p;
  };
  return [half(under[0], 0), half(under[1], 20)];
}

/**
 * A copy of `bbl` with the plaque in two blocks `map` never shows, put on `map` at (x, y) (its
 * left block). Throws if the cells are not plain background.
 */
export function putCoolSign(bbl: Block[], map: GameMap, pal: Uint8Array, x: number, y: number, use?: number[]): Block[] {
  const at = (dx: number) => y * MLEN + x + dx;
  for (const dx of [0, 1]) {
    const b = bbl[map.blocks[at(dx)]];
    if (b.solid || b.obj || b.chHitPt || b.effect || b.scorePts || b.birthTime || b.touchBl !== map.blocks[at(dx)] || b.nextBl !== map.blocks[at(dx)])
      throw new Error(`The cOoL plaque would cover a block that does something at ${x + dx},${y}`);
  }
  const shown = new Set(map.blocks);
  for (let grew = true; grew;) {
    grew = false;
    for (const n of [...shown]) for (const m of [bbl[n].nextBl, bbl[n].touchBl]) if (m < bbl.length && !shown.has(m)) (shown.add(m), (grew = true));
  }
  const carried = new Set(bbl.flatMap((b, n) => (b.obj ? [n, b.nextBl, b.touchBl] : [])));
  const free = bbl.map((_, n) => n).filter((n) => n > 0 && !shown.has(n) && !carried.has(n));
  if (free.length < 2) throw new Error('No room in the block set for the cOoL plaque');
  const nums = free.slice(-2);
  const pic = (dx: number) => {
    const p = new Pixels(20, 20);
    p.px.set(bbl[map.blocks[at(dx)]].pixels);
    return p;
  };
  const halves = coolSignBlocks(pal, [pic(0), pic(1)], use);
  const out: Block[] = bbl.map((b) => ({ ...b, pixels: Uint8Array.from(b.pixels), xtra: Uint8Array.from(b.xtra) }));
  halves.forEach((p, k) => {
    // keeps its gravity bits: the editor's checks read which blocks a set has with gravity
    out[nums[k]] = { ...emptyBlock(nums[k]), grav: bbl[nums[k]].grav, pixels: Uint8Array.from(p.px) };
    map.blocks[at(k)] = nums[k];
  });
  return out;
}
