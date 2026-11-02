// The songs for levels 10-13, each its own tune, scored for one group of the music editor's
// presets (web/src/audio/oplPresets.ts). Their blocks keep time with them (rings that start
// with the scene, as the song does), so each keeps its level's beat and lasts whole rounds of
// its rings:
// - The Rain Delay (mallets): D major in 5/4 (three beats and two, like the last wipers), 24
//   bars, 120 beats: whole rounds of the 2-, 3- and 5-beat wipers.
// - The Horn Section (brass): the round's call on the clowns' kazoos, as the board lights it,
//   and the brass answering in the two beats of rest, a funk in A minor, sixteen calls.
// - Key Change (synth): an 80s pop song, verse, verse, lift and chorus, a whole step higher
//   each gear room and busier each time; 32 bars, whole rounds of the doors' two-bar clock.
// - The Instrument Panel (strings, then voices): a bossa on the radio in A minor, its needle's
//   sweep two bars long; then the choir swell for the gauges, a hymn in C.
import { Writer } from '@lewismoten/gamemaker-sandbox-tools/kit/song';
import { Fx, detuned, sweep } from '@lewismoten/gamemaker-sandbox-tools/kit/songFx';
import { patchOf } from './notes';
import { bars, comp, grid, rep, score, voicing, type Drum } from './score';
import { bpmFor } from './song';
import { RAIN_BEAT } from '../levels/rain';
import { KEY_BEAT } from '../levels/key';
import { HORN_BEAT, HORN_REST, type HornRound } from '../levels/horn';
import { DIAL } from '../levels/panel';

// ---- the Rain Delay

const RAIN_A = ['D', 'Bm', 'G', 'A', 'D', 'F#m', 'Em', 'A'];
const RAIN_B = ['G', 'D', 'Em', 'Bm', 'G', 'D', 'E', 'A'];
const DROPS_A = ['F#5q A5q D6q B5q A5q', 'F#5h. D5h', 'G5q B5q D6q E6q D6q', 'C#6h. A5h', 'F#5q A5q D6q F#6q E6q', 'C#6h. A5h', 'B5q G5q E5q G5q B5q'];
const DROPS_B = bars(
  'D6q. B5e G5q D6h',
  'A5q. F#5e D5q A5h',
  'G5q. E5e B4q G5q B5q',
  'F#5h. D5q F#5q',
  'G5e A5e B5e D6e E6q D6q B5q',
  'A5e B5e A5e F#5e D5q F#5q A5q',
  'G#5q B5q E6q D6q B5q',
  'C#6h. rh',
);

/** The Rain Delay: a steel drum's tune in 5/4 over marimba and vibraphone, celesta drops, a hi-hat's patter. */
export function rainSong(): Uint8Array {
  const chords = [...RAIN_A, ...RAIN_B, ...RAIN_A];
  return score(
    RAIN_BEAT,
    5,
    [
      { ch: 0, patch: 'steel-drum', notes: bars(...DROPS_A, 'A5w rq', DROPS_B, ...DROPS_A, 'E5q F#5q E5q C#5q A4q'), vel: 85 },
      { ch: 1, patch: 'celesta', notes: comp(chords, 5, 'rq 8e re rq 5e 3e rq | rh. 3e 5e 8q', { bass: 'D6' }), vel: 40 },
      { ch: 2, patch: 'marimba', notes: comp(chords, 5, 'Rh. 5h', { bass: 'E2' }), vel: 75 },
      { ch: 3, patch: 'vibraphone', notes: comp(chords, 5, 'Xh. Xh', { lo: 'F#3' }), vel: 40 },
    ],
    [
      { patch: 'kick-punchy', grid: grid(24, 'x.....x...'), vel: 55 },
      { patch: 'hat-closed', grid: grid(24, 'xoxoxxoxox'), vel: 35 },
    ],
  );
}

// ---- the Horn Section

const HORN_NOTE = ['C5', 'E5', 'G5', 'C6'];
/** Each round's chords, a call each (the call's C, E and G belong to every one). */
const HORN_CHORDS = [
  ['Am7', 'Am7', 'Fmaj7', 'Fmaj7', 'C', 'C', 'Am7', 'Am7'],
  ['Fmaj7', 'Fmaj7', 'C', 'C', 'Dm7', 'Dm7', 'Am7', 'Am7'],
  ['C', 'Am7', 'Fmaj7', 'C', 'Am7', 'Dm7', 'Fmaj7', 'Am7'],
];
/** Each round's answers, two beats in the rest after the call, in turn. */
const ANSWERS = [
  ['8e 7e 5q', '5e 3e Re 5e', '3e 5e 8q', '7e 5e 3e Re'],
  ['Re 3e 5q', '8e 5e 3q', '5e 7e 8e 7e', '3q Rq'],
  ['5e 5e 8q', '3e Re 3e 5e', '8e 8e 7e 5e', 'Rh'],
];
const rest = (beats: number): string => (beats >= 4 ? `rw ${rest(beats - 4)}` : ['', 'rq', 'rh', 'rh.'][beats]).trim();

