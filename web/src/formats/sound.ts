// .snd files: 30 PC speaker effects (36 frequencies each, one per 1/145.6 s timer tick)
// followed by 30 Sound Blaster .voc names (9 bytes each, no extension). See code/GM/SOUND.H.
import { Reader, Writer } from './binary';

export const LASTSND = 30;
export const NUMFREQ = 36;
export const SND_FILE_SIZE = LASTSND * NUMFREQ * 2 + LASTSND * 9;

export const SOUND_NAMES = [
  'Help (hit points up)',
  'Kill monster',
  'Add money',
  'Subtract money',
  'Add life',
  'Add score',
  'Subtract score',
  'Add other counter',
  'Subtract other counter',
];

export interface SoundSet {
  /** freqs[n] has NUMFREQ frequencies in Hz (0 = silence). */
  freqs: Uint16Array[];
  /** Digital .voc file name (without extension) for each effect, '' = use PC speaker. */
  digital: string[];
  digitalRaw: Uint8Array[];
}

export function parseSoundSet(bytes: Uint8Array): SoundSet {
  const r = new Reader(bytes);
  const freqs: Uint16Array[] = [];
  for (let i = 0; i < LASTSND; i++) {
    const f = new Uint16Array(NUMFREQ);
    for (let j = 0; j < NUMFREQ; j++) f[j] = r.u16();
    freqs.push(f);
  }
  const digitalRaw: Uint8Array[] = [];
  for (let i = 0; i < LASTSND; i++) digitalRaw.push(r.bytesOf(9));
  const digital = digitalRaw.map((raw) => new Reader(raw).cstr(9));
  return { freqs, digital, digitalRaw };
}

export function serializeSoundSet(s: SoundSet): Uint8Array {
  const w = new Writer(SND_FILE_SIZE);
  for (const f of s.freqs) for (let j = 0; j < NUMFREQ; j++) w.u16(f[j] ?? 0);
  s.digital.forEach((name, i) => w.cstrOver(name, s.digitalRaw[i], 9));
  return w.toBytes();
}

export function newSoundSet(): SoundSet {
  return {
    freqs: Array.from({ length: LASTSND }, () => new Uint16Array(NUMFREQ)),
    digital: new Array(LASTSND).fill(''),
    digitalRaw: Array.from({ length: LASTSND }, () => new Uint8Array(9)),
  };
}
