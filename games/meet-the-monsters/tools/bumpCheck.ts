// The gentle-hurt check: a scripted player walks into each monster that hurts and stays in it
// for 2 seconds (once pushing on, once standing still). Check contact and the largest HP loss
// from the approach through the end of the wait.
//   cd web && npx vite-node ../games/meet-the-monsters/tools/bumpCheck.ts
import { MON, SCAN } from '../../kit/starter/ids';
import { TICKS_PER_SECOND } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { bumpPassed } from './bumpResult';
import { GRUMP } from '../src/monsters';
import { StarterBot } from '../../kit/starter/bot';
import { play } from './play';

const STAND = Math.round(2 * TICKS_PER_SECOND);
let failed = false;

/** Walks to column `at` (the monster's), then spends 2 seconds there: pushing right, or standing. */
async function bump(player: StarterBot, at: number, monster: number, expectedLoss: number, what: string, push: boolean): Promise<void> {
  const snap = player.snapshot();
  const sim = player.sim;
  const before = sim.ci.hitpts;
  const deaths = sim.deaths;
  let least = before;
  let touched = false;
  // Only the target's collision handler reads these blocks' HP effects. Preserve their values.
  const pictures = new Set(sim.w.mon[monster].pic.map(([pic]) => pic));
  sim.w.mblk = sim.w.mblk.map((block, pic) =>
    pictures.has(pic)
      ? {
          ...block,
          get chHitPt() {
            touched = true;
            return block.chHitPt;
          },
        }
      : block,
  );
  const bot = new (class extends StarterBot {
    override async tick() {
      const result = await super.tick();
      least = Math.min(least, sim.ci.hitpts);
      return result;
    }
  })(sim);
  const out = await bot.walk(at, what);
  if (out) throw new Error(`${what}: ${out}`);
  if (push) sim.press(SCAN.right);
  for (let i = 0; i < STAND; i++) await bot.tick();
  sim.releaseAll();
  const after = sim.ci.hitpts;
  const ok = bumpPassed(before, least, after, sim.deaths - deaths, touched, expectedLoss);
  if (!ok) failed = true;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${what} (${push ? 'pushing on' : 'standing'}): hit points ${before} -> ${after}, least ${least}, contact ${touched}, expected loss ${expectedLoss}`,
  );
  player.restore(snap);
}

const { bot } = await play(1, 0);
for (const push of [false, true]) {
  await bump(bot, 12, MON.gumdrop, 0, 'level 1 gumdrop (harmless)', push);
  await bump(bot, 34, MON.shelly, 10, 'level 1 snail', push);
}
const l1 = await play(1, 1);
for (const push of [false, true]) await bump(l1.bot, 26, GRUMP, 10, 'level 2 gumdrop', push);
if (failed) process.exit(1);