/** The Horn Section: the clowns' kazoos honk the round's call in time with the board (a horn a beat, then two beats of rest), the trumpet and trombones answer in the rest, a tuba walks under it, a kick and a snare keep the time. */
export function hornSong(r: HornRound): Uint8Array {
  const n = r.phrase.length;
  const bar = n + HORN_REST;
  const round = [3, 4, 5].indexOf(n);
  const chords = [...HORN_CHORDS[round], ...HORN_CHORDS[round]];
  const call = [...r.phrase.map((p) => `${HORN_NOTE[p]}q`), rest(HORN_REST)].join(' ');
  const walk = Array.from({ length: bar }, (_, b) => ['Rq', '5q', '8q', '5q', '3q', '5q', '7q'][b]).join(' ');
  return score(
    HORN_BEAT,
    bar,
    [
      { ch: 0, patch: 'kazoo', notes: rep(16, call), vel: 100 },
      { ch: 1, patch: 'trumpet', notes: comp(chords, bar, ANSWERS[round].map((a) => `${rest(n)} ${a}`).join(' | '), { bass: 'A4' }), vel: 80 },
      { ch: 2, patch: 'tuba', notes: comp(chords, bar, walk, { bass: 'E2' }), vel: 85 },
      { ch: 3, patch: 'trombone', notes: comp(chords, bar, `Xh ${rest(n - 2)} Xe Xe rq`, { lo: 'F3' }), vel: 50 },
    ],
    [
      { patch: 'kick-punchy', grid: grid(16, 'x' + '.'.repeat(bar - 1)), vel: 75 },
      { patch: 'snare-tight', grid: grid(16, '.'.repeat(n) + 'x.'), vel: 60 },
    ],
  );
}

// ---- Key Change

const POP_V = ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'];
const POP_P = ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'];
const POP_C = ['C', 'G', 'Am', 'F', 'C', 'G', 'F G', 'C'];
const VERSE = ['rq E5e G5e C6q G5e E5e', 'D5q. G5e rh', 'rq E5e A5e C6q A5e E5e', 'F5q. A5e rh'];
const VERSE1 = bars(...VERSE, 'rq G5e C6e E6q D6e C6e', 'B5q. G5e D5h', 'A5e G5e F5e E5e F5q A5q', 'G5h. rq');
const VERSE2 = bars(...VERSE, 'rq E6e D6e C6q G5e E5e', 'D5q. G5e B5h', 'C6e B5e A5e G5e F5q E5q', 'D5h G5h');
const LIFT = bars(
  'A5q. A5e C6e A5e G5e E5e',
  'F5q. F5e A5e F5e E5e C5e',
  'E5q. E5e G5e E5e D5e C5e',
  'D5h G5h',
  'A5e C6e E6e C6e A5e C6e E6e C6e',
  'F6q. E6e C6h',
  'E6e D6e C6e G5e E6e D6e C6e G5e',
  'B5h D6h',
);
const CHORUS = bars(
  'E6q. D6e C6q G5q',
  'D6q. C6e B5q G5q',
  'C6q. B5e A5q E5q',
  'F5q A5q C6h',
  'E6q. D6e C6q E6q',
  'G6q. F6e D6q B5q',
  'C6q A5q B5q D6q',
  'C6h. rq',
);

/**
 * Key Change, room `room` (0-3): one pop song, a whole step higher each room (the rooms' do, mi
 * and sol follow it): a saw lead over an 80s pad and a sub bass, the drums coming in in the
 * second room, a square arpeggio in the third, the lead doubled an octave up in the top gear.
 */
export function keySong(room: number): Uint8Array {
  const shift = room * 2;
  const chords = [...POP_V, ...POP_V, ...POP_P, ...POP_C];
  const drums: Drum[] = [];
  if (room >= 1)
    drums.push(
      { patch: 'kick-punchy', grid: grid(32, room >= 3 ? 'x...x...x...x...' : 'x.......x.x.....'), vel: 85 },
      { patch: 'snare-tight', grid: grid(32, '....X.......X...'), vel: 70 },
    );
  if (room >= 2) drums.push({ patch: 'hat-closed', grid: grid(32, room >= 3 ? 'xxxxxxxxxxxxxxxx' : 'x.x.x.x.x.x.x.x.'), vel: 40 });
  if (room >= 3) drums.push({ patch: 'crash', grid: ['X...............', ...new Array<string>(31).fill('................')].join('|'), vel: 60 });
  const tune = bars(VERSE1, VERSE2, LIFT, CHORUS);
  return score(
    KEY_BEAT / 2,
    4,
    [
      { ch: 0, patch: 'lead-saw', notes: tune, vel: 85, shift },
      {
        ch: 1,
        patch: room >= 3 ? 'lead-bright' : 'lead-square',
        notes: room >= 3 ? tune : room >= 2 ? comp(chords, 4, 'Re 3e 5e 8e Re 3e 5e 8e', { bass: 'C4' }) : rep(32, 'rw'),
        vel: room >= 3 ? 45 : 40,
        shift: room >= 3 ? shift + 12 : shift,
      },
      { ch: 2, patch: 'sub-bass', notes: comp(chords, 4, room >= 1 ? 'Re Re 8e Re Re Re 8e Re' : 'Rh Rq. 5e', { bass: 'C2' }), vel: 90, shift },
      { ch: 3, patch: 'pad-80s', notes: comp(chords, 4, 'Xh Xh', { lo: 'G3' }), vel: 45, shift, legato: 0.97 },
    ],
    drums,
  );
}

