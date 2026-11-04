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

  it('the CD-ROM bay is 146 x 41.3 mm', () => {
    expect(mm('.drive', 'width')).toBe(146);
    expect(mm('.drive', 'height')).toBe(41.3);
  });

  it('the floppy has its own 3.5 inch bay, 101.6 x 25.4 mm, laid flat with a 93 mm slot; the CD tray is 130 mm', () => {
    expect(mm('.drive.fdd', 'width')).toBe(101.6);
    expect(mm('.drive.fdd', 'height')).toBe(25.4);
    expect(mm('.drive.fdd .slot', 'width')).toBe(93);
    expect(mm('.drive.cdrom .tray-slot', 'width')).toBe(130);
  });

  it('the cage is one stack: three 5.25 inch bays (123.9 mm) beside the floppy bay and its plate, with no gap', () => {
    expect(css).toMatch(/\.drives \{[^}]*grid-template-columns: calc\(146 \* var\(--mm\)\) calc\(101\.6 \* var\(--mm\)\)/);
    expect(css).toMatch(
      /grid-template-rows: calc\(25\.4 \* var\(--mm\)\) calc\(15\.9 \* var\(--mm\)\) calc\(41\.3 \* var\(--mm\)\) calc\(41\.3 \* var\(--mm\)\)/,
    );
    expect(25.4 + 15.9 + 41.3 + 41.3).toBeCloseTo(3 * 41.3, 5);
    expect(css).not.toMatch(/\.drives \{[^}]*\bgap:/);
  });

  it('the brand badge is 38 mm square', () => {
    expect(mm('.brand-badge', 'width')).toBe(38);
    expect(mm('.brand-badge', 'height')).toBe(38);
  });
});
