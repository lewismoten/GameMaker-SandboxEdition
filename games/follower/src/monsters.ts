// FOLLOW ME's monster. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   PUFF  a small cream pup with a floppy ear and little white wings. It is not solid and hurts nobody.
//         Its Movement is "toward the hero" (`towards`), so every tick it moves a little in a
//         straight line to where Lena is. It is slower than Lena, so it falls behind when he runs.
// What the engine does (code/GM/PLAYGAME.C ~line 3035): a monster whose `towards` is 1 to 63 aims at
// the hero's position every tick and moves that many steps (negative runs away). With `thru` set it
// is stopped by a solid block in its way, on that one side only, and slides on along the other.
// It plans no route: a wall between it and Lena just stops it.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** The monster number this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const PUFF = 3;
/** Powers: 100 or more cannot be popped by touching Lena. */
export const POWER = 110;
/** Hit points Lena starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** How fast Puff flies toward Lena (the Movement setting; Lena walks faster than this). */
export const PUFF_SPEED = 2;

const T = 255;

/** Puff: cream body, a brown floppy ear, a pink tongue, and white wings up or down. Facing right. */
function puff(pal: Pal, wingsUp: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  // wings: two white feathers on the back, up or down
  const wing = (x: number, y: number, up: boolean) => {
    blob(p, x, y, 2.4, up ? 4.6 : 3.2, r('white'), 1, 3);
    if (up) p.line(x - 1, y - 3, x + 1, y + 3, c('blue', 3));
  };
  wing(5, wingsUp ? 5 : 9, wingsUp);
  wing(9, wingsUp ? 4 : 9, wingsUp);
  blob(p, 8, 14.5, 5.6, 3.4, r('parch'), 1, 4); // body
  p.rect(4, 17, 2, 2, c('ink', 1)).rect(9, 17, 2, 2, c('ink', 1)); // back paws
  blob(p, 13, 8.5, 5, 5, r('parch'), 1, 4); // head, big
  blob(p, 17.5, 11, 2.6, 2.2, r('parch'), 1, 4); // snout
  blob(p, 9.5, 8, 2.2, 4.4, r('wood'), 0, 4); // floppy ear, down the back of the head
  p.rect(14, 15, 2, 4, c('ink', 1)); // front leg
  p.rect(14, 6, 2, 3, c('ink', 0)).set(14, 6, c('white', 3)); // eye with a glint
  p.rect(19, 10, 2, 2, c('ink', 0)); // nose
  p.line(17, 13, 18, 13, c('ink', 0)).set(17, 14, c('pink', 2)).set(18, 14, c('pink', 2)); // smile, tongue
  p.set(11, 12, c('pink', 2)); // cheek
  p.line(3, 13, 2, 10, c('parch', 3)).set(2, 9, c('parch', 3)); // tail up
  return outline(p, c('ink', 0), { transparent: T });
}

/** The monster pictures: the kit's, then Puff with its wings up and down. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('puff0', puff(pal, true), {});
  mb.add('puff1', puff(pal, false), {});
  return mb;
}

/** The finished .MBL: nothing here hurts or blocks. The kit's own three are made harmless and not solid. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  return blocks;
}

/** The .MON: the kit's three, then Puff. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  // end -2 is "never dies"; towards is the speed it flies at, straight toward the hero; thru is "stops at solid blocks"
  set[PUFF] = mon(
    [
      [mb.n('puff0'), 4],
      [mb.n('puff1'), 4],
    ],
    { power: POWER, thru: 1, end: -2, towards: PUFF_SPEED },
  );
  return set;
}
