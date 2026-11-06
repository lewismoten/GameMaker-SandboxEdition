// The music on a slow PC: a disk read holds the song, the timer interrupt's cost, and Today untouched.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { costsFor, musicHoldMs, SPEED_PRESETS, TURBO_OFF, vocStallMs } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';
import { INTERRUPT_MS, songIsrMs, songLoad, songPeakIsrMs } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPcMusic';

// Glubada Pond, from the CD: its level songs, from the sparse one to the busy ones
const glub = (name: string) => new Uint8Array(readFileSync(new URL(`../../../cd/gameware/glub/${name}.cmf`, import.meta.url)));
const SONGS = ['gmopenin', 'gmsong1', 'gmsong2', 'gmsong4', 'gmsong5', 'gmsong6'];

describe('a slow PC holds the music while it reads the disk', () => {
  it('for the whole read on every slow preset, and never on Today or the desk turbo', () => {
    for (const k of ['286', '386', '486', 'ps1'] as const) {
      const read = vocStallMs(SPEED_PRESETS[k], 23699);
      expect(musicHoldMs(SPEED_PRESETS[k], read)).toBe(read);
    }
    expect(musicHoldMs(costsFor('today'), 500)).toBe(0);
    expect(musicHoldMs(TURBO_OFF, 500)).toBe(0);
  });

  it("holds Glubada Pond's level-start voice about a quarter second on the PS/1", () => {
    const hold = musicHoldMs(SPEED_PRESETS.ps1, vocStallMs(SPEED_PRESETS.ps1, 23699)); // music.voc
    expect(hold).toBeGreaterThan(160);
    expect(hold).toBeLessThan(260);
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
