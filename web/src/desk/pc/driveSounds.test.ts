// The drives' sounds: every kind schedules something and lasts a sane time with a fake audio
// context (the real rendering is checked in a browser), and the bays' CSS keeps true mm proportions.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { type DriveSound, renderDriveSound } from './driveSounds';

/** A Web Audio stand-in: any node method or parameter works and counts what starts. */
function fakeContext() {
  let starts = 0;
  const node = (): unknown =>
    new Proxy(function () {}, {
      get: (_t, k) => (k === 'start' ? () => void starts++ : k === 'connect' ? (n: unknown) => n ?? node() : node()),
      set: () => true,
      apply: () => node(),
    });
  const ctx = {
    sampleRate: 8000,
    createBuffer: (_c: number, n: number) => ({ getChannelData: () => new Float32Array(n) }),
    createBufferSource: () => node(),
    createBiquadFilter: () => node(),
    createGain: () => node(),
    createOscillator: () => node(),
  };
  return { ctx: ctx as unknown as BaseAudioContext, count: () => starts };
}

const KINDS: DriveSound[] = ['floppy-insert', 'floppy-read', 'floppy-eject', 'tray-open', 'tray-close', 'cd-spin', 'cd-read'];

describe('renderDriveSound', () => {
  it.each(KINDS)('%s schedules sounds and ends within a few seconds', (kind) => {
    const { ctx, count } = fakeContext();
    const dur = renderDriveSound(ctx, ctx.createGain(), kind, 0, 900, 3);
    expect(count()).toBeGreaterThan(0);
    expect(dur).toBeGreaterThan(0.2);
    expect(dur).toBeLessThan(3);
  });

  it('the insert has the seat, the recalibration and the FAT read: more than the eject', () => {
    const a = fakeContext();
    const b = fakeContext();
    renderDriveSound(a.ctx, a.ctx.createGain(), 'floppy-insert', 0);
    renderDriveSound(b.ctx, b.ctx.createGain(), 'floppy-eject', 0);
    expect(a.count()).toBeGreaterThan(b.count() * 3);
  });
});

describe('the bays', () => {
  const css = readFileSync(new URL('../desk.css', import.meta.url), 'utf8');
  const mm = (sel: string, prop: string) =>
    Number(new RegExp(`${sel.replace(/[.]/g, '\\.')} \\{[^}]*?${prop}: calc\\(([\\d.]+) \\* var\\(--mm\\)\\)`).exec(css)?.[1]);

  it('are 146 x 41.3 mm, one factor for both drives', () => {
    expect(mm('.drive', 'width')).toBe(146);
    expect(mm('.drive', 'height')).toBe(41.3);
  });

  it('seat the 3.5 inch face (101.6 mm, slot 93 mm) centered in the bay; the CD tray is 130 mm', () => {
    expect(mm('.drive.fdd .face', 'width')).toBe(101.6);
    expect(mm('.drive.fdd .face', 'left')).toBeCloseTo((146 - 101.6) / 2, 1);
    expect(mm('.drive.fdd .slot', 'width')).toBe(93);
    expect(mm('.drive.cdrom .tray-slot', 'width')).toBe(130);
  });
});
