// Five warm kitchen lights drain toward the watched scene's opening, using spare Starter slots.
import { segmentedBar } from '@lewismoten/gamemaker-sandbox-tools/kit/ticks';
import { emptyBlock } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';
import type { Level } from './level';
import { G } from './place';

// These Starter props are unused here; the loft already occupies all 150 block slots.
const FRAMES = ['cloudL', 'cloudR', 'bush', 'flower', 'sky', 'ladder'];

/** Reuse unused slots without moving any existing block or changing the doorway's clock. */
export function addExitMeter(pal: Pal, l: Level): void {
  const ticks = l.timed.find((t) => t.name === 'shutTop')!.ticks;
  const bar = segmentedBar({ segments: 5, totalTicks: ticks, round: 'floor' });
  const blocks = l.book.finish();
  for (const name of FRAMES) {
    const n = l.book.n(name);
    if (l.map.map.blocks.includes(n) || l.timed.some((t) => t.name === name || t.next === name)) throw new Error(`Meter slot in use: ${l.file}/${name}`);
  }
  for (const [i, name] of FRAMES.entries()) {
    const n = l.book.n(name);
    Object.assign(blocks[n], emptyBlock(n, false), { grav: 4 });
    const p = new Pixels(20, 20).blit(l.book.pics.get('bg')!, 0, 0);
    // Steel frame and glass lenses, like Nell's scope and the index-card holders.
    p.rect(1, 5, 18, 10, pal.c('steel', 0)).rect(1, 5, 18, 1, pal.c('steel', 3)).rect(2, 6, 16, 8, pal.c('steel', 1));
    for (let j = 0; j < 5; j++) {
      const x = 3 + j * 3;
      p.rect(x, 8, 2, 4, pal.c(j < 5 - i ? 'warm' : 'slate', j < 5 - i ? 2 : 0));
      p.set(x, 8, pal.c(j < 5 - i ? 'warm' : 'steel', j < 5 - i ? 3 : 1));
    }
    // Once open, a bright arrow remains, rather than a timer that starts again.
    if (i === 5) p.line(5, 10, 14, 10, pal.c('glass', 3)).line(11, 7, 14, 10, pal.c('glass', 3)).line(14, 10, 11, 13, pal.c('glass', 3));
    l.book.redraw(name, p);
    if (i < 5) l.timed.push({ name, next: FRAMES[i + 1], ticks: bar[i].duration });
  }
  // Complete copies beside the path, or above the counter when lower rows are full.
  // Preserve every sign, actor's scenery and prop.
  for (let x = 2; x < l.map.width - 1; x++) {
    if (x % 3 !== 2 && l.map.get(x, G - 2) !== l.book.n('shutTop')) continue;
    for (const y of [G - 2, G - 3, G - 5]) {
      if (l.map.get(x, y) === l.book.n('bg')) {
        l.map.set(x, y, FRAMES[0]);
        break;
      }
    }
  }
}
