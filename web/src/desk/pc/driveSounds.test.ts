// The drives' sounds: every kind schedules something and lasts a sane time with a fake audio
// context (the real rendering is checked in a browser), and the bays' CSS keeps true mm proportions.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { type DriveSound, renderDriveSound } from './driveSounds';
import type { SoundPart } from './driveSwitches';

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

describe('the drive sound switches', () => {
  /** The parts each sound has: switching one off leaves it out, and switching off the rest changes nothing. */
  const PARTS: Record<DriveSound, SoundPart[]> = {
    'floppy-insert': ['load', 'spin', 'heads', 'rw'],
    'floppy-read': ['spin', 'rw'],
    'floppy-eject': ['load'],
    'tray-open': ['load'],
    'tray-close': ['load'],
    'cd-spin': ['spin', 'heads'],
    'cd-read': ['spin', 'rw'],
  };
  const starts = (kind: DriveSound, allowed: (drive: string, part: SoundPart) => boolean) => {
    const { ctx, count } = fakeContext();
    const dur = renderDriveSound(ctx, ctx.createGain(), kind, 0, 900, 3, allowed);
    return { n: count(), dur };
  };

  it.each(KINDS)('%s: each of its parts has its own switch, on its own drive', (kind) => {
    const drive = kind.startsWith('floppy') ? 'floppy' : 'cd';
    const full = starts(kind, () => true);
    for (const part of ['load', 'spin', 'heads', 'rw'] as const) {
      const without = starts(kind, (d, p) => !(d === drive && p === part));
      expect(without.dur).toBe(full.dur); // the timing stays
      if (PARTS[kind].includes(part)) expect(without.n, part).toBeLessThan(full.n);
      else expect(without.n, part).toBe(full.n);
    }
    // the other drive's switches never touch it; with all of its own off it is silent
    expect(starts(kind, (d) => d === drive).n).toBe(full.n);
    expect(starts(kind, () => false).n).toBe(0);
  });
});

describe('the bays', () => {
  const css = readFileSync(new URL('../desk.css', import.meta.url), 'utf8');
  const mm = (sel: string, prop: string) =>
    Number(new RegExp(`${sel.replace(/[.]/g, '\\.')} \\{[^}]*?${prop}: calc\\(([\\d.]+) \\* var\\(--mm\\)\\)`).exec(css)?.[1]);

  it('the CD-ROM bay is 146 x 41.3 mm', () => {
    expect(mm('.drive', 'width')).toBe(146);
    expect(mm('.drive', 'height')).toBe(41.3);
  });

  it('the floppy has its own 3.5 inch bay, 101.6 x 25.4 mm, laid flat with a 93 mm slot and a 32 mm finger pocket; the CD tray is 130 mm', () => {
    expect(mm('.drive.fdd', 'width')).toBe(101.6);
    expect(mm('.drive.fdd', 'height')).toBe(25.4);
    expect(mm('.drive.fdd .slot', 'width')).toBe(93);
    expect(mm('.drive.fdd .grip', 'width')).toBe(32);
    expect(mm('.drive.cdrom .tray-slot', 'width')).toBe(130);
  });

  it('the cage is one small stack: the CD-ROM bay beside the floppy bay, tops aligned, one 41.3 mm row, no gap', () => {
    expect(css).toMatch(/\.drives \{[^}]*grid-template-columns: calc\(146 \* var\(--mm\)\) calc\(101\.6 \* var\(--mm\)\)/);
    expect(css).toMatch(/\.drives \{[^}]*grid-template-rows: calc\(41\.3 \* var\(--mm\)\);/);
    expect(css).not.toMatch(/\.drives \{[^}]*\bgap:/);
    expect(css).not.toMatch(/\.drive\.blank/);
  });

  it('the brand badge is 38 mm square', () => {
    expect(mm('.brand-badge', 'width')).toBe(38);
    expect(mm('.brand-badge', 'height')).toBe(38);
  });
});
