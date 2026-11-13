// Loaf's complete route must not require letter or keypad keys.
import { expect, it } from 'vitest';
import { play } from '../../games/loaf/tools/play';

it('wins with raw arrows, Space and Enter without losing a life', async () => {
  const { sim } = await play();
  expect(sim.ended).toBe('won');
  expect(sim.deaths).toBe(0);
  const downs = sim.segments
    .flatMap((s) => s.keys)
    .map((e) => e.key)
    .filter((k) => !(k & 0x80));
  expect(downs.filter((k) => ![72, 80, 75, 77, 57, 28].includes(k))).toEqual([]);
}, 30000);
