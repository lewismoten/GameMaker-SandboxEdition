// demo.rec: what the title screen plays when nobody touches the keyboard. The play-testing
// bot walks Joe around the reading room: past Teddy, up to the Word Counter (still jammed),
// over to the Reserve Stacks door and back to the door of Clown Alley, then presses Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';
import type { Compiled } from './compile';
import { sceneIds } from './game';
import { Bot, hazardsOf, windowBox } from '../tools/bot';

export async function demoRecording(all: Compiled): Promise<Uint8Array> {
  const { game, hub, chr, cb } = all;
  const bot = new Bot(game, { library: { area: hub.area, names: hub.area.mons.names, hazards: hazardsOf(hub.area) } }, chr, cb.build());
  bot.enter(sceneIds().room, hub.room.entry);
  await bot.ticks(20);
  const box = windowBox(0, 0);
  for (const [x, y] of [
    [3, 5],
    [3, 2],
    [6, 2],
    [8, 2],
    [12, 3],
    [14, 5],
    [10, 7],
    [9, 8],
    [3, 3],
  ] as const) {
    await bot.walk(
      () => [{ x, y }],
      box,
      () => false,
      false,
      600,
    );
    await bot.ticks(6);
  }
  if (bot.sim.link >= 0) throw new Error('The demo walked through a door');
  const keys: RecordedKey[] = [];
  let last = 0;
  for (const k of bot.keys) {
    const at = k.tick + 1;
    keys.push({ delta: at - last, key: k.key });
    last = at;
  }
  // a look around, then Esc (and its release) back to the menu
  keys.push({ delta: 40, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
