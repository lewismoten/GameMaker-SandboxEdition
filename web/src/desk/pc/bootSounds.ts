// The PC's insides coming to life at the power switch: the fans whine up to speed and the hard
// disk's motor winds up and its heads unpark; then each drive the boot reads makes its sound
// (access, from the PC's drive reads): the floppy's seek test, the hard disk's heads knocking
// through CONFIG.SYS and AUTOEXEC.BAT, the CD-ROM driver's test of its drive. Made on the spot
// (no files), through the PC's own line (retro/computer/pcAudio.ts), so switching off cuts them at
// once. Once DOS is at its prompt (settle) they fade away slowly: a moment of nostalgia, not a hum
// under everything that follows. They follow the Sound effects setting, and play only after a
// click or key press: a desk restored as the page loads switches its PC on in silence.
import { audioContext, soundUnlocked } from '@lewismoten/gamemaker-sandbox-engine/audio/context';
import { channelGain } from '@lewismoten/gamemaker-sandbox-engine/audio/mix';
import { pcOutput } from '../../retro/computer/pcAudio';
import { mulberry32 } from '../../seededRandom';

/** Seconds: the fans and the hard disk reach speed (the heads unpark then). */
const SPIN_UP = 1.8;
/** Seconds the whir takes to fade once DOS is at its prompt (or, at the latest, FADE_BY in). */
const FADE = 8;
const FADE_BY = 25;

/** A resonance a knock rings at: Hz, Q, level. */
type Band = readonly [number, number, number];
/** The hard disk's head arm: a woody knock with a metal ring. */
const SEEK: Band[] = [
  [1150, 9, 1],
  [2600, 7, 0.6],
  [420, 3, 0.8],
];
/** The floppy's stepper motor moving the head one track: a buzzier, hollow tick. */
const STEP: Band[] = [
  [620, 4, 1],
  [1700, 5, 0.5],
  [190, 2, 0.7],
];
/** The CD-ROM's laser sled and focus coil. */
const SLED: Band[] = [
  [520, 3, 1],
  [1400, 4, 0.6],
];
const FOCUS: Band[] = [
  [3000, 6, 1],
  [900, 4, 0.4],
];

export interface BootSounds {
  /** A drive read as the PC starts ('A', 'C' or 'D'), lasting about `ms`. */
  access(drive: string, ms?: number): void;
  /** DOS is at its prompt: the whir fades away. */
  settle(): void;
}

let buffers: { ctx: BaseAudioContext; noise: AudioBuffer; click: AudioBuffer } | undefined;

/** Two seconds of white noise to loop, and a 2 ms decaying click, made once per context. */
function sources(ctx: BaseAudioContext) {
  if (buffers?.ctx === ctx) return buffers;
  const rnd = mulberry32(486);
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const n = noise.getChannelData(0);
  for (let i = 0; i < n.length; i++) n[i] = rnd() * 2 - 1;
  const click = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.002), ctx.sampleRate);
  const c = click.getChannelData(0);
  for (let i = 0; i < c.length; i++) c[i] = (rnd() * 2 - 1) * Math.exp((-5 * i) / c.length);
  buffers = { ctx, noise, click };
  return buffers;
}

