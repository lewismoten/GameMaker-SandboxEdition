// The save sign (kit/saveSign.ts) at the top of Jamie Street, the level after Gale Street and the
// pines behind it. SNOW.BBL is full, so Jamie Street gets its own copy, JAMIE.BBL, with four blocks
// it never shows given to the sign: none on its map, none a block there turns into, and never a
// pickup (the inventory draws what the kid carries from the scene's set).
import { emptyBlock, type Block } from '../../../../web/src/formats/blocks';
import { MLEN, type GameMap } from '../../../../web/src/formats/map';
import { Pixels } from '../../../kit/pixels';
import { saveSignBlocks } from '../../../kit/saveSign';

/** A copy of `bbl` with the sign in it, and the sign put on `map` (board at x, y; posts below). */
export function withSaveSign(bbl: Block[], map: GameMap, pal: Uint8Array, x: number, y: number): Block[] {
  const shown = new Set(map.blocks);
  for (let grew = true; grew;) {
    grew = false;
    for (const n of [...shown]) for (const m of [bbl[n].nextBl, bbl[n].touchBl]) if (m < bbl.length && !shown.has(m)) (shown.add(m), (grew = true));
  }
  const carried = new Set(bbl.flatMap((b, n) => (b.obj ? [n, b.nextBl, b.touchBl] : [])));
  const free = bbl.map((_, n) => n).filter((n) => n > 0 && !shown.has(n) && !carried.has(n));
  if (free.length < 4) throw new Error('Jamie Street has no room for the save sign');
  const [bl, br, pl, pr] = free.slice(-4);
  const at = (dx: number, dy: number) => (y + dy) * MLEN + x + dx;
  const pic = (dx: number, dy: number) => {
    const p = new Pixels(20, 20);
    p.px.set(bbl[map.blocks[at(dx, dy)]].pixels);
    return p;
  };
  const sign = saveSignBlocks(pal, { board: [pic(0, 0), pic(1, 0)], posts: [pic(0, 1), pic(1, 1)] });
  const out = bbl.map((b) => ({ ...b, pixels: Uint8Array.from(b.pixels), xtra: Uint8Array.from(b.xtra) }));
  const put = (n: number, p: Pixels, dx: number, dy: number) => {
    out[n] = { ...emptyBlock(n), pixels: Uint8Array.from(p.px) };
    map.blocks[at(dx, dy)] = n;
  };
  put(bl, sign.board[0], 0, 0);
  put(br, sign.board[1], 1, 0);
  put(pl, sign.posts![0], 0, 1);
  put(pr, sign.posts![1], 1, 1);
  return out;
}
