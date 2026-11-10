// The human strategy prefers common controls even when an extra key moves faster.
import { expect, it } from 'vitest';
import { parseCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { BASIC_KEYS } from '../keyLimit';
import { startCharInfo } from '../sim';
import { testGame } from '../testGame';
import { humanRoute } from './humanRoute';

it('takes visible rewards using basic keys before considering faster extra controls', async () => {
  const t = testGame(['##########', '#........#', '#S....c.E#', '##########']);
  const chr = parseCharacter(t.get('test.chr')!);
  const fast = chr.sequences[8];
  fast.key = 0x1200;
  for (let i = 0; i < 4; i++) Object.assign(fast.frames[i], { x: 20, y: 0, pic1: 0, pic2: 1, pause: 1 });
  t.files.set('test.chr', serializeCharacter(chr));
  const r = await humanRoute(t.game, t, 2, { start: { x: 1, y: 2 }, ci: startCharInfo(), clock: 1 }, [208], new Set([0]), 2000);
  expect(r?.link).toBe(0);
  expect(r!.ci.score).toBeGreaterThan(0);
  expect(r!.events.every((event) => BASIC_KEYS.has(event.key & 0x7f))).toBe(true);
});
