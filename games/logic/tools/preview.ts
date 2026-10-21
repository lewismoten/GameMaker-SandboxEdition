// Design aid (not part of the disk): writes PNG sheets of the blocks of every room to the
// folder named by PREVIEW_DIR, 3x size.
//   PREVIEW_DIR=/tmp/x npx vite-node ../games/logic/tools/preview.ts
import { join } from 'node:path';
import { Pixels } from '../../kit/pixels';
import { writePng } from '../../kit/png';
import { PAL } from '../src/art/pal';
import { STYLES, buildTiles } from '../src/blocks/tiles';
import type { BlockSet } from '../src/blocks/sets';

const dir = process.env.PREVIEW_DIR ?? '.';

export function sheet(bs: BlockSet, cols = 16): Pixels {
  const n = bs.names.length;
  const p = new Pixels(cols * 21, Math.ceil(n / cols) * 21, 0);
  bs.pics.forEach((px, i) => p.blit(px, (i % cols) * 21, Math.floor(i / cols) * 21));
  return p;
}

if (process.env.PREVIEW_DIR) {
  for (const st of Object.values(STYLES)) writePng(join(dir, `tiles-${st.id}.png`), sheet(buildTiles(st)), PAL.pal, 3);
  console.log('written to', dir);
}

if (process.env.PREVIEW_DIR) {
  const { buildMonsterBlocks, buildWattBlocks } = await import('../src/sprites/sprites');
  writePng(join(dir, 'mbl.png'), sheet(buildMonsterBlocks(), 10), PAL.pal, 4);
  writePng(join(dir, 'cbl.png'), sheet(buildWattBlocks(), 11), PAL.pal, 4);
}

if (process.env.PREVIEW_DIR) {
  const { BOARDS } = await import('../src/levels/boards');
  const { compileHouse } = await import('../src/levels/board');
  const { renderBoard } = await import('../src/art/render');
  const { buildMonsterBlocks, buildWattBlocks } = await import('../src/sprites/sprites');
  const S = await import('../src/screens/screens');
  const mb = buildMonsterBlocks();
  const cb = buildWattBlocks();
  const art = { watt: cb, parts: mb };
  for (const room of compileHouse(BOARDS, mb))
    for (const b of room.boards) {
      if (process.env.BOARD && process.env.BOARD !== b.spec.file) continue;
      writePng(join(dir, `board-${b.spec.file}.png`), renderBoard(b, room.tiles, mb, cb.pic('down0')), PAL.pal, 2);
      if (process.env.SCREENS && b.spec.file === 'coffee')
        writePng(join(dir, 'screen-card.png'), S.cardScreen(b, 3, BOARDS.length, room.tiles, art), PAL.pal, 2);
    }
  if (process.env.SCREENS)
    for (const [name, p] of [
      ['title', S.titleScreen(art)],
      ['menu', S.menuScreen(art)],
      ['page', S.pageScreen(art, 'THE STORY', 51)],
      ['scores', S.scoresScreen(art)],
      ['slots', S.slotsScreen(art)],
    ] as [string, Pixels][])
      writePng(join(dir, `screen-${name}.png`), p, PAL.pal, 2);
}
