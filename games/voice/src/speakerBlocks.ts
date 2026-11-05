// OUT LOUD's own blocks, added to the Starter block set after the signs: a loudspeaker on a
// post, in two states. Neither is solid, so Lena walks into one and it talks.
//   speaker   a horn with sound waves; its counter goes UP by one when touched (counter 22),
//             so Game-Maker plays the "a counter went up" sound, which this level's .SND
//             set names a voice file for. It becomes `hush` when touched.
//   lower     the same speaker, but its counter goes DOWN by one (counter 23): the other sound,
//             the "a counter went down" one, so a different voice. It becomes `hush` as well.
//   hush      the horn without its waves: nothing more to say.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The counters the speakers change (the editor's counter list; 20 and up are free for a game's own). */
export const HEARD = 22;
export const SPOKEN = 23;

function horn(pal: Pal, waves: boolean, tint: 'gold' | 'stone'): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const post = pal.r('wood');
  const metal = pal.r(tint);
  // the post
  p.rect(8, 11, 4, 9, post[2]).rect(8, 11, 1, 9, post[3]).rect(11, 11, 1, 9, post[1]);
  // the horn: a box with a cone opening to the right
  p.rect(2, 6, 4, 6, metal[2]).rect(2, 6, 4, 1, metal[4]);
  for (let x = 0; x < 7; x++) {
    const half = 2 + x * 0.6;
    const top = Math.round(9 - half);
    const h = Math.round(half * 2);
    p.rect(6 + x, top, 1, h, x < 6 ? metal[3] : metal[1]);
    p.set(6 + x, top, metal[4]);
  }
  p.rect(13, 3, 1, 12, metal[1]);
  if (waves) {
    const w = pal.c('white', 3);
    for (const [x, r] of [
      [15, 3],
      [17, 5],
    ] as const) {
      for (let dy = -r; dy <= r; dy++) {
        const dx = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)) * 0.45);
        p.set(x + dx - 1, 9 + dy, w);
      }
    }
  }
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** Adds the speaker blocks to `book` (after addStarterBlocks and the signs). */
export function addSpeakerBlocks(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('hush', horn(pal, false, 'stone'), air);
  book.add('speaker', horn(pal, true, 'gold'), { ...air, effect: HEARD, eamt: 1, touch: 'hush' });
  book.add('lower', horn(pal, true, 'gold'), { ...air, effect: SPOKEN, eamt: -1, touch: 'hush' });
}
