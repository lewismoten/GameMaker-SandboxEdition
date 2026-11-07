// The sounds of the desk PC's two drives, made on the spot with Web Audio (no files), through the PC's
// own line (retro/computer/pcAudio.ts) and the Sound effects volume, like the boot's (bootSounds.ts):
//   floppy-insert  the disk clicking into place, the head recalibrating (a run of steps and a thump
//                  at track 0), then the FAT read while the disk spins
//   floppy-read    the motor and a few head steps (DOS reading drive A:)
//   floppy-eject   the push-button's thunk, the spring letting go, the disk sliding out
//   tray-open / tray-close  the loading motor's whirr and the tray's clunk
//   cd-spin        the disc spinning up and settling
//   cd-read        the spindle's whine with the sled's clacks and the focus coil's ticks
// Nothing plays before a click or key press, or when sound effects are off. Each part is tagged with its
// drive and kind (driveSwitches.ts) and plays only when the Machine settings' switch for it is on: the
// motors are spin, the floppy's recalibration and the CD's spin-up sled and focus are heads, the steps
// and clacks of a read are read/write, and the seat, eject and tray sounds follow the master switch.
import { audioContext, soundUnlocked } from '@lewismoten/gamemaker-sandbox-engine/audio/context';
import { channelGain } from '@lewismoten/gamemaker-sandbox-engine/audio/mix';
import { pcOutput } from '../../retro/computer/pcAudio';
import { mulberry32 } from '../../seededRandom';
import type { Drive, SoundPart } from './driveSwitches';
import { driveSoundOn } from './machineSettings';

export type DriveSound = 'floppy-insert' | 'floppy-read' | 'floppy-eject' | 'tray-open' | 'tray-close' | 'cd-spin' | 'cd-read';
/** Whether a drive's part of a sound may play. */
export type SoundAllowed = (drive: Drive, part: SoundPart) => boolean;

/** A resonance a knock rings at: Hz, Q, level. */
type Band = readonly [number, number, number];
const SEAT: Band[] = [
  [1800, 5, 1],
  [700, 3, 0.8],
  [3200, 6, 0.4],
];
const LATCH: Band[] = [
  [2600, 8, 1],
  [1300, 4, 0.5],
];
const STEP: Band[] = [
  [620, 4, 1],
  [1700, 5, 0.5],
  [190, 2, 0.7],
];
const THUMP: Band[] = [
  [240, 3, 1],
  [900, 4, 0.5],
  [90, 2, 0.8],
];
const BUTTON: Band[] = [
  [330, 3, 1],
  [1100, 5, 0.6],
];
const CLUNK: Band[] = [
  [210, 3, 1],
  [760, 4, 0.7],
  [1900, 6, 0.3],
];
const SLED: Band[] = [
  [520, 3, 1],
  [1400, 4, 0.6],
];
const FOCUS: Band[] = [
  [3000, 6, 1],
  [900, 4, 0.4],
];

const buffers = new WeakMap<BaseAudioContext, { noise: AudioBuffer; click: AudioBuffer }>();

/** Two seconds of white noise to loop, and a 2 ms decaying click, made once per context. */
function sources(ctx: BaseAudioContext) {
  let b = buffers.get(ctx);
  if (!b) {
    const rnd = mulberry32(1995);
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const n = noise.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = rnd() * 2 - 1;
    const click = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.002), ctx.sampleRate);
    const c = click.getChannelData(0);
    for (let i = 0; i < c.length; i++) c[i] = (rnd() * 2 - 1) * Math.exp((-5 * i) / c.length);
    b = { noise, click };
    buffers.set(ctx, b);
  }
  return b;
}

/**
 * Schedules one drive sound into `out`, starting at `at` seconds; returns how long it lasts.
 * `ms` is how long a read or spin-up lasts. `seed` varies the details so repeats don't sound alike.
 * `allowed` leaves out the parts switched off; the length stays the same.
 */
