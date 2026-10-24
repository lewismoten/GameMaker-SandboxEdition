// A readable way to write an OPL2 two-operator patch (the 11 bytes of an SBI instrument that
// SBFMDRV loads), used by the preset lists (oplPresets.ts, oplDrumPresets.ts).
//
// Each operator is a few words, in register terms:
//   x1      frequency multiple (x0.5, x1 .. x10, x12, x15: the chip's 16 MULT steps)
//   tl20    total level, an attenuation in 0.75 dB steps (0 loudest .. 63 silent)
//   ar15    attack rate, dr4 decay rate, rr6 release rate (0 never .. 15 fastest)
//   sl5     sustain level, 3 dB steps down from the peak (0 = full .. 15 = silent)
//   hold    hold the sustain level while the key is down (EG type); without it the note
//           keeps fading at the release rate (pianos, plucks, bells)
//   w0..w3  waveform: sine, half sine, absolute sine ("bumps"), quarter sine ("pulses")
//   ksl1.5 / ksl3 / ksl6   key scale level in dB per octave (higher notes softer)
//   ksr     key scale rate (higher notes have quicker envelopes)
//   vib, trem   the chip's vibrato and tremolo
// The voice: fb0..fb7 (the modulator feeding back into itself, pure to buzzy) and `add`
// (both operators heard, organ-like) instead of FM (the modulator shapes the carrier).

const MULTS = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -1, 12, -1, 15];
const KSLS: Record<string, number> = { '0': 0, '1.5': 2, '3': 1, '6': 3 };

interface Op {
  char: number;
  level: number;
  ad: number;
  sr: number;
  wave: number;
}

function op(words: string): Op {
  let char = 0;
  let ksl = 0;
  let tl = 0;
  let ar = 15;
  let dr = 0;
  let sl = 0;
  let rr = 0;
  let wave = 0;
  let mult = 1;
  for (const w of words.trim().split(/\s+/).filter(Boolean)) {
    const m = /^([a-z]+)([\d.]*)$/.exec(w);
    if (!m) throw new Error(`Bad operator word "${w}"`);
    const [, k, v] = m;
    const n = Number(v);
    const nib = (x: number) => {
      if (!Number.isInteger(x) || x < 0 || x > 15) throw new Error(`"${w}" is out of range`);
      return x;
    };
    if (k === 'x') {
      mult = MULTS.indexOf(n);
      if (mult < 0 || v === '') throw new Error(`No multiple ${w}`);
    } else if (k === 'tl') {
      if (!Number.isInteger(n) || n < 0 || n > 63) throw new Error(`"${w}" is out of range`);
      tl = n;
    } else if (k === 'ar') ar = nib(n);
    else if (k === 'dr') dr = nib(n);
    else if (k === 'sl') sl = nib(n);
    else if (k === 'rr') rr = nib(n);
    else if (k === 'w') {
      if (!['0', '1', '2', '3'].includes(v)) throw new Error(`No waveform ${w}`);
      wave = n;
    } else if (k === 'ksl') {
      if (!(v in KSLS)) throw new Error(`No key scale ${w}`);
      ksl = KSLS[v];
    } else if (k === 'hold') char |= 0x20;
    else if (k === 'ksr') char |= 0x10;
    else if (k === 'vib') char |= 0x40;
    else if (k === 'trem') char |= 0x80;
    else throw new Error(`Bad operator word "${w}"`);
  }
  return { char: char | mult, level: (ksl << 6) | tl, ad: (ar << 4) | dr, sr: (sl << 4) | rr, wave };
}

/** A 16-byte SBI record from the modulator's words, the carrier's, and the voice's ("fb5", "fb2 add"). */
export function patch(modulator: string, carrier: string, voice = ''): Uint8Array {
  const m = op(modulator);
  const c = op(carrier);
  const fb = /fb(\d)/.exec(voice);
  const conn = /\badd\b/.test(voice) ? 1 : 0;
  const byte10 = ((fb ? Number(fb[1]) & 7 : 0) << 1) | conn;
  return Uint8Array.from([m.char, c.char, m.level, c.level, m.ad, c.ad, m.sr, c.sr, m.wave, c.wave, byte10, 0, 0, 0, 0, 0]);
}

/** Whether the first 11 bytes are a patch the chip and SBFMDRV take as written. */
export function validPatch(p: Uint8Array): boolean {
  return p.length >= 11 && p[8] <= 3 && p[9] <= 3 && p[10] <= 0x0f;
}

/** The first 11 bytes match (the rest of an SBI record is unused). */
export function samePatch(a: Uint8Array, b: Uint8Array): boolean {
  for (let i = 0; i < 11; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** The five drums of the chip's rhythm mode, by the MIDI channel that plays them (11..15). */
export type DrumSlot = 'bd' | 'sd' | 'tom' | 'cy' | 'hh';

/** How a preset is heard when previewed. */
export type PreviewKind = 'tune' | 'chord' | 'hits';

export interface OplPreset {
  /** Stable key (kebab case). */
  id: string;
  name: string;
  /** Group id (see PRESET_GROUPS in oplPresets.ts). */
  group: string;
  /** What it approximates, in a few words. */
  about: string;
  /** A 16-byte SBI record (bytes 11..15 unused). */
  patch: Uint8Array;
  /** The note it sounds best around (MIDI), and the note its preview plays. */
  key: number;
  play: PreviewKind;
  /** A rhythm-mode drum: the drum it is made for. */
  drum?: DrumSlot;
}

/** A helper for the lists: one preset. */
export function preset(group: string, id: string, name: string, key: number, play: PreviewKind, about: string, p: Uint8Array, drum?: DrumSlot): OplPreset {
  return { id, name, group, about, patch: p, key, play, drum };
}
