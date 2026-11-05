// BOOTS AND JET PACK's heroes: the Starter hero (kit/starter/heroChar.ts) twice.
//   hero.chr   level 1: Kit as he is. His jump (sequence 9) is a push upward that adds to his speed (momentum),
//              and its uses are unlimited, so every tap in the air lifts him again: a jet pack.
//   hero2.chr  level 2: the jump moves to sequence 17, whose meter is 2. Each tap that starts it spends one,
//              and with none left Space does nothing until a boot charge fills it again.
// Why a different sequence: the game keeps one set of counters from the first level on. A sequence that the
// first level's character defines (sequence 9, unlimited) keeps that counter in every later level, whatever the
// later character file says. A sequence it leaves undefined (key 0, like 17) takes its counter from the
// character of the level that first uses it.
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import type { Book } from '../../kit/starter/book';
import { SEQ } from '../../kit/starter/ids';
import { buildHero } from '../../kit/starter/heroChar';

/** Hit points and lives at the start (nothing here takes any). */
export const HERO_HIT_POINTS = 50;
export const HERO_LIVES = 3;
/** The sequence level 2's jump is on (17 is one level 1's character leaves unused). */
export const BOOT_SEQ = 17;
/** The taps the boots hold at the start of level 2. */
export const BOOT_TAPS = 2;

/** Level 1's Kit: unlimited jumps. */
export function buildKit(cb: Book): Character {
  return buildHero(cb);
}

/** Level 2's Kit: the jump is sequence 17 with BOOT_TAPS uses, and sequence 9 has no key. */
export function buildBootKit(cb: Book): Character {
  const ch = buildHero(cb);
  const S = ch.sequences;
  Object.assign(S[BOOT_SEQ], structuredClone(S[SEQ.jump]));
  Object.assign(S[SEQ.jump], { key: 0, jstkMov: 0, jstkBut: 4 });
  ch.meter[BOOT_SEQ] = BOOT_TAPS;
  return ch;
}
