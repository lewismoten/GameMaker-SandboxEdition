// The Shakespeare in Sweatpants score's FM patches (SBI): the band's instruments and the rhythm-mode drums (song.ts).
import { INSTRUMENTS, sbi } from '../../../kit/music';
import { EPIANO } from '../../../kit/song';
import { sweep } from '../../../kit/songFx';

// ---- the patches --------------------------------------------------------------------------

/** Vibraphone: a near-sine bar with a faint fourth partial, the motor's tremolo, ringing down. */
export const VIBES = sbi({ modChar: 0x04, carChar: 0x81, modLevel: 0x28, carLevel: 0x00, modAD: 0xf6, carAD: 0xf3, modSR: 0x36, carSR: 0x24, feedback: 0x02 });
/** Harmon-muted trumpet: thin, nasal, a little buzz (half-sine modulator). */
export const MUTE = sbi({
  modChar: 0x21,
  carChar: 0x21,
  modLevel: 0x1a,
  carLevel: 0x00,
  modAD: 0x95,
  carAD: 0x86,
  modSR: 0x17,
  carSR: 0x18,
  modWave: 1,
  feedback: 0x0c,
});
/** Open brass: trumpets for the shouts, trombones under them. */
export const BRASS = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x16, carLevel: 0x00, modAD: 0x75, carAD: 0x75, modSR: 0x17, carSR: 0x17, feedback: 0x0e });
/** Tenor sax: breathy reed with vibrato. */
export const TENOR = sbi({
  modChar: 0x31,
  carChar: 0x61,
  modLevel: 0x1c,
  carLevel: 0x00,
  modAD: 0x75,
  carAD: 0x76,
  modSR: 0x15,
  carSR: 0x16,
  modWave: 1,
  feedback: 0x0a,
});
/** Clarinet: the modulator an octave up, so only the odd harmonics sound. */
export const CLARINET = sbi({
  modChar: 0x22,
  carChar: 0x61,
  modLevel: 0x1e,
  carLevel: 0x00,
  modAD: 0xb4,
  carAD: 0xa5,
  modSR: 0x06,
  carSR: 0x07,
  feedback: 0x08,
});
/** Nylon-string guitar for the bossa nova. */
export const GUITAR = sbi({ modChar: 0x03, carChar: 0x01, modLevel: 0x1e, carLevel: 0x00, modAD: 0xf4, carAD: 0xf3, modSR: 0x55, carSR: 0x45, feedback: 0x0a });
/** The piano trio's piano, the Rhodes, the strings. */
export const PIANO = INSTRUMENTS.piano;
export const RHODES = EPIANO;
export const STRINGS = INSTRUMENTS.strings;
/** The pipe organ (two drawbars at once, the upper one trembling), and its swell out of nothing. */
export const PIPE = sbi({
  modChar: 0x21,
  carChar: 0xa2,
  modLevel: 0x12,
  carLevel: 0x0a,
  modAD: 0xf0,
  carAD: 0xf0,
  modSR: 0x0f,
  carSR: 0x0f,
  carWave: 1,
  feedback: 0x03,
});
export const SWELL = sweep(PIPE, 8, { mod: 48, car: 44 }, { mod: 12, car: 6 });

// Rhythm mode drums (one operator each but the kick: the modulator half of the SBI).
export const KICK = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x0e, carLevel: 0x00, modAD: 0xf8, carAD: 0xf7, modSR: 0x77, carSR: 0x57, feedback: 0x08 });
export const SNARE = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x04, carLevel: 0x00, modAD: 0xf8, carAD: 0x00, modSR: 0x08, carSR: 0x00, feedback: 0x00 });
/** Brushes on the snare: a slow attack, a swish. */
export const BRUSH = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x0a, carLevel: 0x00, modAD: 0x95, carAD: 0x00, modSR: 0x05, carSR: 0x00, feedback: 0x00 });
/** The cross-stick of the bossa nova. */
export const RIM = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x06, carLevel: 0x00, modAD: 0xfb, carAD: 0x00, modSR: 0x0b, carSR: 0x00, feedback: 0x00 });
export const TIMP = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x02, carLevel: 0x00, modAD: 0xf5, carAD: 0x00, modSR: 0x35, carSR: 0x00, feedback: 0x00 });
export const BONGO = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x04, carLevel: 0x00, modAD: 0xf8, carAD: 0x00, modSR: 0x58, carSR: 0x00, feedback: 0x00 });
export const RIDE = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x0a, carLevel: 0x00, modAD: 0xf5, carAD: 0x00, modSR: 0x05, carSR: 0x00, feedback: 0x00 });
export const CRASH = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x04, carLevel: 0x00, modAD: 0xf3, carAD: 0x00, modSR: 0x03, carSR: 0x00, feedback: 0x00 });
/** The hi-hat's foot chick (and the beatniks' finger snaps). */
export const HAT = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x0a, carLevel: 0x00, modAD: 0xfa, carAD: 0x00, modSR: 0x0a, carSR: 0x00, feedback: 0x00 });
