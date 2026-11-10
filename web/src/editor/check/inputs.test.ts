// Movement that also fires still needs jump templates, rather than a one-tick use action.
import { expect, it } from 'vitest';
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { keyRoles, movesFor } from './inputs';

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
