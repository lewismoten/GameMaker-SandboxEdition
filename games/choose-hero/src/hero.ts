// WHO TO BE?'s two heroes. Both are the Starter hero's character file (kit/starter/heroChar.ts) with two numbers changed,
// and a hoodie color to tell them apart. A scene names the character file it loads, so a door can be a choice:
//   FAST FEET  (fast.chr, orange hoodie)  walks quickly and jumps a little over three blocks, as Lian always does
//   BIG HOPS   (hops.chr, purple hoodie)  walks slowly and jumps six blocks
// The two pairs of files (.CHR and .CBL) are the only difference between the climb scenes.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { Book } from '../../kit/starter/book';
import { SEQ } from '../../kit/starter/ids';
import { buildHero } from '../../kit/starter/heroChar';
import type { Pal } from '../../kit/starter/palette';

/** Hit points and lives at the start (nothing here takes any). */
export const HERO_HIT_POINTS = 50;
export const HERO_LIVES = 3;
/** Pixels a frame while walking. Lian's own is 4. */
export const FAST_STEP = 6;
export const BIG_STEP = 3;
/** The upward push of a jump: it rises about N*(N-1)/2 pixels (12 is Lian's 3.3 blocks; 17 gives six, because a move is capped at 11 pixels a tick). */
export const FAST_PUSH = 12;
export const BIG_PUSH = 17;

/** Sets how far each walking frame moves and how hard the jump pushes. */
function tune(ch: Character, step: number, push: number): Character {
  const S = ch.sequences;
  for (const [seq, dir] of [
    [SEQ.right, 1],
    [SEQ.rightD, 1],
    [SEQ.left, -1],
    [SEQ.leftA, -1],
  ] as const)
    S[seq].frames.forEach((fr) => {
      if (fr.x) fr.x = dir * step;
    });
  S[SEQ.jump].frames[0].y = -push;
  return ch;
}

/** FAST FEET's character file. */
export const buildFast = (cb: Book): Character => tune(buildHero(cb), FAST_STEP, FAST_PUSH);
/** BIG HOPS's character file, using the purple pictures from `bigBlocks`. */
export const buildBig = (cb: Book): Character => tune(buildHero(cb), BIG_STEP, BIG_PUSH);

/** Lian's character blocks again, in the same order, with the orange hoodie painted purple. */
export function bigBlocks(kit: Book, pal: Pal): Book {
  const orange = pal.r('orange');
  const purple = pal.r('purple');
  const out = new Book('cbl');
  for (const [name, pic] of kit.pics) {
    const p = new Pixels(pic.w, pic.h, 255);
    p.px.set(pic.px.map((c) => (orange.includes(c) ? purple[orange.indexOf(c)] : c)));
    out.add(name, p);
  }
  return out;
}
