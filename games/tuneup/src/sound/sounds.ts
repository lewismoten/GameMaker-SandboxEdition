// The sound sets. Teddy's own noises are the trilogy's (kit/teddySounds.ts: a yelp when he's
// bumped, a pop for a hop, a woof for a boop). The rest are notes: PLAYGAME picks a touch's
// sound slot by the kind of change (hit points up, money up, score up or down, a counter up or
// down), so giving each note block a different kind of change makes the slots a keyboard, each
// key a note of the neighborhood's own instrument (notes.ts), with a PC speaker tone of the
// same pitch for a PC without a Sound Blaster.
import { newSoundSet, type SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER, speaker } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { boing, honk, pop, woof, yelp } from '../../../kit/teddySounds';
import { SND } from '../ids';
import { TICK_TOCK } from '../../../kit/tinHeart';
import { arpVoc, hz, noteVoc } from './notes';

export type Place = 'shop' | 'rail' | 'band' | 'strings' | 'arcade' | 'rink' | 'field' | 'woods' | 'choir' | 'basement' | 'clock';

/** A held PC speaker tone at a pitch, short (about a sixth of a second) and then quiet. */
const tone = (name: string, steps = 24) => speaker((i) => (i < steps ? hz(name) : 0));

/** The piano stairs' scale, slot by slot (each slot's kind of change is the stairs' block). */
export const STAIR_NOTES: [number, string][] = [
  [SND.help, 'C5'],
  [SND.money, 'D5'],
  [SND.score, 'E5'],
  [SND.lose, 'F5'],
  [SND.gain, 'G5'],
  [SND.spend, 'A5'],
];
/** The strings' scale for the plucked springs and the instruments: a harp's. */
export const HARP_NOTES: [number, string][] = [
  [SND.help, 'D5'],
  [SND.money, 'E5'],
  [SND.score, 'F#5'],
  [SND.lose, 'A5'],
  [SND.gain, 'B5'],
  [SND.spend, 'D6'],
];
/** The arcade's notes: a chord each, broken upward on a square lead (the speaker plays it too). */
export const ARCADE_CHORDS: [number, string[]][] = [
  [SND.help, ['C5', 'E5', 'G5', 'C6']],
  [SND.money, ['D5', 'F5', 'A5', 'D6']],
  [SND.score, ['E5', 'G5', 'B5', 'E6']],
  [SND.lose, ['F5', 'A5', 'C6', 'F6']],
  [SND.gain, ['G5', 'B5', 'D6', 'G6']],
  [SND.spend, ['A5', 'C6', 'E6', 'A6']],
];
/** The Player Piano's two lanes: the low key rings slot 7 (a hit), the high one slot 0 (hit points and a hit). */
export const RAIL_LOW = 'C5';
/** The marching field's lines: the low three ring a horn (a hit), the high two a trumpet (hit points and a hit). */
export const FIELD_LOW = 'G4';
export const FIELD_HIGH = 'C5';
/** The woods' staff doors: a low hollow note (and a wind found) rings a flute's C, a high one its G. */
export const WOODS_LOW = 'C5';
export const WOODS_HIGH = 'G5';
export const RAIL_HIGH = 'G5';
/** The choir loft's hymn notes, sung "aah" (a voice found sings F, the door G); the rail blooms a chord. */
export const CHOIR_NOTES: [number, string][] = [
  [SND.help, 'C5'],
  [SND.money, 'D5'],
  [SND.lose, 'E5'],
  [SND.gain, 'F5'],
  [SND.spend, 'G5'],
];
export const CHOIR_BLOOM = '[C4 E4 G4 C5]';
/** The basement's notes, plucked on a slap bass (a bass found plays G, the door the high C). */
/** The clock tower's notes on a glockenspiel (a mallet found rings G, the door the high C). */
export const GLOCK_NOTES: [number, string][] = [
  [SND.help, 'C6'],
  [SND.money, 'E6'],
  [SND.gain, 'G6'],
  [SND.spend, 'C7'],
];
export const BASS_NOTES: [number, string][] = [
  [SND.help, 'C3'],
  [SND.money, 'E3'],
  [SND.gain, 'G3'],
  [SND.spend, 'C4'],
];

