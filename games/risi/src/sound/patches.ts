// Veni, Vidi, Risi!'s FM patches (SBI): the troupe's instruments and drums (song.ts).
import { INSTRUMENTS, sbi } from '../../../kit/music';
import { REED, VOICE } from '../../../kit/song';
import { detuned } from '../../../kit/songFx';

// ---- the patches --------------------------------------------------------------------------

/** The tenor: a vibrato voice; his twin without it sings along in the choruses. */
export const TENOR = VOICE;
export const TWIN = detuned(VOICE);
/** Bowed strings, sustaining. */
export const STRINGS = INSTRUMENTS.strings;
/** Brass: stabs and fanfares. */
export const BRASS = INSTRUMENTS.brass;
/** A bright trumpet for the marches. */
export const TRUMPET = sbi({
  modChar: 0x21,
  carChar: 0x21,
  modLevel: 0x16,
  carLevel: 0x00,
  modAD: 0x71,
  carAD: 0x82,
  modSR: 0x15,
  carSR: 0x16,
  feedback: 0x0e,
});
/** The trombone for the event: a long brassy note. */
export const TROMBONE = sbi({
  modChar: 0x21,
  carChar: 0x21,
  modLevel: 0x1a,
  carLevel: 0x02,
  modAD: 0x52,
  carAD: 0x61,
  modSR: 0x14,
  carSR: 0x15,
  feedback: 0x0c,
});
/** A harpsichord (plucked, bright, quick to die). */
export const HARPSICHORD = sbi({
  modChar: 0x01,
  carChar: 0x01,
  modLevel: 0x0e,
  carLevel: 0x00,
  modAD: 0xf8,
  carAD: 0xf4,
  modSR: 0x44,
  carSR: 0x55,
  modWave: 2,
  feedback: 0x0e,
});
/** The harp (and the lyre): a soft pluck that rings. */
export const HARP = sbi({ modChar: 0x02, carChar: 0x01, modLevel: 0x1d, carLevel: 0x00, modAD: 0xf4, carAD: 0xf3, modSR: 0x32, carSR: 0x24, feedback: 0x06 });
/** Pizzicato strings. */
export const PIZZ = INSTRUMENTS.pluck;
/** The soprano (the diva): a pure, high, sustained voice with vibrato. */
export const SOPRANO = sbi({
  modChar: 0x61,
  carChar: 0x62,
  modLevel: 0x24,
  carLevel: 0x00,
  modAD: 0x75,
  carAD: 0x76,
  modSR: 0x14,
  carSR: 0x15,
  feedback: 0x0a,
});
/** A kazoo-ish reed for the ironic one. */
export const KAZOO = REED;
/** The bass: plucked. */
export const BASSP = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x14, carLevel: 0x00, modAD: 0xf5, carAD: 0xf4, modSR: 0x36, carSR: 0x36, feedback: 0x0c });
/** Timpani on the tom channel (long decay, its pitch follows its note). */
export const TIMPANI = sbi({
  modChar: 0x01,
  carChar: 0x00,
  modLevel: 0x00,
  carLevel: 0x00,
  modAD: 0xf4,
  carAD: 0x00,
  modSR: 0x26,
  carSR: 0x00,
  feedback: 0x00,
});
