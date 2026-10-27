// The touch d-pad's keys and the strip's leftovers, for made-up sequences and real characters.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emptyFrame, parseCharacter, type Sequence } from '../formats/character';
import { padPlan, sectorOf, sequenceSector } from './moveKeys';

const file = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url));
const chr = (path: string) => parseCharacter(file(path)).sequences;

/** A sequence on scan code `scan` whose frames step by `steps` ('M' fires a monster). */
function seq(scan: number, ...steps: ([number, number] | 'M')[]): Sequence {
  const frames = steps.map((s) => (s === 'M' ? { ...emptyFrame(), pic1: 3, pic2: 100 } : { ...emptyFrame(), x: s[0], y: s[1] }));
  frames.push(emptyFrame(true));
  return { frames, key: scan << 8, sound: 30, on: 1, bloc: 150, ground: 0, jstkBut: 4, jstkMov: 0, norepeat: 0, momentum: 0, xtra: new Uint8Array(0) };
}
/** Five built-in sequences with no keys, then `rest`. */
const withBuiltIns = (...rest: Sequence[]) => [...Array.from({ length: 5 }, () => seq(0)), ...rest];

const W = 17;
const A = 30;
const S = 31;
const D = 32;
const Q = 16;
const E = 18;
const SPACE = 57;
const [UP, LEFT, RIGHT, DOWN, HOME, PGUP, END, PGDN] = [72, 75, 77, 80, 71, 73, 79, 81];
const DIGIT8 = 9;
const shown = (seqs: Sequence[]) => {
  const { covered } = padPlan(seqs);
  return [...new Set(seqs.map((s) => s.key >> 8))].filter((k) => k && !covered.has(k));
};

describe('sequence directions', () => {
  it('names the eight ways, a diagonal when the smaller offset is a quarter of the larger or more', () => {
    expect(sectorOf(5, 0)).toBe(0);
    expect(sectorOf(0, -5)).toBe(-2);
    expect(sectorOf(-8, -24)).toBe(-3);
    expect(sectorOf(-5, -1)).toBe(4);
    expect(sectorOf(4, 4)).toBe(1);
    expect(sectorOf(0, 0)).toBeUndefined();
  });

  it('counts steps one way as a move, and not a jump, a shot or standing still', () => {
    expect(sequenceSector(seq(W, [0, -5], [0, -5]))).toBe(-2);
    expect(sequenceSector(seq(Q, [-4, -12], [-4, -12]))).toBe(-3);
    expect(sequenceSector(seq(SPACE, [0, -10], [0, 10], [0, 5]))).toBeUndefined(); // up and back down
    expect(sequenceSector(seq(SPACE, [0, 0], 'M', [0, 0]))).toBeUndefined(); // a shot
    expect(sequenceSector(seq(SPACE, [1, 0], 'M'))).toBeUndefined(); // more shot than step
    expect(sequenceSector(seq(UP, [0, -8], [0, -8], 'M', [0, -8]))).toBe(-2); // an exhaust puff on the way
    expect(sequenceSector(seq(SPACE))).toBeUndefined();
  });
});

