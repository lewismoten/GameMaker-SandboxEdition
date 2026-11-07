// Disk reads freeze gameplay, not the timer-driven song; interrupt costs and Today stay unchanged.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { costsFor, musicHoldMs, SPEED_PRESETS, TURBO_OFF, vocStallMs } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';
import { INTERRUPT_MS, songIsrMs, songLoad, songPeakIsrMs } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPcMusic';

// Glubada Pond, from the CD: its level songs, from the sparse one to the busy ones
const glub = (name: string) => new Uint8Array(readFileSync(new URL(`../../../cd/gameware/glub/${name}.cmf`, import.meta.url)));
const SONGS = ['gmopenin', 'gmsong1', 'gmsong2', 'gmsong4', 'gmsong5', 'gmsong6'];

describe('a slow PC keeps the music timer running while it reads the disk', () => {
  it('freezes the game for the unchanged read cost, but never holds music on a preset', () => {
    const disks = { '286': [30, 400], '386': [18, 800], '486': [12, 1500], ps1: [80, 150] };
    for (const k of ['286', '386', '486', 'ps1'] as const) {
      const read = vocStallMs(SPEED_PRESETS[k], 23699);
      const [open, bytesPerMs] = disks[k];
      expect(read).toBe(open + 23699 / bytesPerMs);
      expect(musicHoldMs(SPEED_PRESETS[k], read), k).toBe(0);
    }
    expect(musicHoldMs(costsFor('today'), 500)).toBe(0);
    expect(musicHoldMs(TURBO_OFF, 500)).toBe(0);
  });

  it('retains an explicit timer-masked custom PC without imposing it on the presets', () => {
    expect(musicHoldMs({ ...SPEED_PRESETS.ps1, readHoldsMusic: true }, 500)).toBe(500);
    expect(musicHoldMs({ ...SPEED_PRESETS.ps1, readHoldsMusic: false }, 500)).toBe(0);
  });
});

describe('what a song costs the timer interrupt', () => {
  it("walks a song as PlayIt does: one pass of Glubada Pond's first level is a minute of notes", () => {
    const l = songLoad(glub('gmsong1'))!;
    expect(l.interrupts / (1000 / INTERRUPT_MS)).toBeCloseTo(60.3, 0);
    expect(l.events).toBe(1542);
    expect(songLoad(new Uint8Array(8))).toBeUndefined();
  });

  it('costs about 1% of a PS/1 on average, more for a busy song than a sparse one', () => {
    const ps1 = SPEED_PRESETS.ps1;
    const share = (n: string) => songIsrMs(ps1, songLoad(glub(n))) / INTERRUPT_MS;
    expect(share('gmsong1')).toBeGreaterThan(0.006);
    expect(share('gmsong1')).toBeLessThan(0.015);
    expect(share('gmsong4')).toBeGreaterThan(share('gmsong6'));
    // with no song the interrupt still runs
    expect(songIsrMs(ps1, undefined)).toBe(ps1.isrMs);
    expect(songIsrMs(undefined, songLoad(glub('gmsong1')))).toBe(0);
  });

  it("never runs past the next interrupt, even on the busiest beat of the CD's busiest songs", () => {
    for (const n of SONGS) {
      const peak = songPeakIsrMs(SPEED_PRESETS.ps1, songLoad(glub(n))!);
      expect(peak, n).toBeLessThan(INTERRUPT_MS);
    }
  });
});