/** Every VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const v: Record<string, Uint8Array> = {};
  for (const [, n] of STAIR_NOTES) v[`pn${n.toLowerCase().replace('#', 's')}`] = noteVoc('piano-bright', n, 0.6, 0.35);
  for (const [, n] of HARP_NOTES) v[`hp${n.toLowerCase().replace('#', 's')}`] = noteVoc('harp', n, 0.6, 0.35);
  ARCADE_CHORDS.forEach(([, ch], i) => (v[`arp${i}`] = arpVoc('lead-square', ch, 0.5)));
  for (const [, n] of STAIR_NOTES) v[vocName('tw', n)] = noteVoc('tonewheel', n, 0.6, 0.35);
  for (const [, n] of CHOIR_NOTES) v[vocName('ah', n)] = noteVoc('aah', n, 0.7, 0.45);
  v.bloom = noteVoc('choir', CHOIR_BLOOM, 1.6, 1.1);
  for (const [, n] of BASS_NOTES) v[vocName('sb', n)] = noteVoc('slap-bass', n, 0.5, 0.3);
  for (const [, n] of GLOCK_NOTES) v[vocName('gl', n)] = noteVoc('glockenspiel', n, 0.6, 0.3);
  v.woodslo = noteVoc('flute', WOODS_LOW, 0.6, 0.35);
  v.woodshi = noteVoc('flute', WOODS_HIGH, 0.6, 0.35);
  v.fieldlo = noteVoc('horn', FIELD_LOW, 0.35, 0.22);
  v.fieldhi = noteVoc('trumpet', FIELD_HIGH, 0.35, 0.22);
  v.railhi = noteVoc('piano-bright', RAIL_HIGH, 0.35, 0.22);
  v.raillo = noteVoc('piano-bright', RAIL_LOW, 0.35, 0.22);
  v.clunk = noteVoc('melodic-kick', 'C3', 0.18, 0.08);
  v.tada = noteVoc('glockenspiel', '[C6 E6 G6]', 0.8, 0.4);
  v.fanfare = noteVoc('trumpet', '[G4 C5 E5]', 0.7, 0.4);
  v.woof = woof(330, 0.2);
  v.yelp = yelp();
  v.pop = pop();
  v.boing = boing();
  v.honk = honk();
  return v;
}

const vocName = (prefix: string, n: string) => `${prefix}${n.toLowerCase().replace('#', 's')}`;

/** A level's .SND: which VOC each slot plays, and its PC speaker sound. */
export function buildSoundSet(place: Place): SoundSet {
  const set = newSoundSet();
  const add = (n: number, name: string, freqs: Uint16Array) => {
    set.freqs[n] = freqs;
    set.digital[n] = name;
  };
  add(SND.kill, 'pop', SPEAKER.chirp());
  add(SND.life, 'tada', SPEAKER.arpeggio([523, 659, 784, 1047]));
  add(
    SND.hop,
    'pop',
    speaker((i) => (i < 5 ? 500 + i * 80 : 0)),
  );
  add(SND.hurt, 'yelp', SPEAKER.warble(700, 120, 2.4));
  add(SND.faint, 'yelp', SPEAKER.fall(700, 150));
  add(
    SND.boop,
    'woof',
    speaker((i) => (i < 4 ? 300 : 0)),
  );
  if (place === 'shop' || place === 'strings' || place === 'rink') {
    const [prefix, scale] = place === 'shop' ? ['pn', STAIR_NOTES] : place === 'rink' ? ['tw', STAIR_NOTES] : ['hp', HARP_NOTES];
    for (const [slot, n] of scale) add(slot, vocName(prefix, n), tone(n));
  } else if (place === 'arcade') {
    ARCADE_CHORDS.forEach(([slot, ch], i) => add(slot, `arp${i}`, SPEAKER.arpeggio(ch.map(hz))));
  } else if (place === 'choir' || place === 'basement') {
    const [prefix, scale] = place === 'choir' ? ['ah', CHOIR_NOTES] : ['sb', BASS_NOTES];
    for (const [slot, n] of scale) add(slot, vocName(prefix, n), tone(n));
    if (place === 'choir') add(SND.score, 'bloom', SPEAKER.arpeggio([262, 330, 392, 523]));
  } else if (place === 'clock') {
    for (const [slot, n] of GLOCK_NOTES) add(slot, vocName('gl', n), tone(n));
    // the tin heart's tick-tock: score up, on the speaker only (never a .VOC)
    add(SND.score, '', TICK_TOCK());
  } else if (place === 'woods') {
    add(SND.gain, 'woodslo', tone(WOODS_LOW));
    add(SND.help, 'woodshi', tone(WOODS_HIGH));
    add(
      SND.spend,
      'clunk',
      speaker((i) => (i < 4 ? 110 : 0)),
    );
    add(SND.score, 'tada', SPEAKER.arpeggio([523, 659, 784, 1047]));
  } else if (place === 'field') {
    add(SND.gain, 'fieldlo', tone(FIELD_LOW, 12));
    add(SND.help, 'fieldhi', tone(FIELD_HIGH, 12));
    add(
      SND.spend,
      'clunk',
      speaker((i) => (i < 4 ? 110 : 0)),
    );
    add(SND.score, 'tada', SPEAKER.arpeggio([523, 659, 784]));
  } else if (place === 'rail') {
    add(SND.gain, 'raillo', tone(RAIL_LOW, 12));
    add(SND.help, 'railhi', tone(RAIL_HIGH, 12));
    add(
      SND.spend,
      'clunk',
      speaker((i) => (i < 4 ? 110 : 0)),
    );
    add(SND.score, 'tada', SPEAKER.arpeggio([523, 659, 784]));
  } else {
    // the bandstand: an instrument set on its stand rings a bell chord; the band's way on is a fanfare
    add(SND.gain, 'tada', SPEAKER.arpeggio([523, 659, 784, 1047]));
    add(SND.spend, 'fanfare', SPEAKER.arpeggio([392, 523, 659]));
    add(SND.score, 'honk', SPEAKER.chirp());
  }
  return set;
}
