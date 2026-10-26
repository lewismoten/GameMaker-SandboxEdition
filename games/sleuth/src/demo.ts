// demo.rec: what the title screen plays when nobody touches the keyboard. The bot plays
// the start of Act One (the key and the seating chart in the box office, through the
// house to the wings, the lens from the props room, the ticket stub it reveals under the
// prop table and Felix's checklist), then presses Esc.
import { serializeRecording } from '../../../web/src/formats/recording';
import { GameSim } from '../tools/sim';
import { Bot } from '../tools/bot';
import { act1 } from '../tools/route';
import { SCAN } from './ids';

export async function demoRecording(files: Map<string, Uint8Array>): Promise<Uint8Array> {
  const bot = new Bot(new GameSim(files));
  await act1(bot, true);
  await bot.key(SCAN.z, 2, 30);
  const keys = bot.sim.keys;
  keys.push({ delta: 20, key: SCAN.esc }, { delta: 2, key: SCAN.esc | 0x80 });
  return serializeRecording(keys);
}
