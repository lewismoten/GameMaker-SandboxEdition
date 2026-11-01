// The sound sets. PLAYGAME picks a touch's sound slot by the kind of change (hit points up,
// money up, score up or down, a counter up or down), so a level that gives each of its notes a
// different kind of change makes the slots a keyboard (notes.ts: each slot holds a note of the
// level's own instrument), with a PC speaker tone of the same pitch for a PC without a Sound
// Blaster. Doc Leo's own noises (a hop, a reach, a jolt) stay on the PC speaker, so they never
// cut off a note or a bugle call.
import { newSoundSet, type SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER, speaker } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { SND } from '../ids';
import { hz, noteVoc, phraseVoc, slideWhistleVoc } from './notes';

export type Place =
  'jump' | 'spark' | 'beat' | 'oil' | 'fan' | 'brake' | 'cups' | 'pump' | 'muffled' | 'rain' | 'horn' | 'key1' | 'key2' | 'key3' | 'key4' | 'panel1' | 'panel2';

/** "Charge!": the bugle call on a trumpet (the last note held). */
const CHARGE: [string, string[], number] = ['trumpet', ['G4', 'C5', 'E5', 'G5', 'E5', 'G5'], 0.11];
/** A clamp clipped on: a bright little phrase. */
const CLAMP: [string, string[], number] = ['glockenspiel', ['C6', 'G6'], 0.08];
/** Spark Plucks: the four plugs' harp notes, slot by slot (the parade tune's opening, C E G E). */
export const PLUG_NOTES: [number, string][] = [
  [SND.help, 'C5'],
  [SND.gain, 'E5'],
  [SND.money, 'G5'],
];
/** The Timing Beat: the four lanes' piano notes (the fourth, points only, rings the speaker alone). */
export const LANE_NOTES: [number, string][] = [
  [SND.help, 'C5'],
  [SND.gain, 'E5'],
  [SND.money, 'G5'],
];
const LANE_D = 'C6';
/** The Rain Delay: the raindrops' tongue drum notes in D major, slot by slot (by the drop's kind of change). */
export const DROP_NOTES: [number, string][] = [
  [SND.help, 'D5'],
  [SND.money, 'F#5'],
  [SND.gain, 'A5'],
  [SND.score, 'B5'],
];
/** The Horn Section: the four pads' kazoo notes (C, E, G, high C), slot by slot (by the pad's kind of change). */
export const PAD_NOTES: [number, string][] = [
  [SND.help, 'C5'],
  [SND.money, 'E5'],
  [SND.gain, 'G5'],
  [SND.score, 'C6'],
];
/** Key Change: each room's phrase (do, mi, sol), a whole step higher room by room, by the note's kind of change. */
export const KEY_NOTES: string[][] = [
  ['C5', 'E5', 'G5'],
  ['D5', 'F#5', 'A5'],
  ['E5', 'G#5', 'B5'],
  ['F#5', 'A#5', 'C#6'],
];
const KEY_SLOTS = [SND.help, SND.money, SND.gain];
/** Oil's Well: the oil can's five lines, bottom to top, a note each. */
export const OIL_NOTES = ['C5', 'D5', 'E5', 'G5', 'A5'];

/** A held PC speaker tone at a pitch, short (about a sixth of a second) and then quiet. */
const tone = (name: string, steps = 24) => speaker((i) => (i < steps ? hz(name) : 0));
const vocName = (prefix: string, n: string) => `${prefix}${n.toLowerCase().replace('#', 's')}`;
const thud = () => speaker((i) => (i < 3 ? 120 : 0));

