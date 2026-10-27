// runner.chr and runner.cbl: Teddy for the dream run, where the world runs by and he stays on
// the spot. It is teddy.chr with his standing still turned into a rabbit hop on the spot
// facing right, and his walks and hops facing right too: Right runs on a little, Left eases
// back (he never turns round on a run). Every trick is on the same key as in teddy.chr.
import { CHARBL } from '../../../../web/src/formats/blocks';
import { emptyFrame, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { BlockSet } from '../blocks/blockset';
import { buildCharacter, CB, HOP, STEP } from './character';
import { SEQ } from '../../../teddy2/src/ids';
import { BUNNY, HOP_CYCLE } from '../sprites/runner';

/** teddy.cbl's blocks at the same numbers, and the hop on the spot after them. */
export const RB = new BlockSet(50, true);
CB.names.forEach((name, i) => RB.add(name, CB.pics[i]));
for (const [name, px] of Object.entries(BUNNY)) RB.add(name, px);

const f = (pic: string, pause: number, x = 0, y = 0): Frame => ({ ...emptyFrame(), x, y, pic1: CHARBL, pic2: RB.id(pic), pause, orient: 0 });

/** Replaces a sequence's frames, keeping its key, sound and the rest. */
function frames(s: Sequence, list: Frame[]): void {
  if (list.length > 10) throw new Error('Too many frames');
  list.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = list.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
}

export function buildRunner(): Character {
  const ch = buildCharacter();
  const S = ch.sequences;
  const hop = (dx: number) => HOP_CYCLE.map(([p, t]) => f(p, t, dx === 0 ? 0 : Math.sign(dx) * Math.round((STEP * t) / 2)));
  frames(S[SEQ.idle], hop(0));
  for (const q of [SEQ.right, SEQ.rightD]) frames(S[q], hop(1));
  for (const q of [SEQ.left, SEQ.leftA]) frames(S[q], hop(-1));
  for (const q of [SEQ.hop, SEQ.hopW]) frames(S[q], [f('hop', 1, 0, -HOP)]);
  frames(S[SEQ.hopLeft], [f('hop', 1, -STEP, -HOP)]);
  frames(S[SEQ.hopRight], [f('hop', 1, STEP, -HOP)]);
  return ch;
}
