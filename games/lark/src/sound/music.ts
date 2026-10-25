// The soundtrack: Sound Blaster FM songs, all one tune. "The Counting Song" is a waltz in F, a
// music-box tune in three-quarter time over a tick-tock, and every place plays it its own way:
// the library hushed on a music box, the road on a reedy lead over an oom-pah-pah, the square
// with the clock ticking under brass, the tower slow and low with the tick-tock up front, the
// parade with the whole band, the park on a celesta for Teddy's party, the toy shop on the bare
// music box (and dancing once it plays), the car lot on a humming organ, the cove slow and low on
// strings. (Each stop on the road adds its friend's instrument.)
import { INSTRUMENTS, sbi, song, type Voice } from '../../../kit/music';

const BAR = 3;
const A = ['C5 q, F5 q, A5 q', 'G5 h.', 'C5 q, E5 q, G5 q', 'F5 h.', 'A5 q, Bb5 q, C6 q', 'D6 q, C6 q, A5 q', 'G5 q, A5 q, G5 q', 'F5 h.'];
const B = ['D6 q, C6 q, Bb5 q', 'A5 h, F5 q', 'G5 q, A5 q, Bb5 q', 'A5 h.', 'D6 q, C6 q, Bb5 q', 'A5 q, G5 q, F5 q', 'E5 q, G5 q, C6 q', 'F5 h.'];
const CHORDS_A = ['F', 'C', 'C', 'F', 'F', 'Bb', 'C', 'F'];
const CHORDS_B = ['Bb', 'F', 'C', 'F', 'Bb', 'F', 'C', 'F'];
const ROOT: Record<string, string> = { F: 'F2', C: 'C2', Bb: 'Bb1' };
const TRIAD: Record<string, string> = { F: '[A3 C4 F4]', C: '[G3 C4 E4]', Bb: '[Bb3 D4 F4]' };

type Part = 'A' | 'B';
const tune = (form: Part[]) => form.flatMap((p) => (p === 'A' ? A : B)).join(', ');
const chords = (form: Part[]) => form.flatMap((p) => (p === 'A' ? CHORDS_A : CHORDS_B));

/** Oom-pah-pah: the root on one, the chord on two and three. */
function waltzBass(form: Part[]): { bass: string; comp: string } {
  const ch = chords(form);
  return {
    bass: ch.map((x) => `${ROOT[x]} q, r q, r q`).join(', '),
    comp: ch.map((x) => `r q, ${TRIAD[x]} q, ${TRIAD[x]} q`).join(', '),
  };
}

/** The tick-tock: two notes an eighth apart, all the way through. */
const tickTock = (bars: number, hi = 'C6', lo = 'G5') =>
  Array(bars * BAR)
    .fill(`${hi} e, ${lo} e`)
    .join(', ');
const held = (form: Part[]) =>
  chords(form)
    .map((x) => `${TRIAD[x]} h.`)
    .join(', ');

const MUSICBOX = sbi({ modChar: 0x07, carChar: 0x01, modLevel: 0x1c, carLevel: 0x00, modAD: 0xf6, carAD: 0xf4, modSR: 0x41, carSR: 0x24, feedback: 0x06 });
const CELESTA = sbi({ modChar: 0x05, carChar: 0x01, modLevel: 0x18, carLevel: 0x00, modAD: 0xf7, carAD: 0xf5, modSR: 0x33, carSR: 0x25, feedback: 0x04 });
const WOODBLOCK = sbi({ modChar: 0x05, carChar: 0x01, modLevel: 0x10, carLevel: 0x04, modAD: 0xfa, carAD: 0xf8, modSR: 0x8f, carSR: 0x8f, feedback: 0x0e });

/** Sleigh bells: a bright, quick jingle. */
const JINGLE = sbi({ modChar: 0x0f, carChar: 0x01, modLevel: 0x0c, carLevel: 0x02, modAD: 0xfa, carAD: 0xf9, modSR: 0x77, carSR: 0x77, feedback: 0x0e });
/** A lute (and the Hive's harpsichord): a nasal pluck. */
const LUTE = sbi({
  modChar: 0x21,
  carChar: 0x01,
  modLevel: 0x16,
  carLevel: 0x00,
  modAD: 0xf9,
  carAD: 0xf7,
  modSR: 0x44,
  carSR: 0x36,
  modWave: 1,
  feedback: 0x0a,
});
/** A marimba: wood, round and short. */
const MARIMBA = sbi({ modChar: 0x04, carChar: 0x01, modLevel: 0x1d, carLevel: 0x00, modAD: 0xf9, carAD: 0xf7, modSR: 0x55, carSR: 0x56, feedback: 0x06 });
/** A calliope: breathy steam pipes. */
const CALLIOPE = sbi({
  modChar: 0xe1,
  carChar: 0x61,
  modLevel: 0x1e,
  carLevel: 0x00,
  modAD: 0x74,
  carAD: 0x82,
  modSR: 0x07,
  carSR: 0x07,
  modWave: 1,
  feedback: 0x08,
});
/** Shimmering pads for the stars. */
const SHIMMER = sbi({
  modChar: 0xb1,
  carChar: 0x31,
  modLevel: 0x24,
  carLevel: 0x00,
  modAD: 0x32,
  carAD: 0x41,
  modSR: 0x03,
  carSR: 0x03,
  modWave: 2,
  feedback: 0x0c,
});

