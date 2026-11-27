// The inventory Starter's recorded drop cancellation leaves the following movement in play.
import { expect, it } from 'vitest';
import { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { pickDropSlot } from '@lewismoten/gamemaker-sandbox-engine/engine/funcKeys';
import { diskFiles } from '../../games/kit/walkthrough';
import { GameSim } from '../../games/inventory/tools/sim';
import { SCAN_DROP, SCAN_RIGHT } from '../../games/inventory/src/hero';
import { encodeKeys, type Walkthrough } from '../src/walkthrough/format';
import { headlessCanvas, SegmentRecorder, WalkAudio } from '../src/walkthrough/runtime';

it('replays Esc in the drop picker and moves right with the item still packed', async () => {
  const sim = new GameSim();
  sim.ci.inv[0] = 1;
  sim.press(SCAN_DROP);
  await sim.tick();
  await sim.tick();
  sim.release(SCAN_DROP);
  const start = sim.pos;
  sim.press(SCAN_RIGHT);
  for (let i = 0; i < 12; i++) await sim.tick();
  sim.release(SCAN_RIGHT);
  expect(sim.pos.x * 20 + sim.pos.sx).toBeGreaterThan(start.x * 20 + start.sx);
  expect(sim.ci.inv[0]).toBe(1);

  const segment = sim.segments[0];
  const replay = new SegmentRecorder({ segments: [{ scene: segment.scene, keys: encodeKeys(segment.keys) }] } as Walkthrough);
  replay.begin();
  replay.enterScene(segment.scene);
  expect(replay.doPlayback()).toEqual([SCAN_DROP]);
  const machine = new Machine(headlessCanvas(), diskFiles('inventory'), new WalkAudio(), { frames: 'manual', input: false });
  machine.keyPollOnce = () => {
    const keys = replay.pollOnce();
    expect(keys).toEqual([1, 0x81]);
    return keys;
  };
  try {
    expect(await pickDropSlot(machine, sim.w)).toBe(-1);
  } finally {
    machine.destroy();
  }
  expect(replay.doPlayback()).toEqual([SCAN_DROP | 0x80, SCAN_RIGHT]);
});