/** Every .VOC the game plays. */
export function buildVocs(): Record<string, Uint8Array> {
  const v: Record<string, Uint8Array> = {};
  v.charge = phraseVoc(...CHARGE, 0.6);
  v.clamp = phraseVoc(...CLAMP, 0.3);
  v.clunk = noteVoc('melodic-kick', 'C3', 0.18, 0.08);
  for (const [, n] of PLUG_NOTES) v[vocName('hp', n)] = noteVoc('harp', n, 0.6, 0.35);
  for (const [, n] of LANE_NOTES) v[vocName('pn', n)] = noteVoc('piano-bright', n, 0.35, 0.22);
  OIL_NOTES.forEach((n) => (v[vocName('oil', n)] = noteVoc('pizzicato', n, 0.3, 0.15)));
  v.home = phraseVoc('celesta', ['E6', 'G6', 'C7'], 0.06, 0.3);
  // the real tune-up: a fan joining the band, a brake lamp lit, the magician's "ta-da", a full tire, the tapes
  v.fanon = phraseVoc('kazoo', ['C5', 'E5', 'G5'], 0.08, 0.3);
  v.lamp = phraseVoc('glockenspiel', ['G5', 'C6', 'E6'], 0.06, 0.3);
  v.tada = phraseVoc('trumpet', ['G4', 'C5'], 0.14, 0.5);
  v.psi = phraseVoc('combo-organ', ['C5', 'E5', 'G5', 'C6'], 0.07, 0.4);
  v.tapes = phraseVoc('music-box', ['E5', 'G5', 'C6'], 0.1, 0.4);
  // sliding down the full tire: a slide whistle, falling (synthesized)
  v.slide = slideWhistleVoc(1600, 520, 0.7);
  for (const [, n] of DROP_NOTES) v[vocName('td', n)] = noteVoc('steel-drum', n, 0.45, 0.2);
  for (const [, n] of PAD_NOTES) v[vocName('kz', n)] = noteVoc('kazoo', n, 0.4, 0.3);
  for (const n of new Set(KEY_NOTES.flat())) v[vocName('vb', n)] = noteVoc('vibes-wobbly', n, 0.5, 0.3);
  // the radio's stations coming in (the last, the choir's "aah"), the gauges' chords, the radio in
  v.st1 = phraseVoc('piano-bright', ['C5', 'E5', 'G5', 'E5'], 0.1, 0.3);
  v.st2 = phraseVoc('trumpet', ['F5', 'A5', 'G5'], 0.12, 0.3);
  v.aah = noteVoc('aah', '[C4 E4 G4 C5]', 1.6, 1.3);
  v.chordc = noteVoc('choir', '[C4 E4 G4]', 0.9, 0.7);
  v.chordf = noteVoc('choir', '[C4 F4 A4]', 0.9, 0.7);
  v.chordg = noteVoc('choir', '[B3 D4 G4]', 0.9, 0.7);
  v.radio = phraseVoc('music-box', ['C5', 'E5', 'G5', 'E5', 'F5', 'A5', 'G5'], 0.12, 0.5);
  // a wrong horn pad: a raspberry, a low kazoo blat sagging down
  v.razz = phraseVoc('kazoo', ['E3', 'D3', 'C3', 'A2'], 0.07, 0.15);
  return v;
}