const v = (channel: number, instrument: Uint8Array, notes: string, velocity = 100, transpose = 0): Voice => ({
  channel,
  instrument,
  notes,
  velocity,
  transpose,
});

function arrangement(
  form: Part[],
  o: {
    lead: Uint8Array;
    tick?: boolean;
    comp?: Uint8Array;
    pad?: boolean;
    leadVel?: number;
    transpose?: number;
    bells?: boolean;
    padSound?: Uint8Array;
    twin?: Uint8Array;
  },
): Voice[] {
  const { bass, comp } = waltzBass(form);
  const bars = form.length * 8;
  const out: Voice[] = [v(0, o.lead, tune(form), o.leadVel ?? 104, o.transpose ?? 0), v(1, INSTRUMENTS.bass, bass, 90, o.transpose ?? 0)];
  if (o.comp) out.push(v(2, o.comp, comp, 60, o.transpose ?? 0));
  if (o.tick) out.push(v(5, WOODBLOCK, tickTock(bars), 56, o.transpose ?? 0));
  if (o.pad) out.push(v(6, o.padSound ?? INSTRUMENTS.pad, held(form), 50, (o.transpose ?? 0) - 12));
  if (o.bells) out.push(v(7, JINGLE, tickTock(bars, 'C7', 'G6'), 50, o.transpose ?? 0));
  if (o.twin) out.push(v(3, o.twin, tune(form), 70, (o.transpose ?? 0) + 12));
  return out;
}

export const titleSong = () => song(112, arrangement(['A', 'B', 'A'], { lead: MUSICBOX, comp: INSTRUMENTS.strings, tick: true, pad: true }));
export const menuSong = () => song(100, arrangement(['A'], { lead: MUSICBOX, tick: true }));
export const storySong = () => song(92, arrangement(['A', 'B'], { lead: MUSICBOX, pad: true }));
export const librarySong = () => song(84, arrangement(['A', 'B'], { lead: MUSICBOX, pad: true, leadVel: 90 }));
export const roadSong = () => song(120, arrangement(['A', 'A', 'B', 'A'], { lead: INSTRUMENTS.lead, comp: INSTRUMENTS.pluck, tick: false }));
export const squareSong = () => song(126, arrangement(['A', 'B', 'A'], { lead: INSTRUMENTS.brass, comp: INSTRUMENTS.piano, tick: true }));
export const towerSong = () => song(96, arrangement(['A', 'B'], { lead: INSTRUMENTS.bell, tick: true, pad: true, transpose: -5 }));
export const paradeSong = () => song(144, arrangement(['A', 'A', 'B', 'A'], { lead: INSTRUMENTS.brass, comp: INSTRUMENTS.organ, tick: true, pad: true }));
export const parkSong = () => song(108, arrangement(['A', 'B', 'A'], { lead: CELESTA, comp: INSTRUMENTS.pluck, pad: true }));
export const musicBoxSong = () => song(96, arrangement(['A', 'B'], { lead: MUSICBOX, tick: true, transpose: 2 }));
export const danceSong = () => song(132, arrangement(['A', 'B', 'A'], { lead: MUSICBOX, comp: INSTRUMENTS.strings, tick: true, pad: true, transpose: 2 }));
export const lotSong = () => song(116, arrangement(['A', 'A', 'B'], { lead: INSTRUMENTS.organ, comp: INSTRUMENTS.bass, tick: true, transpose: -3 }));
export const seaSong = () => song(78, arrangement(['A', 'B'], { lead: INSTRUMENTS.strings, pad: true, transpose: -7, leadVel: 90 }));
export const wonSong = () => song(104, arrangement(['A', 'B', 'A'], { lead: INSTRUMENTS.strings, comp: INSTRUMENTS.piano, tick: true, pad: true }));
export const lostSong = () => song(70, arrangement(['A'], { lead: MUSICBOX, pad: true, leadVel: 80 }));
export const snowSong = () => song(126, arrangement(['A', 'B', 'A'], { lead: CELESTA, comp: INSTRUMENTS.pluck, bells: true, pad: true, transpose: 5 }));
export const hiveSong = () => song(104, arrangement(['A', 'B', 'A'], { lead: LUTE, comp: LUTE, tick: true, pad: true, transpose: -2 }));
export const loftSong = () => song(92, arrangement(['A', 'B'], { lead: LUTE, pad: true, padSound: SHIMMER, transpose: -2 }));
export const rocksSong = () => song(116, arrangement(['A', 'A', 'B', 'A'], { lead: MARIMBA, comp: MARIMBA, pad: true, transpose: 4 }));
export const fairSong = () => song(152, arrangement(['A', 'B', 'A', 'B'], { lead: CALLIOPE, comp: INSTRUMENTS.organ, tick: true, transpose: 0 }));
export const plantSong = () => song(88, arrangement(['A', 'B', 'A'], { lead: SHIMMER, comp: CELESTA, pad: true, padSound: SHIMMER, transpose: 7 }));
/** The Smart Home: every friend's instrument at once. */
export const homeSong = () =>
  song(112, arrangement(['A', 'B', 'A', 'B'], { lead: INSTRUMENTS.lead, comp: LUTE, tick: true, bells: true, pad: true, twin: MARIMBA }));
/** The gold: the tick-tock slows and warms, everybody playing. */
export const goldSong = () =>
  song(80, arrangement(['A', 'B', 'A'], { lead: MUSICBOX, comp: INSTRUMENTS.strings, pad: true, padSound: SHIMMER, twin: CALLIOPE, bells: true }));
