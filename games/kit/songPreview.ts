// Renders songs through the web app's own OPL2 emulator and CMF sequencer (as PLAYGAME plays
// them, TICK_RATE ticks a second) into WAV files, and checks each: parseCmf reads it back, it
// fits in 20 KB, it turns rhythm mode on before any note, every note on has its note off, the
// render isn't silent and the drums sound. A game's tools/songPreview.ts lists its songs:
//   cd web && npx vite-node ../games/<id>/tools/songPreview.ts [outDir] [--loops N]
// Writes <outDir>/<name>.wav (22050 Hz mono, 16 bit) and <outDir>/songs.json (sizes, lengths,
// levels), and prints each render's strongest pitch classes (compare one with the recording:
// python3 -I games/<id>/tools/analyze.py --compare <outDir>/title.wav).
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CmfPlayer, TICK_RATE } from '../../web/src/audio/cmfPlayer';
import { Opl2 } from '../../web/src/audio/opl';
import { parseCmf } from '../../web/src/formats/cmf';

const RATE = 22050;

/** Reads the event stream back (delta, status, data) as the sequencer does, for the checks. */
function events(music: Uint8Array): { tick: number; data: number[] }[] {
  const list: { tick: number; data: number[] }[] = [];
  let p = 0;
  let tick = 0;
  let status = 0;
  const varLen = () => {
    let v = 0;
    let c: number;
    do {
      c = music[p++];
      v = (v << 7) | (c & 0x7f);
    } while (c & 0x80);
    return v;
  };
  while (p < music.length) {
    tick += varLen();
    if (music[p] & 0x80) status = music[p++];
    if (status === 0xff) break;
    const size = (status & 0xf0) === 0xc0 || (status & 0xf0) === 0xd0 ? 1 : 2;
    list.push({ tick, data: [status, ...music.subarray(p, p + size)] });
    p += size;
  }
  return list;
}

function wav(samples: Float32Array): Uint8Array {
  const b = new Uint8Array(44 + samples.length * 2);
  const dv = new DataView(b.buffer);
  const s = (o: number, t: string) => [...t].forEach((c, i) => (b[o + i] = c.charCodeAt(0)));
  s(0, 'RIFF');
  dv.setUint32(4, 36 + samples.length * 2, true);
  s(8, 'WAVEfmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, RATE, true);
  dv.setUint32(28, RATE * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  s(36, 'data');
  dv.setUint32(40, samples.length * 2, true);
  samples.forEach((v, i) => dv.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(v * 32767))), true));
  return b;
}

/** Plays the song through the port's sequencer and OPL2, `seconds` long; also returns the time the drums' key bits were set. */
function render(bytes: Uint8Array, seconds: number): { samples: Float32Array; drumKeys: number } {
  const cmf = parseCmf(bytes);
  const opl = new Opl2(RATE);
  const player = new CmfPlayer(opl);
  player.load(cmf.music, cmf.instruments);
  const samples = new Float32Array(Math.ceil(seconds * RATE));
  const perTick = RATE / TICK_RATE;
  let done = 0;
  let next = 0;
  let drumKeys = 0;
  while (done < samples.length) {
    player.tick();
    if (opl.read(0xbd) & 0x20 && opl.read(0xbd) & 0x1f) drumKeys++;
    next += perTick;
    const n = Math.min(samples.length, Math.round(next)) - done;
    if (n > 0) opl.render(samples.subarray(done, done + n));
    done += Math.max(0, n);
  }
  return { samples, drumKeys };
}

const NAMES = 'C C# D D# E F F# G G# A A# B'.split(' ');
/** Pitch-class energy of a render (Goertzel at every semitone from C2 to B5). */
function chroma(x: Float32Array): number[] {
  const pcs = new Array(12).fill(0);
  const step = 1;
  for (let m = 36; m < 84; m++) {
    const w = (2 * Math.PI * 440 * 2 ** ((m - 69) / 12) * step) / RATE;
    const c = 2 * Math.cos(w);
    let s1 = 0;
    let s2 = 0;
    for (let i = 0; i < x.length; i += step) {
      const s0 = x[i] + c * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    pcs[m % 12] += Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - c * s1 * s2));
  }
  const max = Math.max(...pcs);
  return pcs.map((v) => v / max);
}

