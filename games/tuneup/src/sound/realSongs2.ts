// The parade tune's arrangements for levels 10-13: the rain on a steel tongue drum in D major
// (a step up from the tune's C); the horn section's call on kazoos, in time with its board; the
// gear rooms a whole step higher each; the radio heard through static; and the choir swell.
import { Writer } from '@lewismoten/gamemaker-sandbox-tools/kit/song';
import { Fx, detuned, sweep } from '@lewismoten/gamemaker-sandbox-tools/kit/songFx';
import { tune, v, times } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { patchOf } from './notes';
import { BARS, MELODY, bpmFor, chordOf, eachBar, up } from './song';
import { RAIN_BEAT } from '../levels/rain';
import { KEY_BEAT } from '../levels/key';
import { HORN_BEAT, HORN_REST, type HornRound } from '../levels/horn';

/** The Rain Delay: the tune on a tongue drum in D, a soft pad, a light patter on the hat for the rain. */
export function rainSong(): Uint8Array {
  return tune(bpmFor(RAIN_BEAT), [
    v(0, patchOf('steel-drum'), MELODY, 85, 2),
    v(
      1,
      patchOf('pad-warm'),
      eachBar((b) => chordOf(b, 'w')),
      35,
      2,
    ),
    v(
      2,
      patchOf('marimba'),
      eachBar((b) => `${b.root} q, r q, ${up(b.fifth)} q, r q`),
      55,
      2,
    ),
    v(5, patchOf('melodic-hat'), times(8, 'A5 e, A5 s, A5 s, A5 e, A5 e, A5 s, A5 s, A5 e, A5 e, A5 e'), 25),
  ]);
}

const HORN_NOTE = ['C5', 'E5', 'G5', 'C6'];
/** The Horn Section: the clowns' kazoos honk the round's call in time with the board (a horn a beat, then a rest), over an oom-pah tuba and a bass drum. */
export function hornSong(r: HornRound): Uint8Array {
  const bar = r.phrase.length + HORN_REST;
  const call = [...r.phrase.map((p) => `${HORN_NOTE[p]} q`), ...new Array<string>(HORN_REST).fill('r q')].join(', ');
  const oom = Array.from({ length: bar }, (_, b) => (b % 2 ? 'G2 q' : 'C3 q')).join(', ');
  const drum = Array.from({ length: bar }, (_, b) => (b === 0 ? 'C3 q' : 'r q')).join(', ');
  return tune(bpmFor(HORN_BEAT), [
    v(0, patchOf('kazoo'), times(8, call), 100),
    v(1, patchOf('kazoo'), times(8, call), 55, -12),
    v(2, patchOf('tuba'), times(8, oom), 80),
    v(4, patchOf('melodic-kick'), times(8, drum), 70),
  ]);
}

/** Key Change, room `room` (0-3): the tune a whole step higher each room, on a bright synth brass over a driving bass and a beat that gets busier. */
export function keySong(room: number): Uint8Array {
  const shift = room * 2;
  return tune(bpmFor(KEY_BEAT / 2), [
    v(0, patchOf('synth-brass'), MELODY, 90, shift),
    v(
      1,
      patchOf('slap-bass'),
      eachBar((b) => `${b.root} e, ${b.root} e, ${b.fifth} e, ${b.root} e, ${b.root} e, ${b.fifth} e, ${b.root} e, ${b.fifth} e`),
      85,
      shift,
    ),
    v(
      2,
      patchOf('pad-warm'),
      eachBar((b) => chordOf(b, 'w')),
      40,
      shift,
    ),
    v(3, patchOf('melodic-kick'), times(8, room >= 2 ? 'C3 q, C3 q, C3 q, C3 q' : 'C3 q, r q, C3 q, r q'), 80),
    v(4, patchOf('melodic-snare'), times(8, room >= 1 ? 'r q, D4 q, r q, D4 e, D4 e' : 'r q, D4 q, r q, D4 q'), 60),
  ]);
}

/** The Instrument Panel, tuning: the tune faint on a wobbly vibraphone, as if through static, over a soft pad. */
export function tuningSong(): Uint8Array {
  return tune(bpmFor(12), [
    v(0, patchOf('vibes-wobbly'), MELODY, 60),
    v(
      1,
      patchOf('pad-warm'),
      eachBar((b) => chordOf(b, 'w')),
      30,
    ),
  ]);
}

/**
 * The Instrument Panel, the gauges: the choir swell. Nine FM voices (every melodic channel, out of
 * rhythm mode) come in one by one, a bar apart, each pair a voice and its vibrato twin so they
 * beat like a section, all of them swelling louder by program changes; the ninth sings the tune
 * over the top. Sixteen bars, then round again.
 */
export function choirSong(): Uint8Array {
  const w = new Writer(bpmFor(16));
  // (nine melodic voices: rhythm mode off)
  w.events[0].data = [0xb0, 0x67, 0x00];
  const fx = new Fx(w);
  const aah = patchOf('aah');
  const twin = detuned(aah);
  const from = { car: 34 };
  const to = { car: 4 };
  const swellA = sweep(aah, 8, from, to);
  const swellB = sweep(twin, 8, from, to);
  for (let ch = 0; ch < 9; ch++) fx.open(ch, ch % 2 ? swellB[0] : swellA[0]);
  // each voice's note in each bar's chord: low to high, an octave apart every three voices
  const tone = (ch: number, bar: number) => {
    const b = BARS[bar % BARS.length];
    const note = b.chord[ch % 3];
    return note.replace(/\d/, (d) => String(Number(d) - 1 + Math.floor(ch / 3)));
  };
  for (let ch = 0; ch < 8; ch++) for (let bar = ch; bar < 16; bar++) fx.phrase(ch, bar * 4, `${tone(ch, bar)} w`, 70 + ch * 4);
  fx.phrase(8, 8 * 4, MELODY, 100);
  // the swell: louder step by step as the voices come in
  fx.swell([0, 2, 4, 6], 0, 32, swellA);
  fx.swell([1, 3, 5, 7], 0, 32, swellB);
  return fx.cmf(16);
}
