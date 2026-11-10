// Movement that also fires still needs jump templates, rather than a one-tick use action.
import { expect, it } from 'vitest';
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { keyRoles, movesFor, steadyMoves } from './inputs';

it('holds an upward movement even when the sequence also fires', () => {
  const chr = newCharacter();
  const s = chr.sequences[7];
  s.key = 0x4800;
  Object.assign(s.frames[0], { x: 0, y: 20, pic1: 0, pic2: MONBL });
  Object.assign(s.frames[1], { x: 0, y: -10, pic1: 0, pic2: 1 });
  const roles = keyRoles(chr, true);
  expect(roles.jump).toEqual([{ scan: 0x48, dx: 0, hold: true }]);
  expect(roles.act).not.toContain(0x48);
  expect(movesFor(roles, true).some((m) => m.steps[0].max === 18 && m.steps[0].keys[0] === 0x48)).toBe(true);
});

it('keeps steering chords and direct changes with human-length holds when requested', () => {
  const [move] = steadyMoves(
    [
      {
        name: 'steer',
        steps: [
          { keys: [77, 72], until: 'ticks', max: 1 },
          { keys: [77], until: 'land', max: 60 },
        ],
      },
    ],
    3,
    true,
  );
  expect(move.steps).toEqual([
    { keys: [77, 72], until: 'ticks', max: 3 },
    { keys: [77], until: 'land', max: 60, min: 3 },
  ]);
  expect(move.settle).toBe(3);
});

it('tries a middle hold before steering a repeating jump onto a ledge', () => {
  const moves = movesFor({ move: [{ scan: 77, dx: 1, dy: 0 }], jump: [{ scan: 72, dx: 0, hold: true }], act: [] }, true, true);
  expect(moves.some((m) => m.steps[0].max === 12 && m.steps[1]?.until === 'over')).toBe(true);
});

it('offers sustained horizontal movement through a fall without requiring an ability key', () => {
  const moves = movesFor({ move: [{ scan: 77, dx: 1, dy: 0 }], jump: [], act: [] }, true, true);
  expect(moves.some((m) => m.steps.length === 1 && m.steps[0].keys[0] === 77 && m.steps[0].until === 'ticks' && m.steps[0].max === 36)).toBe(true);
});
