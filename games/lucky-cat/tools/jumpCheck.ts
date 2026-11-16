// Real-engine clearance checks for the reshaped cracked gaps: one rise, varied holds, no luck spent.
import { fileURLToPath } from 'node:url';
import { parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { SCAN } from '../../kit/starter/ids';
import { buildLevels } from '../src/levels';
import { mirrored } from './routeKit';

export async function checkJumps(): Promise<void> {
  const files = readDisk(fileURLToPath(new URL('../disk', import.meta.url)));
  const game = parseGame(files.get('lucky.gam')!);
  let gaps = 0;
  for (const [i, l] of buildLevels().levels.entries()) {
    const crack = l.book.index.get('crack');
    if (crack === undefined) continue;
    for (const [at, block] of l.map.done().blocks.entries()) {
      if (block !== crack) continue;
      const col = (at % MLEN) - ORIGIN;
      const row = Math.floor(at / MLEN) - ORIGIN;
      const spawn = (): StarterBot => {
        const trial = structuredClone(game);
        trial.scenes[0].links[0].toScene = i + 2;
        trial.scenes[0].links[0].to = { x: col - 1 + ORIGIN, y: row - 1 + ORIGIN };
        const disk = new Map(files);
        disk.set('lucky.gam', serializeGame(trial));
        return new StarterBot(new GameSim(disk, 1));
      };
      for (const hold of [6, 8, 10, 12]) {
        const bot = spawn();
        bot.jumpHold = hold;
        const jump = async () => {
          await bot.land();
          const hp = bot.sim.ci.hitpts;
          const out = await bot.jump('right', col + 2);
          if (out || bot.sim.ci.hitpts !== hp || bot.px.x < (col + 1) * 20)
            throw new Error(`${l.title} crack ${col},${row}: hold ${hold} failed (${out}, luck ${hp} -> ${bot.sim.ci.hitpts})`);
        };
        if (l.chr === 'mirror') await mirrored(bot, jump);
        else await jump();
      }
      // A plain walk must still touch the crack: the reshaping keeps a jump lesson.
      const bot = spawn();
      const walk = async () => {
        await bot.land();
        const hp = bot.sim.ci.hitpts;
        bot.sim.press(SCAN.right);
        await bot.wait(20);
        bot.sim.releaseAll();
        if (bot.sim.ci.hitpts === hp) throw new Error(`${l.title} crack ${col},${row}: walking bypasses the crack`);
      };
      if (l.chr === 'mirror') await mirrored(bot, walk);
      else await walk();
      gaps++;
    }
  }
  // The unchanged mirror pillars must also clear in one flight, including the reverse approach.
  for (const [scene, col, goal, dir] of [
    [4, 14, 18, 'right'],
    [4, 42, 45, 'right'],
    [8, 62, 59, 'left'],
    [8, 59, 56, 'left'],
    [8, 56, 53, 'left'],
  ] as const) {
    const trial = structuredClone(game);
    trial.scenes[0].links[0].toScene = scene;
    trial.scenes[0].links[0].to = { x: col + ORIGIN, y: 9 + ORIGIN };
    const disk = new Map(files);
    disk.set('lucky.gam', serializeGame(trial));
    const bot = new StarterBot(new GameSim(disk, 1));
    bot.jumpHold = 8;
    await mirrored(bot, async () => {
      await bot.land();
      const hp = bot.sim.ci.hitpts;
      const out = await bot.jump(dir, goal);
      const reached = dir === 'right' ? bot.px.x >= goal * 20 : bot.px.x <= goal * 20;
      if (out || !reached || bot.sim.ci.hitpts !== hp) throw new Error(`mirror pillar scene ${scene}, column ${col}: one jump failed`);
    });
  }
  console.log('jumpCheck: all five mirror pillars clear in one flight with hold 8');
  console.log(`jumpCheck: ${gaps} cracked gaps clear in one jump with holds 6, 8, 10 and 12; walking still costs luck`);
}
