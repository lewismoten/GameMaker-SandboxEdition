// The diploma's paper falls in front of the balcony, using its existing confetti art with a clear background.
// Other halls keep the ordinary Starter monsters; no engine or shared Starter behavior changes.
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from './book';
import { buildMonsterBlocks, buildMonsters } from './monsters';
import { skyOf, type Pal } from './palette';

export const CONFETTI = [3, 4] as const;

export function graduationMonsters(pal: Pal, hall: Book) {
  const monsterBlocks = buildMonsterBlocks(pal);
  const monsters = buildMonsters(monsterBlocks);
  if (hall.has('confetti.0.0')) {
    for (const [i, id] of CONFETTI.entries()) {
      const pic = hall.pics.get(`confetti.${i}.0`)!.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));
      const n = monsterBlocks.add(`confetti.${i}`, pic);
      // Down four rows slowly, then reset to the top in one tick. Both paths stay within the view.
      monsters[id] = mon([[n, 1]], { power: 255, end: -2, thru: 0 }, [corner(0, 0, 1), corner(0, 4, 1 + i), corner(0, 0, 80)]);
    }
  }
  return { monsterBlocks, monsters };
}
