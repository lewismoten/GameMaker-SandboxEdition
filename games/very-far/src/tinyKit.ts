// Kit seen from very far away: 4 pixels wide and 8 tall, standing on the bottom row of a 20 x 20 block (the block
// above him stays empty). Each pose is drawn by hand, one letter a pixel. His colors are the near Kit's own
// (teal beanie, orange hoodie, dark pants), left unhazed by the far palette so a speck still reads.
//
// tinyHero() makes a whole character file from these: the near character's sequences with every frame swapped for
// a tiny pose, so the keys, the walk cycle's order and the 2-block hitbox stay as they were. A far scene loads it
// (with its blocks) in place of hero.chr and hero.cbl. What differs per scene is the speed: the step a frame, and
// how long a frame lasts. A frame's x is how many pixels it moves, so a far Kit can be made to cover ground slowly.
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { WALK_STEP } from '../../kit/starter/heroChar';
import type { Pal } from '../../kit/starter/palette';

const CLEAR = 255;
/** The rise of a far Kit's jump (the push upward), against the near Kit's 12. */
const FAR_JUMP = 4;

// T beanie, W pom-pom, S face, O hoodie, P pants, K shoes
const TOP = ['.W..', '.TT.', 'TTTT', '.SSS'];
const POSES: Record<string, string[]> = {
  stand: [...TOP, 'OOOO', '.OO.', '.PP.', '.KK.'],
  walk0: [...TOP, 'OOOO', 'OO..', 'P..P', 'K..K'],
  walk1: [...TOP, 'OOOO', '.OO.', '.PP.', '.KK.'],
  walk2: [...TOP, 'OOOO', '..OO', 'P..P', 'K..K'],
  walk3: [...TOP, 'OOOO', '.OO.', '.PP.', '.KK.'],
  up: ['OW.O', 'OTTO', 'TTTT', '.SSS', '.OO.', '.OO.', '.PP.', '.PP.'],
  fall: ['.W..', '.TT.', 'TTTT', 'OSSO', 'O.OO', '.OO.', 'P..P', 'K..K'],
  hurt: [...TOP, 'OOOO', 'OOOO', 'PP.P', 'KK.K'],
};
/** Which pose each of the near Kit's bottom blocks becomes (anything else stands). */
const POSE_OF: Record<string, string> = {
  jumpup: 'up',
  jump: 'up',
  cheer: 'up',
  fall: 'fall',
  hurt: 'hurt',
  walk0: 'walk0',
  walk1: 'walk1',
  walk2: 'walk2',
  walk3: 'walk3',
};

/** One pose as a 20 x 20 block with Kit centered on the bottom row. */
export function tinyPose(pal: Pal, name: string): Pixels {
  const key = { T: pal.c('teal', 2), W: pal.c('white', 3), S: pal.c('skin', 3), O: pal.c('orange', 2), P: pal.c('ink', 0), K: pal.c('ink', 0) };
  return new Pixels(20, 20, CLEAR).draw(8, 12, POSES[name], key);
}

/** The tiny Kit's character file and blocks. `near` is buildHero's file, `nearBlocks` its blocks; `step` is pixels a frame and `pause` ticks a frame while walking. */
export function tinyHero(pal: Pal, near: Character, nearBlocks: Book, step: number, pause: number): { blocks: Book; character: Character } {
  const nameOf = new Map<number, string>();
  for (const [name, n] of nearBlocks.index) nameOf.set(n, name);
  const blocks = new Book('cbl');
  const made = new Map<string, number>();
  const blockOf = (pose: string): number => {
    let n = made.get(pose);
    if (n === undefined) made.set(pose, (n = blocks.add(`tiny.${pose}`, tinyPose(pal, pose))));
    return n;
  };
  const character: Character = structuredClone(near);
  for (const seq of character.sequences)
    for (const f of seq.frames) {
      if (f.pic2 >= CHARBL) continue; // an empty frame or the end of a sequence
      f.pic2 = blockOf(POSE_OF[nameOf.get(f.pic2) ?? ''] ?? 'stand');
      f.pic1 = CHARBL;
      if (Math.abs(f.x) === WALK_STEP) {
        f.x = Math.sign(f.x) * step;
        f.pause = pause;
      }
      if (f.y < 0 && Math.abs(f.y) > WALK_STEP) f.y = -FAR_JUMP;
    }
  return { blocks, character };
}
