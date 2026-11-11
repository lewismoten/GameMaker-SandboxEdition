// A steered jump must recognize the landing after its upward part has ended.
import { expect, it } from 'vitest';
import { parseCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { driveMove } from './drive';
import { steadyMoves } from './inputs';
import { SceneSim } from './sim';
import { testGame } from './testGame';

it.each([9, 12])('lands a jump steered after a %i-tick rise without drifting off the ledge', async (press) => {
  const t = testGame([
    '############',
    '#..........#',
    '#..........#',
    '#..........#',
    '#..........#',
    '#..........#',
    '#...##.....#',
    '#.....S....#',
    '#.....##...#',
    '#..........#',
    '############',
  ]);
  const chr = parseCharacter(t.files.get('test.chr')!);
  for (const seq of [5, 6]) for (const f of chr.sequences[seq].frames) if (f.pic2 !== 51) Object.assign(f, { x: Math.sign(f.x) * 10, pic1: 50, pic2: 0 });
  chr.sequences[7].key = 0x4800;
  chr.sequences[7].frames[0] = { x: 0, y: -10, pic1: 50, pic2: 0, orient: 0, pause: 1, extra: new Uint8Array(5) };
  chr.sequences[0].frames[0].pic1 = 50;
  t.files.set('test.chr', serializeCharacter(chr));
  const sim = new SceneSim(t.game, 2, t, { x: 6, y: 7 });
  const move = steadyMoves(
    [
      {
        name: 'jump then steer to a ledge',
        steps: [
          { keys: [72], until: 'ticks', max: press },
          { keys: [75], until: 'over', max: 40 },
        ],
      },
    ],
    3,
    true,
  )[0];
  await driveMove(sim, move, {
    tick: async () => {
      const r = await sim.tick();
      return r === 'dead' ? 'dead' : r?.link;
    },
  });
  expect(sim.w.chr.y.slice(0, 2)).toEqual([5, 0]);
  expect(sim.w.chr.x[0]).toBe(4);
});

it('replays an active checkpoint before the next step changes its held keys', async () => {
  const t = testGame(['##########', '#........#', '#........#', '#..S.....#', '##########']);
  const sim = new SceneSim(t.game, 2, t, { x: 3, y: 3 });
  const move = steadyMoves(
    [
      {
        name: 'change direction',
        steps: [
          { keys: [77], until: 'ticks', max: 3 },
          { keys: [75], until: 'ticks', max: 3 },
        ],
      },
    ],
    3,
    true,
  )[0];
  const result = await driveMove(sim, move, {
    limit: 3,
    tick: async () => {
      const r = await sim.tick();
      return r === 'dead' ? 'dead' : r?.link;
    },
  });
  expect(result.end).toBe('limit');
  expect([...sim.held]).toEqual([77]);
});