// ---- the Instrument Panel: the radio

const BOSSA_A = ['Am7', 'Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7'];
const BOSSA_B = ['Dm7', 'G7', 'Cmaj7', 'Am7', 'Dm7', 'E7', 'Am7', 'E7'];
const STATION_A = bars('E5h. D5e C5e', 'B4q C5q E5h', 'F5h. E5e D5e', 'B4h. G4q', 'E5q G5q B5h', 'A5h. G5e F5e', 'D5q F5q A5q C6q', 'B5h G#5h');
const STATION_B = bars('A5q. F5e D5h', 'B5q. G5e F5h', 'E5w', 'rq C5q E5q A5q', 'F5h. A5q', 'G#5h. B5q', 'A5h E5h', 'G#5h B4h');

/** The Instrument Panel, the radio: a bossa nova in A minor coming in on the radio, a violin over nylon guitar (bass and chords), a harp's chimes; a beat a quarter of the needle's sweep. */
export function tuningSong(): Uint8Array {
  const chords = [...BOSSA_A, ...BOSSA_B, ...BOSSA_A, ...BOSSA_B];
  // the needle sweeps across and back in two bars
  const beat = (DIAL.cells * 2 * DIAL.ticks) / 8;
  return score(beat, 4, [
    { ch: 0, patch: 'violin', notes: bars(STATION_A, STATION_B, STATION_A, STATION_B), vel: 65 },
    { ch: 1, patch: 'harp-chime', notes: comp(chords, 4, 'rw | rh 5e 3e 8q | rw | rh. 5q', { bass: 'C5' }), vel: 40 },
    { ch: 2, patch: 'guitar-nylon', notes: comp(chords, 4, 'Rq. 5e Rq. 5e', { bass: 'E2' }), vel: 75 },
    { ch: 3, patch: 'guitar-steel', notes: comp(chords, 4, 'Xe Xe re Xe re Xe Xe re', { lo: 'G3' }), vel: 40 },
  ]);
}

// ---- the Instrument Panel: the choir swell

/** The hymn's chords (the gauges' own C, F and G among them), a bar each. */
const HYMN = ['C', 'Am', 'F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'F', 'C', 'G', 'Am', 'F', 'G', 'C', 'F', 'C', 'Dm', 'G', 'Am', 'F', 'G', 'C'];
const HYMN_TUNE = bars(
  'G5h E5q G5q',
  'A5h. C6q',
  'G5q E5q C5q E5q',
  'D5w',
  'E5q A5q C6q B5q',
  'A5h F5h',
  'G5q B5q D6q B5q',
  'C6w',
  'C6h A5q F5q',
  'G5h E5h',
  'F5q A5q D6q C6q',
  'B5h G5h',
  'C6h. B5q',
  'A5h C6h',
  'D6h. B5q',
  'C6w',
);
/** score.ts's notation in kit/songFx's ("C5q E5q" as "C5 q, E5 q"). */
const fxNotes = (s: string) =>
  s
    .replace(/\|/g, ' ')
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/([whqes]\.?)$/, ' $1'))
    .join(', ');

/**
 * The Instrument Panel, the gauges: the choir swell. Nine FM voices (every melodic channel, out of
 * rhythm mode) come in one by one, a bar apart, each pair a voice and its vibrato twin so they
 * beat like a section, all of them swelling louder by program changes; the ninth sings a hymn
 * over the top from the ninth bar. 24 bars, then round again.
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
  const tone = (ch: number, bar: number) => voicing(HYMN[bar], 'C3')[ch % 3] + 12 * Math.floor(ch / 3);
  const name = (n: number) => `${'C C# D Eb E F F# G Ab A Bb B'.split(' ')[n % 12]}${Math.floor(n / 12) - 1}`;
  for (let ch = 0; ch < 8; ch++) for (let bar = ch; bar < HYMN.length; bar++) fx.phrase(ch, bar * 4, `${name(tone(ch, bar))} w`, 70 + ch * 4);
  fx.phrase(8, 8 * 4, fxNotes(HYMN_TUNE), 100);
  // the swell: louder step by step as the voices come in
  fx.swell([0, 2, 4, 6], 0, 32, swellA);
  fx.swell([1, 3, 5, 7], 0, 32, swellB);
  return fx.cmf(HYMN.length);
}
