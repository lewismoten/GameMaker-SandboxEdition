// demo.rec: what the title screen plays when nobody touches the keyboard. The play-testing bot
// plays the Pantry on the disk being built: across the kitchen, a squawk at a mouse, the spoon,
// a look at the latch, and then Esc back to the menu before it gives the sassafras away.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';
import type { Compiled } from './compile';
import { ORIGIN } from './levels/room';
import { Bot } from '../tools/bot';
import { GameSim } from '../tools/sim';

export async function demoRecording(all: Compiled, files: Map<string, Uint8Array>): Promise<Uint8Array> {
  const sim = new GameSim(files, 1);
  const bot = new Bot(sim, all);
  await bot.wait(20);
  for (const [x, y] of [
    [9, 4],
    [13, 6],
    [23, 6],
    [23, 10],
    [19, 10],
  ]) {
    const r = await bot.goto(x + ORIGIN.x, y + ORIGIN.y, 'demo');
    if (r) throw new Error(`The demo ${r}`);
    await bot.wait(8);
  }
  if (sim.scene !== 2) throw new Error('The demo left the Pantry');
  const keys: RecordedKey[] = sim.segments[0].keys.slice();
  const used = keys.reduce((n, k) => n + k.delta, 0);
  keys.push({ delta: sim.ticks + 30 - used, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
