// Reboot is a recovery action, so it must not require R.
import { expect, it } from 'vitest';
import { buildWatt } from '../../games/logic/src/characters/watt';
import { buildWattBlocks } from '../../games/logic/src/sprites/sprites';

it('keeps R and adds an identical Enter reboot without changing pickup or movement', () => {
  const ch = buildWatt(buildWattBlocks(), 0);
  const r = ch.sequences.find((s) => s.key === 0x1372)!;
  const enter = ch.sequences.find((s) => s.key === 0x1c0d);
  expect(enter, 'board recovery needs a basic-key binding').toBeDefined();
  expect({ ...enter, key: r.key }).toEqual(r);
  expect(ch.sequences[3].key).toBe(0x3920);
  for (const scan of [72, 80, 75, 77, 17, 31, 30, 32, 19]) expect(ch.sequences.some((s) => s.key >> 8 === scan)).toBe(true);
});
