// The settings in an SBI instrument record that SBFMDRV loads into the OPL2 chip
// (bytes 0..10: two operators and the feedback/connection byte). Bytes 11..15 are unused
// by the driver and kept as they are.
import { INSTRUMENTS } from '../../audio/compose';

/** 0 = modulator (first operator), 1 = carrier (second operator). */
export type Half = 0 | 1;

export interface OpField {
  key: string;
  label: string;
  title: string;
  /** Byte index for the modulator (the carrier's is one more). */
  byte: number;
  shift: number;
  bits: number;
  /** Shown upside down (the chip stores attenuation, people think in loudness). */
  invert?: boolean;
}

const f = (key: string, label: string, title: string, byte: number, shift: number, bits: number, invert?: boolean): OpField => ({
  key,
  label,
  title,
  byte,
  shift,
  bits,
  invert,
});

/** Slider settings of one operator. */
export const ENVELOPE: OpField[] = [
  f('level', 'Level', 'How loud this operator is (for the first operator in FM mode: how much it colors the sound)', 2, 0, 6, true),
  f('attack', 'Attack', 'How fast the sound rises when a note starts', 4, 4, 4),
  f('decay', 'Decay', 'How fast it falls to the sustain level', 4, 0, 4),
  f('sustain', 'Sustain', 'The level it holds while the note is held', 6, 4, 4, true),
  f('release', 'Release', 'How fast it fades after the note ends', 6, 0, 4),
];

export const MULT = f('mult', 'Harmonic', 'Frequency multiple: which harmonic this operator plays', 0, 0, 4);
export const WAVE = f('wave', 'Wave', 'Wave shape', 8, 0, 2);
export const KSL = f('ksl', 'Key scale level', 'Higher notes get quieter', 2, 6, 2);

export const FLAGS: OpField[] = [
  f('hold', 'Hold', 'Hold at the sustain level while the note is held (off: fade even while held)', 0, 5, 1),
  f('tremolo', 'Tremolo', 'Wobble the volume', 0, 7, 1),
  f('vibrato', 'Vibrato', 'Wobble the pitch', 0, 6, 1),
  f('ksr', 'Faster high notes', 'Key scale rate: higher notes have quicker envelopes', 0, 4, 1),
];

export const MULT_VALUES = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 12, 12, 15, 15];
/** KSL register values in increasing dB/octave. */
export const KSL_CHOICES: [number, string][] = [
  [0, 'Off'],
  [2, '1.5 dB/oct'],
  [1, '3 dB/oct'],
  [3, '6 dB/oct'],
];

const max = (fl: OpField) => (1 << fl.bits) - 1;

export function getOp(inst: Uint8Array, fl: OpField, half: Half): number {
  const v = (inst[fl.byte + half] >> fl.shift) & max(fl);
  return fl.invert ? max(fl) - v : v;
}

export function setOp(inst: Uint8Array, fl: OpField, half: Half, value: number): void {
  const m = max(fl);
  let v = Math.max(0, Math.min(m, Math.round(value)));
  if (fl.invert) v = m - v;
  const i = fl.byte + half;
  inst[i] = (inst[i] & ~(m << fl.shift)) | (v << fl.shift);
}

export function maxOf(fl: OpField): number {
  return max(fl);
}

/** Feedback (0..7) of the first operator into itself. */
export const getFeedback = (inst: Uint8Array) => (inst[10] >> 1) & 7;
export const setFeedback = (inst: Uint8Array, v: number) => (inst[10] = (inst[10] & ~0x0e) | ((Math.max(0, Math.min(7, v)) & 7) << 1));
/** false: FM (the first operator shapes the second); true: both play (additive). */
export const getAdditive = (inst: Uint8Array) => (inst[10] & 1) === 1;
export const setAdditive = (inst: Uint8Array, v: boolean) => (inst[10] = (inst[10] & ~1) | (v ? 1 : 0));

export const PRESETS = INSTRUMENTS as Record<string, Uint8Array>;

/** The preset an instrument matches, if any. */
export function presetName(inst: Uint8Array): string | undefined {
  for (const [name, p] of Object.entries(PRESETS)) {
    let same = true;
    for (let i = 0; i < 11 && same; i++) same = p[i] === inst[i];
    if (same) return name;
  }
  return undefined;
}

/** A blank-ish instrument when a song has none. */
export function newInstrument(preset = 'piano'): Uint8Array {
  return (PRESETS[preset] ?? PRESETS.piano).slice();
}