/** Starts the boot's sounds. Undefined when there is no sound to make. */
export function bootSounds(): BootSounds | undefined {
  const ctx = audioContext();
  const level = channelGain('sfx');
  // a press of the power switch that was the page's first gesture: the context is resuming
  const pressed = soundUnlocked() || !!navigator.userActivation?.isActive;
  if (!ctx || !pressed || level === 0) return undefined;
  const { noise, click } = sources(ctx);
  const rnd = mulberry32(1993);
  const t0 = ctx.currentTime + 0.02;
  const master = ctx.createGain();
  master.gain.value = level;
  master.connect(pcOutput(ctx));
  /** What runs until the fade: the fans and the hard disk's motor. */
  const running: AudioScheduledSourceNode[] = [];

  /** A gain going from 0 to `peak` over `rise` seconds from `at`, into the master. */
  const swell = (at: number, rise: number, peak: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + rise);
    g.connect(master);
    return g;
  };
  /** An oscillator gliding from `from` to `to` Hz over `glide` seconds, wavering `waver` Hz. */
  const tone = (type: OscillatorType, from: number, to: number, at: number, glide: number, waver = 0) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, at);
    o.frequency.exponentialRampToValueAtTime(to, at + glide);
    if (waver) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.3 + rnd() * 0.3;
      const depth = ctx.createGain();
      depth.gain.value = waver;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(at);
      running.push(lfo);
    }
    return o;
  };
  /** Noise through a filter. */
  const hiss = (type: BiquadFilterType, freq: number, q: number) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    s.connect(f);
    return { s, f };
  };
  /** One knock at `at`: the click ringing through `bands`. */
  const knock = (at: number, bands: Band[], peak: number) => {
    const s = ctx.createBufferSource();
    s.buffer = click;
    const g = ctx.createGain();
    g.gain.value = peak;
    g.connect(master);
    for (const [freq, q, lvl] of bands) {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq * (0.97 + rnd() * 0.06);
      f.Q.value = q;
      const l = ctx.createGain();
      l.gain.value = lvl;
      s.connect(f).connect(l).connect(g);
    }
    s.start(at);
  };
  /** A motor's sound from `at` for `len` seconds (rising and falling `edge` seconds at each end). */
  const motor = (src: AudioScheduledSourceNode, into: AudioNode, at: number, len: number, peak: number, edge = 0.08) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + edge);
    g.gain.setValueAtTime(peak, at + len - edge);
    g.gain.linearRampToValueAtTime(0, at + len);
    into.connect(g).connect(master);
    src.start(at);
    src.stop(at + len + 0.05);
  };

  // the fans: the power supply's whine rising to pitch (and wavering a little), the CPU's small
  // fan above it, and a little air
  const psu = tone('sawtooth', 40, 290, t0, SPIN_UP, 2.5);
  const psuTone = ctx.createBiquadFilter();
  psuTone.type = 'lowpass';
  psuTone.frequency.value = 900;
  psu.connect(psuTone).connect(swell(t0, SPIN_UP, 0.02));
  const cpuFan = tone('triangle', 80, 520, t0, SPIN_UP, 4);
  cpuFan.connect(swell(t0, SPIN_UP, 0.008));
  const air = hiss('lowpass', 400, 0.7);
  air.f.frequency.setValueAtTime(120, t0);
  air.f.frequency.exponentialRampToValueAtTime(400, t0 + SPIN_UP);
  air.f.connect(swell(t0, SPIN_UP, 0.05));
  // the hard disk's motor winding up: a low hum and a faint high whine above it
  const spindle = tone('triangle', 40, 90, t0, SPIN_UP);
  spindle.connect(swell(t0, SPIN_UP, 0.012));
  const whine = tone('sine', 300, 1800, t0, SPIN_UP);
  whine.connect(swell(t0, SPIN_UP, 0.004));
  for (const s of [psu, cpuFan, air.s, spindle, whine]) (s.start(t0), running.push(s));
  // up to speed, the heads unpark with a clunk
  knock(t0 + SPIN_UP, [...SEEK, [300, 4, 1]], 2.2);

  /** The hard disk reading: single knocks, pairs and quick runs of seeks (trrrk), for `len` s. */
  const hardDisk = (at: number, len: number) => {
    for (let t = at; t < at + len;) {
      const run = rnd() < 0.35 ? 4 + Math.floor(rnd() * 7) : 1 + Math.floor(rnd() * 2);
      for (let i = 0; i < run; i++, t += run > 2 ? 0.01 + rnd() * 0.008 : 0.03 + rnd() * 0.03) knock(t, SEEK, (run > 2 ? 0.9 : 1.4) * (0.7 + rnd() * 0.3));
      t += 0.04 + rnd() * 0.1;
    }
  };

  /** The floppy: its motor, and the head stepping out 40 tracks and back (the BIOS's seek test) or a few (a read). */
  const floppy = (at: number, len: number) => {
    const m = hiss('bandpass', 180, 1.5);
    motor(m.s, m.f, at, len, 0.08);
    const hum = tone('triangle', 95, 95, at, 0.01);
    motor(hum, hum, at, len, 0.012);
    const tracks = len >= 0.9 ? 40 : 3;
    let t = at + 0.15;
    for (const dir of [0, 1]) {
      for (let i = 0; i < tracks; i++, t += tracks > 3 ? 0.007 : 0.02) knock(t, STEP, 1.6);
      t += 0.1;
      if (!dir && tracks > 3) knock(t - 0.05, STEP, 2.2); // the head stops at the last track
    }
  };

  /** The CD-ROM: the driver's test (sled, focus, the motor spinning up and down), or a short read. */
  const cdRom = (at: number, len: number) => {
    knock(at + 0.05, SLED, 2);
    const test = len >= 1;
    if (test) for (const dt of [0.22, 0.32, 0.42, 0.6]) knock(at + dt, FOCUS, 0.8);
    const start = at + (test ? 0.65 : 0.1);
    const spin = Math.max(0.3, at + len - start);
    const m = tone('sine', 30, test ? 170 : 150, start, Math.min(0.6, spin));
    motor(m, m, start, spin, 0.02, 0.25);
    const whoosh = hiss('bandpass', 300, 2);
    whoosh.f.frequency.setValueAtTime(300, start);
    whoosh.f.frequency.exponentialRampToValueAtTime(1400, start + Math.min(0.6, spin));
    motor(whoosh.s, whoosh.f, start, spin, 0.03, 0.25);
    if (!test) knock(at + len * 0.6, SLED, 1.4);
  };

  const fadeAt = (at: number) => {
    master.gain.cancelScheduledValues(at);
    master.gain.setValueAtTime(level, at);
    master.gain.linearRampToValueAtTime(0, at + FADE);
    for (const s of running) s.stop(at + FADE + 0.05);
  };
  fadeAt(t0 + FADE_BY); // a boot that never reaches the prompt still goes quiet
  let settled = false;
  return {
    access(drive, ms = 400) {
      const now = ctx.currentTime;
      if (settled || now >= t0 + FADE_BY) return;
      const len = ms / 1000;
      if (drive === 'A') floppy(now + 0.02, len);
      else if (drive === 'C') hardDisk(Math.max(now + 0.02, t0 + SPIN_UP + 0.15), len);
      else if (drive === 'D') cdRom(now + 0.02, len);
    },
    settle() {
      if (settled || ctx.currentTime >= t0 + FADE_BY) return;
      settled = true;
      fadeAt(ctx.currentTime + 0.3);
    },
  };
}
