// Plays the main quest (tools/route.ts) as the walkthrough does and reports the loot that was on
// screen and never taken, scene visit by scene visit, and how long each boss fight took.
//   cd web && npx vite-node ../games/realm/tools/loot.ts       (LOOT=0 for a bot that ignores loot)
import { Bot } from './bot';
import { LootWatch } from './lootwatch';
import { ROUTE } from './route';
import { GameSim } from './sim';

const sim = new GameSim(undefined, 1);
const bot = new Bot(sim);
bot.loot = process.env.LOOT !== '0';
const watch = new LootWatch(sim);
let ticks = 0;
const tick = sim.tick.bind(sim);
sim.tick = async () => {
  ticks++;
  return tick();
};
for (const [name, step] of ROUTE) {
  await step(bot);
  console.log(`${name}: ${bot.log[bot.log.length - 1]}`);
}
const total = watch.done();
for (const v of watch.visits) console.log(`${v.scene}: ${v.seen} seen, ${v.left.length} left${v.left.length ? `: ${v.left.join('; ')}` : ''}`);
console.log(
  `loot: ${total.seen} seen on screen, ${total.left} left behind; gold ${sim.money}; ${ticks} ticks (${(ticks / 18.2 / 60).toFixed(1)} min); deaths ${sim.deaths}`,
);
// boss fights: from reaching the boss to beating it
for (const line of bot.log) {
  const m = /\] (.+) beaten \(never more than (\d+) .* t(\d+)/.exec(line);
  if (!m) continue;
  const at = bot.log.find((l) => l.includes(`fighting ${m[1]} @`));
  const t0 = at ? Number(/ t(\d+)/.exec(at)![1]) : NaN;
  console.log(`boss ${m[1]}: ${Number(m[3]) - t0} ticks (${((Number(m[3]) - t0) / 18.2).toFixed(1)} s), at most ${m[2]} blocks from the boss`);
}