/** Renders and checks `songs`; the command line gives the folder (default $TMPDIR/<name>-audio) and --loops. Sets a failing exit code on any problem. */
export function previewSongs(game: string, songs: [string, Uint8Array][]): void {
  const args = process.argv.slice(2);
  const loopsAt = args.indexOf('--loops');
  const loops = loopsAt >= 0 ? Number(args.splice(loopsAt, 2)[1]) : 1;
  const out = args[0] ?? join(tmpdir(), `${game}-audio`);
  mkdirSync(out, { recursive: true });
  const report: Record<string, unknown>[] = [];
  let failed = false;
  for (const [name, bytes] of songs) {
    const cmf = parseCmf(bytes);
    const ev = events(cmf.music);
    const ticks = ev.length ? ev[ev.length - 1].tick : 0;
    const seconds = ticks / TICK_RATE;
    const problems: string[] = [];
    if (bytes.length >= 20000) problems.push(`${bytes.length} bytes`);
    if (cmf.clockTicks !== 146) problems.push(`clock ${cmf.clockTicks}`);
    const firstNote = ev.findIndex((e) => (e.data[0] & 0xf0) === 0x90);
    const mode = ev.findIndex((e) => e.data[0] === 0xb0 && e.data[1] === 0x67 && e.data[2] === 1);
    if (mode < 0 || mode > firstNote) problems.push('rhythm mode not set before the first note');
    const open = new Map<string, number>();
    for (const e of ev) {
      const kind = e.data[0] & 0xf0;
      const key = `${e.data[0] & 15}:${e.data[1]}`;
      if (kind === 0x90 && e.data[2] > 0) open.set(key, (open.get(key) ?? 0) + 1);
      if (kind === 0x80) open.set(key, (open.get(key) ?? 0) - 1);
      if (kind === 0x90 && (e.data[0] & 15) > 5 && (e.data[0] & 15) < 11) problems.push(`note on melodic channel ${e.data[0] & 15} in rhythm mode`);
    }
    for (const [k, n] of open) if (n !== 0) problems.push(`channel:note ${k} has ${n} unmatched note ons`);
    const bars = ticks / cmf.ticksPerBeat / 4;
    const { samples, drumKeys } = render(bytes, seconds * loops + 1);
    let peak = 0;
    let sum = 0;
    for (const v of samples) {
      peak = Math.max(peak, Math.abs(v));
      sum += v * v;
    }
    const rms = Math.sqrt(sum / samples.length);
    if (rms < 0.005) problems.push(`silent (rms ${rms.toFixed(4)})`);
    if (drumKeys === 0) problems.push('no drums sounded');
    const norm = peak > 0 ? 0.9 / peak : 1;
    writeFileSync(join(out, `${name}.wav`), wav(samples.map((v) => v * norm)));
    const c = chroma(samples);
    const top = c
      .map((v, i) => [v, i] as [number, number])
      .sort((a, b) => b[0] - a[0])
      .slice(0, 5)
      .map(([v, i]) => `${NAMES[i]} ${v.toFixed(2)}`);
    const notes = ev.filter((e) => (e.data[0] & 0xf0) === 0x90).length;
    console.log(
      `${name.padEnd(8)} ${String(bytes.length).padStart(6)} bytes  ${seconds.toFixed(1).padStart(6)} s  ${bars.toFixed(2).padStart(6)} bars  ${String(notes).padStart(5)} notes  ${String(cmf.instruments.length).padStart(2)} patches  rms ${rms.toFixed(3)}  drum ticks ${drumKeys}  chroma ${top.join(', ')}${problems.length ? '  PROBLEMS: ' + problems.join('; ') : ''}`,
    );
    if (problems.length) failed = true;
    report.push({ name, bytes: bytes.length, seconds, bars, notes, rms, peak, drumTicks: drumKeys, chroma: c, problems });
  }
  writeFileSync(join(out, 'songs.json'), JSON.stringify(report, null, 1));
  console.log(`wrote ${songs.length} WAVs and songs.json to ${out}`);
  if (failed) process.exitCode = 1;
}