export function renderDriveSound(
  ctx: BaseAudioContext,
  out: AudioNode,
  kind: DriveSound,
  at: number,
  ms = 600,
  seed = 1,
  allowed: SoundAllowed = () => true,
): number {
  const { noise, click } = sources(ctx);
  const rnd = mulberry32(seed);
  const len = ms / 1000;
  const drive: Drive = kind.startsWith('floppy') ? 'floppy' : 'cd';
  const on = (part: SoundPart) => allowed(drive, part);

  /** A knock; one switched off still draws its random numbers, so the parts after it sound the same. */
  const knock = (t: number, bands: Band[], peak: number, play = true) => {
    const tune = bands.map(() => 0.96 + rnd() * 0.08);
    if (!play) return;
    const s = ctx.createBufferSource();
    s.buffer = click;
    const g = ctx.createGain();
    g.gain.value = peak;
    g.connect(out);
    for (const [i, [freq, q, lvl]] of bands.entries()) {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq * tune[i];
      f.Q.value = q;
      const l = ctx.createGain();
      l.gain.value = lvl;
      s.connect(f).connect(l).connect(g);
    }
    s.start(t);
  };
  /** Noise through a bandpass, rising and falling around `peak`; `to` glides its center. */
  const hiss = (t: number, dur: number, freq: number, to: number, q: number, peak: number, type: BiquadFilterType = 'bandpass') => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    const edge = Math.min(0.06, dur / 3);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + edge);
    g.gain.setValueAtTime(peak, t + dur - edge);
    g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(f).connect(g).connect(out);
    s.start(t);
    s.stop(t + dur + 0.05);
  };
  /** A tone gliding from `from` to `to` Hz. */
  const tone = (type: OscillatorType, t: number, dur: number, from: number, to: number, peak: number) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    const edge = Math.min(0.08, dur / 3);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + edge);
    g.gain.setValueAtTime(peak, t + dur - edge);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  };
  /** The floppy's spindle motor: a soft rumble and hum for `dur` seconds. */
  const spin = (t: number, dur: number) => {
    hiss(t, dur, 180, 180, 1.5, 0.15);
    tone('triangle', t, dur, 95, 95, 0.02);
  };
  /** `n` head steps from `t`, `gap` seconds apart (a little uneven); returns the time after. */
  const steps = (t: number, n: number, gap: number, play: boolean, peak = 3) => {
    for (let i = 0; i < n; i++, t += gap * (0.85 + rnd() * 0.3)) {
      knock(t, STEP, peak * (0.85 + rnd() * 0.15), play);
    }
    return t;
  };

  switch (kind) {
    case 'floppy-insert': {
      // the disk seats with a click and a second, lighter latch
      knock(at, SEAT, 3.2, on('load'));
      knock(at + 0.045, LATCH, 1.6, on('load'));
      // the motor starts; the head recalibrates: a run of steps to track 0 and the thump at the stop
      const t = at + 0.3;
      if (on('spin')) spin(t, 1.5);
      let u = steps(t + 0.1, 7, 0.016, on('heads'));
      knock(u + 0.02, THUMP, 3.5, on('heads'));
      // then the FAT: the head steps to the directory and reads, a few unhurried moves
      u += 0.2;
      for (const n of [3, 2, 4]) u = steps(u, n, 0.022, on('rw')) + 0.12 + rnd() * 0.1;
      return u - at;
    }
    case 'floppy-read': {
      if (on('spin')) spin(at, len);
      steps(at + 0.12, 3, 0.02, on('rw'));
      if (len > 0.5) steps(at + len * 0.6, 2, 0.025, on('rw'));
      return len;
    }
    case 'floppy-eject': {
      if (on('load')) {
        knock(at, BUTTON, 3); // the push-button's thunk
        knock(at + 0.03, LATCH, 1.4); // the spring lets go
        hiss(at + 0.07, 0.26, 2400, 900, 1.2, 0.05); // the disk sliding out of the shutter
        knock(at + 0.36, SEAT, 0.7); // its edge leaving the slot
      }
      return 0.45;
    }
    case 'tray-open':
    case 'tray-close': {
      const opening = kind === 'tray-open';
      const dur = 0.6;
      if (!on('load')) return dur + 0.1;
      // the loading motor whirrs one way, then the other, with a soft belt hiss under it
      tone('sawtooth', at, dur, opening ? 130 : 210, opening ? 210 : 130, 0.007);
      tone('triangle', at, dur, opening ? 260 : 420, opening ? 420 : 260, 0.006);
      hiss(at, dur, 900, 1500, 0.8, 0.02);
      knock(at + dur, CLUNK, opening ? 1.6 : 2.2); // the tray stops
      return dur + 0.1;
    }
    case 'cd-spin': {
      // the disc comes up to speed: a rising whine, then settling to a hush
      if (on('spin')) {
        tone('sine', at, Math.min(len, 1.1), 90, 520, 0.012);
        tone('triangle', at, Math.min(len, 1.1), 180, 1040, 0.004);
        hiss(at, len, 400, 1800, 0.7, 0.03, 'highpass');
      }
      if (on('heads')) {
        knock(at + 0.05, SLED, 0.6);
        knock(at + Math.min(len, 1.1), FOCUS, 0.4);
      }
      return len;
    }
    case 'cd-read': {
      if (on('spin')) {
        tone('sine', at, len, 330, 330, 0.005);
        hiss(at, len, 1200, 1200, 0.7, 0.015, 'highpass');
      }
      // the sled clacks a few times and the focus coil ticks
      const n = on('rw') ? 2 + Math.floor(len * 3) : 0;
      for (let i = 0; i < n; i++) knock(at + 0.05 + rnd() * Math.max(0.1, len - 0.1), rnd() < 0.7 ? SLED : FOCUS, 0.35 + rnd() * 0.25);
      return len;
    }
  }
}

let plays = 0;
let seatedAt = -Infinity;

/** Plays a drive sound now, if sound effects are on and the page has had a gesture. */
export function driveSound(kind: DriveSound, ms?: number): void {
  const ctx = audioContext();
  const level = channelGain('sfx');
  const pressed = soundUnlocked() || !!navigator.userActivation?.isActive;
  if (!ctx || !pressed || level === 0) return;
  const now = ctx.currentTime;
  // DOS reading the disk just seated is the insert's own FAT read
  if (kind === 'floppy-insert') seatedAt = now;
  else if (kind === 'floppy-read' && now - seatedAt < 2.2) return;
  const master = ctx.createGain();
  master.gain.value = level;
  master.connect(pcOutput(ctx));
  const dur = renderDriveSound(ctx, master, kind, now + 0.02, ms, 1000 + plays++, driveSoundOn);
  // let go of the nodes once it has played
  setTimeout(() => master.disconnect(), (dur + 0.5) * 1000);
}
