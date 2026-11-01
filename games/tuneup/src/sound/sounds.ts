// The sound sets. PLAYGAME picks a touch's sound slot by the kind of change (hit points up,
// money up, score up or down, a counter up or down), so a level that gives each of its notes a
// different kind of change makes the slots a keyboard (notes.ts: each slot holds a note of the
// level's own instrument), with a PC speaker tone of the same pitch for a PC without a Sound
// Blaster. Doc Leo's own noises (a hop, a reach, a jolt) stay on the PC speaker, so they never
// cut off a note or a bugle call.
import { newSoundSet, type SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER, speaker } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { SND } from '../ids';
import { hz, noteVoc, phraseVoc } from './notes';

export type Place = 'jump' | 'spark' | 'beat' | 'oil' | 'fan' | 'brake' | 'cups' | 'pump' | 'muffled';

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
  }
  return set;
}
