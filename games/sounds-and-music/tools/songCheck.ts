// Plays both songs through the web app's own OPL2 emulator and CMF sequencer (as PLAYGAME plays them) and checks
// each: it reads back as a song under 20 KB, the render isn't silent or clipping, and it lasts as long as its bars
// say (meadow: 8 bars of 4 beats at 116; waltz: 8 bars of 3 beats at 100). The Starters have no drum track, so
// games/kit/songPreview.ts, which requires drums, is not used. Writes <outDir>/<name>.wav to listen to.
//   cd web && npx vite-node ../games/sounds-and-music/tools/songCheck.ts [outDir]
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CmfPlayer, TICK_RATE } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfPlayer';
import { Opl2 } from '@lewismoten/gamemaker-sandbox-engine/audio/opl';
import { parseCmf } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { meadow, waltz } from '../src/song';

const RATE = 22050;
const out = process.argv[2] ?? join(tmpdir(), 'sounds-and-music-audio');
mkdirSync(out, { recursive: true });

/** The song as 16-bit mono WAV bytes. */
function wav(x: Float32Array): Uint8Array {
  const b = new Uint8Array(44 + x.length * 2);
  const dv = new DataView(b.buffer);
  b.set(
    [...'RIFF'].map((c) => c.charCodeAt(0)),
    0,
  );
  dv.setUint32(4, 36 + x.length * 2, true);
  b.set(
    [...'WAVEfmt '].map((c) => c.charCodeAt(0)),
    8,
  );
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, RATE, true);
  dv.setUint32(28, RATE * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  b.set(
    [...'data'].map((c) => c.charCodeAt(0)),
    36,
  );
  dv.setUint32(40, x.length * 2, true);
  x.forEach((v, i) => dv.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(v * 32767))), true));
  return b;
}

let failed = false;
for (const [name, bytes, seconds] of [
  ['meadow', meadow(), (32 * 60) / 116],
  ['waltz', waltz(), (24 * 60) / 100],
] as const) {
  const cmf = parseCmf(bytes);
  const opl = new Opl2(RATE);
  const player = new CmfPlayer(opl);
  player.load(cmf.music, cmf.instruments);
  const samples = new Float32Array(Math.ceil((seconds + 1) * RATE));
  const perTick = RATE / TICK_RATE;
  let done = 0;
  let next = 0;
  while (done < samples.length) {
    player.tick();
    next += perTick;
    const n = Math.min(samples.length, Math.round(next)) - done;
    if (n > 0) opl.render(samples.subarray(done, done + n));
    done += Math.max(0, n);
  }
  let sum = 0;
  let peak = 0;
  let last = 0;
  samples.forEach((v, i) => {
    sum += v * v;
    peak = Math.max(peak, Math.abs(v));
    if (Math.abs(v) > 0.002) last = i;
  });
  const rms = Math.sqrt(sum / samples.length);
  const lasts = last / RATE;
  const problems: string[] = [];
  if (bytes.length >= 20000) problems.push(`${bytes.length} bytes`);
  if (rms < 0.005) problems.push(`silent (rms ${rms.toFixed(4)})`);
  if (peak >= 1) problems.push('clips');
  if (Math.abs(lasts - seconds) > seconds * 0.06 + 0.5) problems.push(`sounds for ${lasts.toFixed(1)} s, expected about ${seconds.toFixed(1)}`);
  writeFileSync(join(out, `${name}.wav`), wav(samples));
  console.log(
    `${name.padEnd(7)} ${bytes.length} bytes  ${lasts.toFixed(1)} s  rms ${rms.toFixed(3)}  peak ${peak.toFixed(2)}${problems.length ? '  PROBLEMS: ' + problems.join('; ') : '  ok'}`,
  );
  if (problems.length) failed = true;
}
console.log(`WAVs in ${out}`);
if (failed) process.exitCode = 1;
