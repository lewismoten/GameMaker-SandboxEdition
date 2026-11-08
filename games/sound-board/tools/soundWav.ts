// Writes every sound in the game's sound set to a WAV file (what the PC speaker would play: a square wave,
// one step every 1/145.6 s) and checks length, peak and the notes, so the sounds can be listened to or looked
// at without a speaker. Prints one line a sound: its notes as names, its length and its peak.
//   cd web && npx vite-node ../games/sound-board/tools/soundWav.ts [outDir]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SLOT } from '../src/sounds';

const out = process.argv[2] ?? join(tmpdir(), 'sound-board-wav');
mkdirSync(out, { recursive: true });
const snd = parseSoundSet(new Uint8Array(readFileSync(new URL('../disk/sndboard.snd', import.meta.url))));
const RATE = 22050;
const STEP = 1 / 145.6;
const LEVEL = 0.35; // the square wave's height: well under full scale, so nothing clips
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const note = (hz: number) => {
  const n = Math.round(69 + 12 * Math.log2(hz / 440));
  return `${NAMES[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`;
};

/** A mono 16-bit WAV file of `samples` (-1..1). */
function wav(samples: Float32Array): Uint8Array {
  const b = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const str = (o: number, s: string) => [...s].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  b.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVEfmt ');
  b.setUint32(16, 16, true);
  b.setUint16(20, 1, true);
  b.setUint16(22, 1, true);
  b.setUint32(24, RATE, true);
  b.setUint32(28, RATE * 2, true);
  b.setUint16(32, 2, true);
  b.setUint16(34, 16, true);
  str(36, 'data');
  b.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => b.setInt16(44 + i * 2, Math.round(s * 32767), true));
  return new Uint8Array(b.buffer);
}

for (const [name, n] of Object.entries(SLOT)) {
  const freqs = snd.freqs[n];
  const steps = freqs.length;
  const samples = new Float32Array(Math.round(steps * STEP * RATE) + RATE / 20);
  let phase = 0;
  for (let i = 0; i < samples.length; i++) {
    const hz = freqs[Math.min(steps - 1, Math.floor(i / RATE / STEP))] ?? 0;
    if (i / RATE / STEP >= steps || hz <= 0) {
      phase = 0;
      continue;
    }
    phase += hz / RATE;
    samples[i] = (phase % 1 < 0.5 ? 1 : -1) * LEVEL;
  }
  const peak = samples.reduce((m, s) => Math.max(m, Math.abs(s)), 0);
  const sounding = freqs.reduce((k, hz, i) => (hz > 0 ? i + 1 : k), 0);
  const seconds = sounding * STEP;
  if (peak >= 0.99) throw new Error(`${name} clips`);
  if (seconds > 0.26) throw new Error(`${name} lasts ${seconds.toFixed(2)} s; a sound can be 0.25 s at most`);
  writeFileSync(join(out, `${String(n).padStart(2, '0')}-${name}.wav`), wav(samples));
  const runs: string[] = [];
  freqs.forEach((hz, i) => {
    const s = hz > 0 ? note(hz) : '-';
    if (i < sounding && runs[runs.length - 1]?.split('x')[0] !== s) runs.push(`${s}x1`);
    else if (i < sounding) runs[runs.length - 1] = `${s}x${Number(runs[runs.length - 1].split('x')[1]) + 1}`;
  });
  console.log(`${String(n).padStart(2)} ${name.padEnd(8)} ${seconds.toFixed(2)} s peak ${peak.toFixed(2)}  ${sounding ? runs.join(' ') : '(silent)'}`);
}
console.log(`WAV files in ${out}`);
