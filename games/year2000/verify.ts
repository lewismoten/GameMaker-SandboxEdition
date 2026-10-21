// Play-tests every level in the simulator: a bot collects what it can reach, opens the
// doors, dials the right phone booths and walks out the exit, carrying its counters
// from level to level like the real game does.
//   cd web && npx vite-node ../games/year2000/verify.ts      (GOD=1 keeps the bot alive)
import { newCharInfo } from '../../web/src/engine/world';
import { buildCharacter } from './character';
import { CTR, MON, PAGES_NEEDED, SEQ } from './src/ids';
import { LEVELS, SETS } from './levels';
import { DIALS } from './level4';
import { buildMonsters } from './monsters';
import { Sim, type SimScene } from './sim';
import { Bot } from './bot';
import { buildCharBlocks, buildMonsterBlocks } from './src/sprites/sprites';

const god = !!process.env.GOD;
const mb = buildMonsterBlocks();
const mbl = mb.build();
const mons = buildMonsters(mb);
const cb = buildCharBlocks();
const cbl = cb.build();
const chars = { 'dex.chr': buildCharacter(cb, false), 'moon.chr': buildCharacter(cb, true) };
const ci = newCharInfo();
const ROBOTS = new Set<number>([
  MON.mowerH,
  MON.mowerV,
  MON.mowerBox,
  MON.dog,
  MON.paperbot,
  MON.faxbot,
  MON.secbot,
  MON.secbotPatrol,
  MON.cart,
  MON.cartV,
  MON.shopper,
  MON.telemarketer,
  MON.static,
  MON.fish,
  MON.fishV,
  MON.sparky,
  MON.sparky2,
  MON.sparky3,
]);
const ITEMS = /^(page|quarter|remote|zapper|battery|keycard|pass|cola)_/;
let totalTicks = 0;
let deaths = 0;

for (const [i, l] of LEVELS.entries()) {
  const set = SETS[l.set]();
  const bbl = set.build();
  const lm = l.build(set);
  const map = lm.done();
  const names = set.names;
  const avoid = new Set(['booth_door'].map((n) => set.id(n)));
  const links: SimScene['links'] = [];
  if (l.file === 'exchange') for (const [from, to] of DIALS) links.push({ from: lm.at(from), to: lm.at(to) });
  links.push({ from: lm.at('exit'), to: { x: 0, y: 0 } });
  const scene: SimScene = { map, bbl, mbl, mon: mons, chr: chars[l.chr], cbl, links };
  const startAt = lm.marks.has('start') ? lm.at('start') : lm.at('hall');
  let sim = new Sim(scene, startAt, ci, 7 + i);
  let arrival = startAt;
  const fresh = (at: { x: number; y: number }) => (sim = new Sim(scene, at, ci, 11 + i));
  const opts = { god, zapAt: (n: number) => ROBOTS.has(n), avoid };
  let bot = new Bot(sim, opts);
  const pages0 = ci.meter[CTR.pages];
  const lives0 = ci.lives;
  let outcome = '';

  const run = async (): Promise<boolean> => {
    if (l.file === 'exchange') {
      // Dial around the exchange: 1 -> Florida -> the sea -> the TV -> the jungle -> the launch pad.
      const DOOR: Record<string, string> = { hall: 'hall1', florida: 'floridaOut', sea: 'seaOut', tv: 'tvOut', jungle: 'jungleOut' };
      const roomOf = (p: { x: number; y: number }) => [...lm.marks].find(([, [x, y]]) => x === p.x && y === p.y)?.[0] ?? 'hall';
      for (let room = roomOf(arrival); room !== 'launch'; room = roomOf(arrival)) {
        const door = DOOR[room];
        await bot.collect(names, (n) => /^quarter_/.test(n), 'quarters');
        if (!(await bot.goTo([[lm.at(door).x, lm.at(door).y]], door))) return false;
        if (sim.link < 0) return false;
        const to = links[sim.link].to;
        arrival = to;
        fresh(to);
        bot = new Bot(sim, opts);
      }
      return bot.goTo([[lm.at('exit').x, lm.at('exit').y]], 'the rocket');
    }
    await bot.collect(names, (n) => ITEMS.test(n), 'items');
    if (l.file === 'school') {
      // Catch Sparky: chase him until the cover page drops, then pick it up.
      for (let t = 0; t < 4000 && ci.meter[CTR.cover] <= 1; t++) {
        const w = sim.w;
        const mm = w.mm.findIndex(
          (m) => m.monnum === MON.sparky || m.monnum === MON.sparky2 || m.monnum === MON.sparky3 || m.monnum === MON.sparkyDizzy || m.monnum === MON.cover,
        );
        if (mm < 0) break;
        const [sx, sy] = [w.mi[mm].curx[0], w.mi[mm].cury[0]];
        // He may be half inside a table: any block next to him will do.
        await bot.goTo(
          [
            [sx, sy],
            [sx + 1, sy],
            [sx - 1, sy],
            [sx, sy + 1],
            [sx, sy - 1],
          ],
          `Sparky at ${sx},${sy}`,
        );
        if (sim.dead) return false;
        if (ci.meter[SEQ.zap] <= 0) await bot.collect(names, (n) => /^battery_/.test(n), 'batteries');
      }
    }
    if (l.file === 'school')
      bot.log.push(
        `cover ${ci.meter[CTR.cover]}, monsters: ${sim.w.mm
          .filter((m) => m.monnum < 64)
          .map((m) => m.monnum)
          .join(' ')}`,
      );
    const exit = lm.at('exit');
    return bot.goTo([[exit.x, exit.y]], 'exit');
  };
  let ok = await run();
  let levelDeaths = 0;
  // Like PLAYGAME: a death costs a life and restarts the level (counters are kept).
  while (sim.dead && ci.lives > 0 && levelDeaths < 8) {
    levelDeaths++;
    deaths++;
    totalTicks += sim.ticks;
    ci.lives--;
    ci.hitpts = -1;
    fresh(arrival);
    bot = new Bot(sim, opts);
    ok = await run();
  }
  outcome = (ok && sim.link >= 0 ? 'EXIT' : sim.dead ? 'DIED' : 'STUCK') + ` (${levelDeaths} deaths)`;
  totalTicks += sim.ticks;
  console.log(
    `${i + 1}. ${l.desc.padEnd(18)} ${outcome}  ${(sim.ticks / 18.2).toFixed(0)}s  pages ${pages0 - 1}->${ci.meter[CTR.pages] - 1}  quarters ${ci.meter[CTR.quarters] - 1}  zap ${ci.meter[SEQ.zap]}  hp ${ci.hitpts}  lives ${lives0}->${ci.lives}  score ${ci.score}`,
  );
  for (const s of bot.log) console.log('   ', s);
  if (!outcome.startsWith('EXIT')) break;
}
console.log(`${(totalTicks / 18.2 / 60).toFixed(1)} minutes; ${ci.meter[CTR.pages] - 1} pages (need ${PAGES_NEEDED}); deaths ${deaths}`);
