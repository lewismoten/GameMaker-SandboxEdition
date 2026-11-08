// Final Curtain's Evidence sheet (games/sleuth/printables.json) is a copy of what the game builds
// from games/sleuth/src/prints: the same suspects, patterns, seeds and the same dagger owner as
// the stage door's right card. The prints themselves come out the same every time and differ.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PrintsItem, SpyglassItem } from './sleuthTypes';
import { printMask } from './fingerprint';
import { CYAN_INK, PRINT_CYAN_INK, DECOY_INKS, LINE_INKS, FIELD_INK, throughRedFilm } from './redFilm';
import { DAGGER_PRINT, DOOR_ANSWER, PRINT_SPECS } from '../../../../games/sleuth/src/prints/prints';

const file = join(__dirname, '../../../../games/sleuth/printables.json');
const items = JSON.parse(readFileSync(file, 'utf8')).items as { kind: string }[];
const prints = items.find((i) => i.kind === 'prints') as PrintsItem;
const glass = items.find((i) => i.kind === 'spyglass') as SpyglassItem;

describe('Final Curtain: the Evidence sheet matches the game', () => {
  it('is in the box with its spyglass', () => {
    expect(prints).toBeDefined();
    expect(glass.steps.length).toBeGreaterThan(2);
  });

  it('has the game’s suspects, patterns and seeds', () => {
    expect(prints.suspects.map((s) => ({ name: s.name, role: s.role, pattern: s.pattern, seed: s.seed, ridges: s.ridges }))).toEqual(
      PRINT_SPECS.map((s) => ({ name: s.name, role: s.role, pattern: s.pattern, seed: s.seed, ridges: s.ridges })),
    );
  });

  it('lifts the dagger’s print from the stage door’s right card', () => {
    expect(PRINT_SPECS[prints.lifted.suspect].who).toBe(DOOR_ANSWER);
    expect(DAGGER_PRINT.who).toBe(DOOR_ANSWER);
    expect(prints.lifted.turn).toBe(DAGGER_PRINT.turn);
    expect(prints.lifted.shift).toEqual(DAGGER_PRINT.shift);
    expect(prints.lifted.seed).toBe(DAGGER_PRINT.seed);
  });
});

describe('fingerprints from a seed', () => {
  const N = 96;
  const [a, b, c] = prints.suspects;
  const diff = (x: Float32Array, y: Float32Array) => x.reduce((t, v, i) => t + Math.abs(v - y[i]), 0) / x.length;

  it('always come out the same', () => {
    expect(printMask(a, N)).toEqual(printMask(a, N));
  });

  it('are different for each suspect, and have ink on them', () => {
    for (const s of prints.suspects) {
      const m = printMask(s, N);
      const ink = m.reduce((t, v) => t + v, 0) / m.length;
      expect(ink, s.name).toBeGreaterThan(0.1);
      expect(ink, s.name).toBeLessThan(0.6);
    }
    expect(diff(printMask(a, N), printMask(b, N))).toBeGreaterThan(0.1);
    expect(diff(printMask(b, N), printMask(c, N))).toBeGreaterThan(0.1);
  });

  it('lifted from the owner it is a turned, patchy copy, not another card', () => {
    const lift = { turn: prints.lifted.turn, shift: prints.lifted.shift, seed: prints.lifted.seed };
    const owner = prints.suspects[prints.lifted.suspect];
    const lifted = printMask(owner, N, lift);
    expect(diff(lifted, printMask(owner, N))).toBeGreaterThan(0.05);
    expect(lifted.some((v) => v > 0.9)).toBe(true);
  });
});

describe('the hidden ink', () => {
  it('vanishes under red film except the ridges: every decoy, line and the field has full red', () => {
    for (const ink of [...DECOY_INKS, ...LINE_INKS, FIELD_INK]) expect(throughRedFilm(ink)).toBe(255);
    expect(throughRedFilm(CYAN_INK)).toBeLessThan(230);
    expect(throughRedFilm(PRINT_CYAN_INK)).toBeLessThan(180);
  });
});
