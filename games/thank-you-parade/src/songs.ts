// The parade's two added songs, written for this game on the kit's arranger (kit/song.ts), like the three in sound.ts:
//   rooftop.cmf  "Rooftop Polka": a quick polka in C on flute and piano, 168 beats a minute, an oom-pah bass and a
//                brush snare; the second strain climbs. Bakery Row and the Bleachers play it.
//   boss.cmf     "Fuse Lit": the Cannon Truck's theme, a driving A minor on brass over a stomping kick and a bass that
//                never lets up, ending on the dominant so it wants to start over.
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { FLUTE, Writer, type Groove } from '@lewismoten/gamemaker-sandbox-tools/kit/song';
import { play } from './sound';

export function rooftopSong(): Uint8Array {
  const w = new Writer(168);
  const polka: Groove = { k: 'x...x...', s: '..x...x.', h: 'xxxxxxxx' };
  const turn: Groove = { k: 'x...x...', s: '..X.xxxX', h: 'xxxxxxxx' };
  const band = {
    lead: FLUTE,
    second: 'double' as const,
    secondPatch: INSTRUMENTS.piano,
    secondVel: 52,
    bass: 'pump' as const,
    bassPatch: INSTRUMENTS.bass,
    bassVel: 100,
    comp: 'x e, r e, x e, r e, x e, r e, x e, r e',
    compPatch: INSTRUMENTS.piano,
    compVel: 46,
  };
  const grooves = [polka, polka, polka, polka, polka, polka, polka, turn];
  play(w, {
    ...band,
    chords: 'C | C | G7 | G7 | C | F | G7 | C',
    tune: [
      'E5 e, G5 e, C6 e, G5 e, E5 e, G5 e, C6 q',
      'C6 e, B5 e, A5 e, G5 e, E5 h',
      'D5 e, F5 e, B5 e, F5 e, D5 e, F5 e, B5 q',
      'B5 e, A5 e, G5 e, F5 e, D5 h',
      'E5 e, G5 e, C6 e, G5 e, E5 e, G5 e, C6 q',
      'F5 e, A5 e, C6 e, A5 e, F5 q, A5 q',
      'G5 e, B5 e, D6 e, B5 e, G5 e, F5 e, D5 q',
      'C6 q, G5 q, E5 q, C5 q',
    ].join(' | '),
    grooves,
    drumVel: 84,
  });
  play(w, {
    ...band,
    chords: 'F | F | C | C | G7 | G7 | C | C',
    tune: [
      'A5 q, r e, A5 e, C6 q, F6 q',
      'E6 e, D6 e, C6 e, A5 e, F5 h',
      'G5 q, r e, G5 e, C6 q, E6 q',
      'D6 e, C6 e, B5 e, G5 e, C6 h',
      'B5 q, r e, B5 e, D6 q, G6 q',
      'F6 e, E6 e, D6 e, B5 e, G5 h',
      'E6 e, C6 e, G5 e, C6 e, E6 q, C6 q',
      'C6 w',
    ].join(' | '),
    grooves,
    drumVel: 90,
  });
  return w.cmf();
}

export function bossSong(): Uint8Array {
  const w = new Writer(138);
  const stomp: Groove = { k: 'x.x.x.x.', s: '..X...X.', h: 'xxxxxxxx' };
  const crash: Groove = { k: 'x.x.x.x.', s: '..X.xXXX', c: 'X.......' };
  const band = {
    lead: INSTRUMENTS.brass,
    second: 'double' as const,
    secondPatch: INSTRUMENTS.brass,
    secondVel: 56,
    bass: 'eighths' as const,
    bassPatch: INSTRUMENTS.bass,
    bassVel: 110,
    comp: 'x e, r e, x e, r e, x e, r e, x e, r e',
    compPatch: INSTRUMENTS.strings,
    compVel: 44,
  };
  const grooves = [stomp, stomp, stomp, stomp, stomp, stomp, stomp, crash];
  const A = [
    'A4 e, A4 e, C5 e, A4 e, E5 q, D5 q',
    'C5 e, C5 e, E5 e, C5 e, A5 h',
    'A4 e, A4 e, F5 e, A4 e, C6 q, A5 q',
    'G#4 e, B4 e, E5 e, G#5 e, B5 h',
    'A4 e, A4 e, C5 e, A4 e, E5 q, D5 q',
    'C5 e, E5 e, A5 e, E5 e, C6 q, A5 q',
    'D5 q, F5 q, G#5 q, B5 q',
    'A5 w',
  ].join(' | ');
  play(w, { ...band, chords: 'Am | Am | F | E | Am | Am | Dm E | Am', tune: A, grooves, drumVel: 100 });
  play(w, {
    ...band,
    chords: 'Am | Am | F | E | Am | Am | Dm E | E',
    tune: [
      'E6 q, r e, E6 e, C6 q, A5 q',
      'E6 q, r e, E6 e, D6 q, B5 q',
      'F6 q, r e, F6 e, C6 q, A5 q',
      'E6 e, D6 e, B5 e, G#5 e, E5 h',
      'E6 q, r e, E6 e, C6 q, A5 q',
      'A5 e, C6 e, E6 e, A6 e, E6 q, C6 q',
      'D6 q, F6 q, G#6 q, B6 q',
      'E6 w',
    ].join(' | '),
    grooves,
    drumVel: 104,
  });
  return w.cmf();
}