/** A level's .SND: which VOC each slot plays, and its PC speaker sound. */
export function buildSoundSet(place: Place): SoundSet {
  const set = newSoundSet();
  const add = (n: number, name: string, freqs: Uint16Array) => {
    set.freqs[n] = freqs;
    set.digital[n] = name;
  };
  add(SND.kill, '', SPEAKER.chirp());
  add(SND.life, '', SPEAKER.arpeggio([523, 659, 784, 1047]));
  add(
    SND.hop,
    '',
    speaker((i) => (i < 4 ? 400 + i * 90 : 0)),
  );
  add(SND.hurt, '', SPEAKER.warble(900, 160, 2.4));
  add(SND.faint, '', SPEAKER.fall(700, 150));
  add(
    SND.boop,
    '',
    speaker((i) => (i < 2 ? 260 : 0)),
  );
  add(SND.spend, 'clunk', thud());
  if (place === 'jump') {
    add(SND.help, 'charge', SPEAKER.arpeggio(CHARGE[1].map(hz)));
    add(SND.gain, 'clamp', SPEAKER.arpeggio(CLAMP[1].map(hz)));
    // a notch of the crank: a ratchet's click, on the speaker
    add(
      SND.score,
      '',
      speaker((i) => (i < 2 ? 1800 - i * 600 : 0)),
    );
  } else if (place === 'spark') {
    for (const [slot, n] of PLUG_NOTES) add(slot, vocName('hp', n), tone(n));
  } else if (place === 'beat') {
    for (const [slot, n] of LANE_NOTES) add(slot, vocName('pn', n), tone(n, 12));
    // the fourth lane (points only) on the speaker alone, a layer under the FM band; so is the tin heart's tick
    add(SND.score, '', tone(LANE_D, 12));
    // a boop on an unlit key: a dull thud
    add(SND.lose, '', thud());
    add(SND.tip, '', thud());
    add(SND.spend, '', thud());
  } else if (place === 'oil') {
    OIL_NOTES.forEach((n, i) => add(SND.oil0 + i, vocName('oil', n), tone(n, 10)));
    add(SND.gain, 'home', SPEAKER.arpeggio([1319, 1568, 2093]));
  } else if (place === 'fan') {
    add(SND.gain, 'fanon', SPEAKER.arpeggio([523, 659, 784]));
  } else if (place === 'brake') {
    // each trick's whoosh on the speaker, a step higher up the ladder; a lamp lit
    for (let k = 0; k < 4; k++)
      add(
        SND.trick0 + k,
        '',
        speaker((i) => (i < 6 ? 300 + k * 120 + i * 60 : 0)),
      );
    add(SND.gain, 'lamp', SPEAKER.arpeggio([784, 1047, 1319]));
  } else if (place === 'cups') {
    add(SND.gain, 'tada', SPEAKER.arpeggio([392, 523]));
  } else if (place === 'pump') {
    // a stroke of the pump (and a balloon puffed): a rising squeak
    add(
      SND.score,
      '',
      speaker((i) => (i < 4 ? 900 + i * 250 : 0)),
    );
    add(SND.gain, 'psi', SPEAKER.arpeggio([523, 659, 784, 1047]));
    // off the full tire and down its side: the slide whistle
    add(SND.help, 'slide', SPEAKER.fall(1600, 520));
  } else if (place === 'muffled') {
    // a squeaky toy (energy down: Teddy's hurt sound), a blanket tucked (energy up), the tapes
    add(
      SND.hurt,
      '',
      speaker((i) => (i < 5 ? 1600 + (i % 2) * 500 : 0)),
    );
    add(
      SND.help,
      '',
      speaker((i) => (i < 4 ? 200 - i * 20 : 0)),
    );
    add(SND.gain, 'tapes', SPEAKER.arpeggio([659, 784, 1047]));
  } else if (place === 'horn') {
    for (const [slot, n] of PAD_NOTES) add(slot, vocName('kz', n), tone(n, 12));
    add(
      SND.lose,
      'razz',
      speaker((i) => (i < 8 ? 110 - i * 6 + (i % 2) * 30 : 0)),
    );
  } else if (place.startsWith('key')) {
    KEY_NOTES[Number(place.slice(3)) - 1].forEach((n, i) => add(KEY_SLOTS[i], vocName('vb', n), tone(n, 12)));
  } else if (place === 'panel1') {
    add(SND.help, 'st1', SPEAKER.arpeggio([523, 659, 784, 659]));
    add(SND.money, 'st2', SPEAKER.arpeggio([698, 880, 784]));
    add(SND.gain, 'aah', SPEAKER.arpeggio([262, 330, 392, 523]));
    // a hop into a dark preset: a crackle of static, on the speaker
    add(
      SND.lose,
      '',
      speaker((i) => (i < 3 ? [1900, 700, 2600][i] : 0)),
    );
  } else if (place === 'panel2') {
    add(SND.help, 'chordc', SPEAKER.arpeggio([262, 330, 392]));
    add(SND.money, 'chordf', SPEAKER.arpeggio([262, 349, 440]));
    add(SND.score, 'chordg', SPEAKER.arpeggio([247, 294, 392]));
    add(SND.gain, 'radio', SPEAKER.arpeggio([523, 659, 784, 659, 698, 880, 784]));
  } else if (place === 'rain') {
    for (const [slot, n] of DROP_NOTES) add(slot, vocName('td', n), tone(n, 10));
    // a wet slap from a wiper blade (Doc Leo's hurt sound): a smack, on the speaker
    add(
      SND.hurt,
      '',
      speaker((i) => (i < 3 ? 180 - i * 40 : 0)),
    );
  }
  return set;
}
