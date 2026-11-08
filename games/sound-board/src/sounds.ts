// SOUND BOARD's sound set (.SND): the 30 numbered beeps, each 36 steps of a PC speaker tone
// (about a quarter of a second at most). Game-Maker plays 0 to 8 by itself when a block
// changes a counter; the hero's moves play the others (jump 9, hurt 10). A step of 0 Hz is
// silence, and a sound that is all zeros is a silent one. Every sound here is a short, soft
// tune: a bell, a coin, a fanfare, a creak and a gentle "no".
import { newSoundSet, NUMFREQ, type SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER, speaker } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';

/** The numbers this game uses. Slot 1, 3 and 11 up are not part of the lessons (3 is on purpose silent). */
export const SLOT = {
  /** hit points go up (a block's "hit points" field) */
  chime: 0,
  /** money goes up */
  coin: 2,
  /** money goes down: left empty on purpose */
  quiet: 3,
  /** a life goes up */
  fanfare: 4,
  /** score goes up */
  ping: 5,
  /** score goes down */
  nope: 6,
  /** another counter goes up (a key) */
  blip: 7,
  /** another counter goes down (a key used on a gate) */
  creak: 8,
  /** the hero's Jump sequence */
  jump: 9,
  /** the hero's Hurt sequence */
  hurt: 10,
} as const;

/** One tune: its steps in Hz. */
const TUNES: Record<number, Uint16Array> = {
  // a bell: a high note, then higher, ringing out
  [SLOT.chime]: speaker((i) => (i < 8 ? 1175 : i < 16 ? 1568 : i < 28 ? 2093 : 0)),
  [SLOT.coin]: SPEAKER.coin(),
  [SLOT.quiet]: speaker(() => 0),
  // a fanfare: six notes up and down, the whole 36 steps (the longest a sound can be)
  [SLOT.fanfare]: SPEAKER.arpeggio([523, 659, 784, 1047, 784, 1047]),
  // a ping: one short high note
  [SLOT.ping]: speaker((i) => (i < 6 ? 1760 : 0)),
  // "no": two soft notes, the second lower
  [SLOT.nope]: speaker((i) => (i < 10 ? 330 : i < 14 ? 0 : i < 26 ? 247 : 0)),
  // a blip: three quick notes going up
  [SLOT.blip]: speaker((i) => (i < 12 ? [784, 1047, 1319][Math.floor(i / 4)] : 0)),
  // a creak: a low slow wobble that sags a little
  [SLOT.creak]: speaker((i) => (i < 30 ? 230 - i * 2 + (i % 4 < 2 ? 14 : 0) : 0)),
  [SLOT.jump]: SPEAKER.rise(300, 900),
  // an "ow": one soft slide down, not a buzz
  [SLOT.hurt]: speaker((i) => (i < 20 ? 500 * (160 / 500) ** (i / 19) : 0)),
};

/** The tune in slot `n`, or all zeros. */
export const tuneOf = (n: number): Uint16Array => TUNES[n] ?? new Uint16Array(NUMFREQ);

/** How many steps of slot `n` sound before the silence at its end. */
export const lengthOf = (n: number): number => {
  const t = tuneOf(n);
  let last = -1;
  t.forEach((hz, i) => hz > 0 && (last = i));
  return last + 1;
};

export function buildSounds(): SoundSet {
  const set = newSoundSet();
  for (const n of Object.values(SLOT)) set.freqs[n] = tuneOf(n);
  return set;
}
