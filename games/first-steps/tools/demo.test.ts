// Play the title recording with the character and wall from the built disk.
import { expect, it } from 'vitest';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { SCAN } from '../../kit/starter/ids';
import { GameSim } from './sim';
import { ORIGIN } from '../../kit/starter/map';

it('shows Kit crossing the two-block wall before the title demo ends', async () => {
  const sim = new GameSim(undefined, 1);
  const recording = sim.game.scenes[0].files[11];
  expect(recording).toBe('demo.rec');
  const keys = parseRecording(sim.files.get(recording)!);
  let crossed = false;
  for (const { delta, key } of keys) {
    for (let t = 0; t < delta; t++) {
      await sim.tick();
      if (sim.pos.x >= ORIGIN + 36) crossed = true;
    }
    if (key === 1) break;
    if (key & 128) sim.release(key & 127);
    else sim.press(key);
  }
  expect(crossed).toBe(true);
});

it('lets a held rise carry Kit above the top of the no-gravity ladder', async () => {
  const files = new Map(new GameSim().files);
  const game = parseGame(files.get('steps.gam')!);
  const entrance = game.scenes[0].links[0];
  entrance.toScene = game.scenes.findIndex((scene) => scene.files.includes('climb.map'));
  entrance.to = { x: ORIGIN + 14, y: ORIGIN + 14 };
  files.set('steps.gam', serializeGame(game));
  const sim = new GameSim(files, 1);
  sim.press(SCAN.space);
  let highest = sim.pos.y;
  for (let tick = 0; tick < 40; tick++) {
    await sim.tick();
    highest = Math.min(highest, sim.pos.y);
  }
  expect(highest).toBeLessThanOrEqual(ORIGIN + 4);
});