describe('the pad and the strip', () => {
  it('sends the arrows, and hides W A S D that walk just as they do', () => {
    const seqs = withBuiltIns(seq(UP, [0, -5]), seq(DOWN, [0, 5]), seq(LEFT, [-5, 0]), seq(RIGHT, [5, 0]));
    seqs.push(seq(W, [0, -5]), seq(S, [0, 5]), seq(A, [-5, 0]), seq(D, [5, 0]), seq(SPACE, 'M'));
    const plan = padPlan(seqs);
    expect(plan.press[-2]).toEqual([UP]);
    expect(plan.press[-3]).toEqual([UP, LEFT]); // no diagonal move: both halves
    expect(shown(seqs)).toEqual([SPACE]);
  });

  it('keeps a letter that moves differently from its arrow, or does something else', () => {
    const seqs = withBuiltIns(seq(UP, [0, -5]), seq(RIGHT, [5, 0]), seq(W, [0, -12]), seq(D, [9, 0], [5, 0]), seq(E, [0, -10], [0, 10]));
    expect(shown(seqs)).toEqual([W, D, E]);
  });

  it('sends a game’s own move key where its arrow starts nothing (top-row 8 for up)', () => {
    const seqs = withBuiltIns(seq(DIGIT8, [0, -4]), seq(LEFT, [-4, 0]));
    const plan = padPlan(seqs);
    expect(plan.press[-2]).toEqual([UP, DIGIT8]);
    expect(plan.press[-3]).toEqual([UP, DIGIT8, LEFT]);
    expect(shown(seqs)).toEqual([]);
  });

  it('sends the keypad’s diagonals, and hides Q and E that do the same', () => {
    const seqs = withBuiltIns(seq(HOME, [-4, -4]), seq(PGUP, [4, -4]), seq(Q, [-4, -4]), seq(E, [4, -4]));
    const plan = padPlan(seqs);
    expect(plan.press[-3]).toEqual([HOME]);
    expect(plan.press[-1]).toEqual([PGUP]);
    expect(shown(seqs)).toEqual([]);
  });

  it('sends Q and E for the diagonals when the keypad has none', () => {
    const seqs = withBuiltIns(seq(UP, [0, -11]), seq(Q, [-5, -11], [-5, -11]), seq(E, [5, -11], [5, -11]));
    const plan = padPlan(seqs);
    expect(plan.press[-3]).toEqual([Q]);
    expect(plan.press[-1]).toEqual([E]);
    expect(shown(seqs)).toEqual([]);
  });

  it('leaves a keypad diagonal that fires on the strip, and steers that way with the arrows', () => {
    const seqs = withBuiltIns(seq(UP, [0, -5]), seq(LEFT, [-5, 0]), seq(HOME, 'M', [0, 0]));
    expect(padPlan(seqs).press[-3]).toEqual([UP, LEFT]);
    expect(shown(seqs)).toEqual([HOME]);
  });

  it('takes a keypad diagonal that moves within 45° of it (a ship drifting up)', () => {
    const seqs = withBuiltIns(seq(END, [-5, -1], [-5, -1]), seq(PGDN, [5, -1]));
    const plan = padPlan(seqs);
    expect(plan.press[3]).toEqual([END]);
    expect(plan.press[1]).toEqual([PGDN]);
  });

  it('never takes a built-in sequence’s key as a move', () => {
    const seqs = [seq(0), seq(0), seq(0), seq(W, [0, -5]), seq(0)];
    expect(padPlan(seqs).press[-2]).toEqual([UP]);
    expect(shown(seqs)).toEqual([W]);
  });
});

describe('real characters', () => {
  it('Sleuth: only Space and Z stay on the strip', () => {
    const seqs = chr('games/sleuth/disk/ada.chr');
    expect(shown(seqs)).toEqual([SPACE, 44]);
    expect(padPlan(seqs).press[3]).toEqual([END]);
  });

  it('KEEP IT BRIEF!: only Space stays', () => {
    expect(shown(chr('games/brief/disk/joe.chr'))).toEqual([SPACE]);
  });

  it('Virus Blaster: Enter and Space stay, the pad flies the keypad’s diagonals', () => {
    const seqs = chr('games/blaster/disk/ship.chr');
    expect(shown(seqs)).toEqual([28, SPACE]);
    expect(padPlan(seqs).press[-3]).toEqual([HOME]);
    expect(padPlan(seqs).press[3]).toEqual([END]);
  });

  it('Teddy: the pad jumps up-left with Q, and the tricks stay', () => {
    const seqs = chr('games/teddy/disk/teddy.chr');
    expect(padPlan(seqs).press[-3]).toEqual([Q]);
    expect(shown(seqs)).not.toContain(Q);
    expect(shown(seqs)).not.toContain(W);
    expect(shown(seqs)).toContain(SPACE);
  });

  it('a CD game with keypad diagonals: the pad sends them', () => {
    const plan = padPlan(chr('cd/gameware/glub/glub.chr'));
    expect([plan.press[-3], plan.press[-1], plan.press[3], plan.press[1]]).toEqual([[HOME], [PGUP], [END], [PGDN]]);
  });
});
