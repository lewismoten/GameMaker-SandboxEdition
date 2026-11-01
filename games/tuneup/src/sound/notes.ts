// One note of a preset as a digitized .VOC: a one-note song played through the engine's own
// OPL2 emulator and CMF sequencer (as PLAYGAME plays songs), cut to length with a short fade
// and raised to a steady level. This is how a sound slot becomes a key on a keyboard: each
// slot holds the note of its pitch in the neighborhood's own instrument.
import { CmfPlayer, TICK_RATE } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfPlayer';
import { Opl2 } from '@lewismoten/gamemaker-sandbox-engine/audio/opl';
import { parseCmf } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { encodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { song } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { presetById } from '../../../../web/src/audio/oplPresets';

const RATE = 11025;

/** The preset's sound for a song (its 16-byte instrument). */
export function patchOf(id: string): Uint8Array {
  const p = presetById(id);
  if (!p) throw new Error(`No preset ${id}`);
  return p.patch;
}

/** `seconds` of the OPL2 playing `cmf`. */
function render(cmf: Uint8Array, seconds: number): Float32Array {
  const { music, instruments } = parseCmf(cmf);
  const opl = new Opl2(RATE);
  const player = new CmfPlayer(opl);
  player.load(music, instruments);
  const out = new Float32Array(Math.ceil(seconds * RATE));
  const perTick = RATE / TICK_RATE;
  let done = 0;
  let next = 0;
  while (done < out.length) {
    player.tick();
    next += perTick;
    const n = Math.min(out.length, Math.round(next)) - done;
    if (n > 0) opl.render(out.subarray(done, done + n));
    done += Math.max(0, n);
  }
  return out;
}

/** Notes (one or a chord) held `hold` seconds, as a VOC `seconds` long. */
export function noteVoc(id: string, notes: string, seconds: number, hold = seconds * 0.7): Uint8Array {
  // a beat as long as the hold: 146 CMF ticks a second
  const bpm = 60 / hold;
  const x = render(song(bpm, [{ channel: 0, instrument: patchOf(id), notes: `${notes} q, r q` }]), seconds);
  return level(x);
}

/** Raised to a steady level, with a short fade at the end, as a VOC. */
function level(x: Float32Array): Uint8Array {
  let peak = 0;
  for (const s of x) peak = Math.max(peak, Math.abs(s));
  const gain = peak > 0 ? 0.85 / peak : 0;
  const fade = Math.round(0.04 * RATE);
  for (let i = 0; i < x.length; i++) x[i] *= gain * Math.min(1, (x.length - i) / fade);
  return encodeVoc(x, RATE);
}

/** A broken chord: `notes` one after another, `step` seconds each, ringing on, as a VOC `seconds` long. */
export function arpVoc(id: string, notes: string[], seconds: number, step = 0.07): Uint8Array {
  // an eighth as long as a step: 146 CMF ticks a second
  const bpm = 60 / (2 * step);
  const x = render(song(bpm, [{ channel: 0, instrument: patchOf(id), notes: notes.map((n) => `${n} e`).join(', ') + ', r h' }]), seconds);
  return level(x);
}

/** A note name's frequency (A4 = 440). */
export function hz(name: string): number {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) throw new Error(`Bad note ${name}`);
  const semis = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]]! + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * 2 ** (semis / 12);
}
