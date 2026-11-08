// The boot's drive sounds obey the Machine settings' switches: a fake audio context counts what starts.
import { beforeEach, expect, it, vi } from 'vitest';
import type { Drive, SoundPart } from './driveSwitches';

let starts = 0;
const node = (): unknown =>
  new Proxy(function () {}, {
    get: (_t, k) => (k === 'start' ? () => void starts++ : k === 'connect' ? (n: unknown) => n ?? node() : node()),
    set: () => true,
    apply: () => node(),
  });
const ctx = {
  currentTime: 0,
  sampleRate: 8000,
  createBuffer: (_c: number, n: number) => ({ getChannelData: () => new Float32Array(n) }),
  createBufferSource: () => node(),
  createBiquadFilter: () => node(),
  createGain: () => node(),
  createOscillator: () => node(),
};
vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/context', () => ({ audioContext: () => ctx, soundUnlocked: () => true }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/mix', () => ({ channelGain: () => 1 }));
vi.mock('../../retro/computer/pcAudio', () => ({ pcOutput: () => node() }));
const { bootSounds } = await import('./bootSounds');

beforeEach(() => {
  starts = 0;
  ctx.currentTime = 0;
});

/** Sounds started by switching on (before any read), then by each drive's read. */
function boot(allowed: (drive: Drive, part: SoundPart) => boolean) {
  starts = 0;
  ctx.currentTime = 0;
  const b = bootSounds(allowed)!;
  const power = starts;
  ctx.currentTime = 3;
  const reads: Record<string, number> = {};
  for (const [drive, ms] of [
    ['A', 1200], // the BIOS's seek test
    ['A', 300], // a read
    ['C', 600],
    ['D', 1200],
  ] as const) {
    const before = starts;
    b.access(drive, ms);
    reads[`${drive}${ms}`] = starts - before;
  }
  return { power, reads };
}

it('plays every drive part with the switches on', () => {
  const { power, reads } = boot(() => true);
  expect(power).toBeGreaterThan(2);
  for (const n of Object.values(reads)) expect(n).toBeGreaterThan(0);
});

it('the hard disk spin-up and the heads unparking each have their switch; the case fan stays', () => {
  const full = boot(() => true).power;
  const noSpin = boot((d, p) => !(d === 'hdd' && p === 'spin')).power;
  const noHeads = boot((d, p) => !(d === 'hdd' && p === 'heads')).power;
  expect(noSpin).toBeLessThan(full);
  expect(noHeads).toBe(full - 1);
  expect(boot(() => false).power).toBe(3); // the case fan's hum, its waver and its air are no drive
});

it.each([
  ['hdd', 'rw', 'C600'],
  ['cd', 'rw', 'D1200'],
  ['floppy', 'rw', 'A300'],
] as const)('%s %s silences its reads', (drive, part, read) => {
  const full = boot(() => true).reads;
  const off = boot((d, p) => !(d === drive && p === part)).reads;
  expect(off[read]).toBeLessThan(full[read]);
  for (const key of Object.keys(full)) if (key !== read) expect(off[key], key).toBe(full[key]);
});

it("the floppy's seek test is heads and its motor is spin; the CD driver's focus test is heads", () => {
  const full = boot(() => true).reads;
  const noHeads = boot((d, p) => !(d === 'floppy' && p === 'heads')).reads;
  expect(noHeads.A1200).toBe(2); // only the motor's two sounds
  expect(boot((d, p) => !(d === 'floppy' && p === 'spin')).reads.A1200).toBe(full.A1200 - 2);
  expect(boot((d, p) => !(d === 'cd' && p === 'heads')).reads.D1200).toBe(1); // the sled's read clack
  expect(boot(() => false).reads).toEqual({ A1200: 0, A300: 0, C600: 0, D1200: 0 });
});
