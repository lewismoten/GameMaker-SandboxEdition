// demo.rec: what the title screen plays when nobody touches the keyboard. The play-testing bot
// plays the start of the library on the disk being built: a look at the storybook, a walk past
// the shelves toward the workbench, and then Esc back to the menu.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';
import { Bot } from '../tools/bot';
import { GameSim } from '../tools/sim';
import { SCENE } from './ids';
import { at } from './levels/stamp';

export async function demoRecording(files: Map<string, Uint8Array>): Promise<Uint8Array> {
  const sim = new GameSim(files, 1);
  const bot = new Bot(sim);
  await bot.wait(24);
  for (const [x, y] of [
    [8, 8],
    [8, 2],
    [15, 2],
    [15, 5],
  ]) {
    const c = at(x, y);
    const r = await bot.goto(c.x, c.y, 'demo');
    if (r) throw new Error(`The demo: ${r}`);
    await bot.wait(10);
  }
  if (sim.scene !== SCENE.library) throw new Error('The demo left the library');
  const keys: RecordedKey[] = sim.segments[0].keys.slice();
  const used = keys.reduce((n, k) => n + k.delta, 0);
  keys.push({ delta: sim.ticks + 30 - used, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
