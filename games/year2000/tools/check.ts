// Play-tests every level in the simulator: a bot collects what it can reach, opens the
// doors, dials the right phone booths and walks out the exit, carrying its counters
// from level to level like the real game does. The multi-block objects are checked first (tools/align.ts).
//   cd web && npx vite-node ../games/year2000/tools/check.ts      (GOD=1 keeps the bot alive)
import { newCharInfo } from '../../../web/src/engine/world';
import { buildCarCharacter, buildCharacter } from '../src/characters/character';
import { CTR, MON, PAGES_NEEDED, SEQ } from '../src/ids';
import { LEVELS, SETS } from '../src/levels/levels';
import { DIALS } from '../src/levels/level4';
import { buildMonsters } from '../src/characters/monsters';
import { buildSkyMonsters } from '../src/characters/skyMonsters';
import { buildSkyMonsterBlocks } from '../src/sprites/skySprites';
import { FlyBot } from './flyBot';
import { Sim, type SimScene } from './sim';
import { readWalkPaths } from '../../kit/walkPaths';
import { Bot } from './bot';
import { buildCharBlocks, buildMonsterBlocks } from '../src/sprites/sprites';
import { align } from './align';

if (align()) throw new Error('year2000: a multi-block object is out of line (above)');

const god = !!process.env.GOD;
const mb = buildMonsterBlocks();
const mbl = mb.build();
const mons = buildMonsters(mb);
const cb = buildCharBlocks();
const cbl = cb.build();
const chars = { 'dex.chr': buildCharacter(cb, false), 'moon.chr': buildCharacter(cb, true), 'car.chr': buildCarCharacter(cb) };
// the Cloud Lane's own traffic
const skyMb = buildSkyMonsterBlocks();
const sky = { mbl: skyMb.build(), mon: buildSkyMonsters(skyMb) };
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
const ITEMS = /^(page|quarter|pill|remote|zapper|battery|keycard|pass|cola)_/;
let totalTicks = 0;
let deaths = 0;
/** Pages carried into the Science Fair (the judges take 20 of them there). */
let pagesAtFair = 0;

/** Catch Sparky: chase him until the cover page drops, then pick it up. False if Dex died. */
async function catchSparky(bot: Bot, names: string[]): Promise<boolean> {
  const { sim } = bot;
  const ci = sim.w.ci;
  for (let t = 0; t < 4000 && ci.meter[CTR.cover] <= 1; t++) {
    const w = sim.w;
    const mm = w.mm.findIndex(
      (m) =>
        m.monnum === MON.sparky ||
        m.monnum === MON.sparky2 ||
        m.monnum === MON.sparky3 ||
        m.monnum === MON.sparkyDizzy ||
        m.monnum === MON.sparkyFetch ||
        m.monnum === MON.cover,
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
  return true;
}

/**
 * A player who skipped every page and the Zapper on the way reaches the fair with nothing: the
 * fair's own pages and batteries, Sparky and the copier must still get them to the podium.
 */
async function shortOfPages(): Promise<void> {
  const l = LEVELS.find((v) => v.file === 'school')!;
  const set = SETS[l.set]();
  const lm = l.build(set);
  const scene: SimScene = { map: lm.done(), bbl: set.build(), mbl, mon: mons, chr: chars[l.chr], cbl, links: [{ from: lm.at('exit'), to: { x: 0, y: 0 } }] };
  const short = newCharInfo();
  const sim = new Sim(scene, lm.at('start'), short, 17);
  const bot = new Bot(sim, { zapAt: (n) => ROBOTS.has(n), avoid: new Set([set.id('sparecover')]) });
  const pages = () => short.meter[CTR.pages] - 1;
  const zaps0 = short.meter[SEQ.zap];
  await bot.collect(set.names, (n) => ITEMS.test(n), 'items');
  const found = pages();
  if (!(await catchSparky(bot, set.names))) throw new Error('year2000: short of pages, Dex died catching Sparky');
  const tray = bot.find(set.names, (n) => n === 'copiertray');
  if (!(await bot.goTo(tray, 'the copier'))) throw new Error('year2000: short of pages, no way to the copier');
  const t0 = sim.ticks;
  while (pages() < PAGES_NEEDED && sim.ticks - t0 < 3000) if (!(await bot.tick())) break;
  const waited = sim.ticks - t0;
  const ok = (await bot.goTo([[lm.at('exit').x, lm.at('exit').y]], 'exit')) && sim.link >= 0 && !sim.dead;
  for (const s of bot.log) console.log('   ', s);
  if (!ok) throw new Error(`year2000: short of pages, the bot did not finish (${pages()} pages, cover ${short.meter[CTR.cover] - 1})`);
  console.log(
    `short of pages: arrived with 0 pages and ${zaps0} zaps, found ${found} at the fair, waited ${(waited / 18.2).toFixed(0)}s at the copier, won in ${(sim.ticks / 18.2).toFixed(0)}s`,
  );
}

/**
 * A player whose cover page a stray zap burned: Sparky's is gone, so the one spare cover beside
 * the copier must get them to the podium. There is only one, and it is worth one cover.
 */
async function spareCover(): Promise<void> {
  const l = LEVELS.find((v) => v.file === 'school')!;
  const set = SETS[l.set]();
  const lm = l.build(set);
  const scene: SimScene = { map: lm.done(), bbl: set.build(), mbl, mon: mons, chr: chars[l.chr], cbl, links: [{ from: lm.at('exit'), to: { x: 0, y: 0 } }] };
  const lost = newCharInfo();
  const sim = new Sim(scene, lm.at('start'), lost, 19);
  lost.meter[CTR.pages] = PAGES_NEEDED + 1; // a new game's counters are set as the scene starts
  const bot = new Bot(sim, { zapAt: () => false });
  const spare = bot.find(set.names, (n) => n === 'sparecover');
  if (spare.length !== 1) throw new Error(`year2000: ${spare.length} spare covers in the gym (want 1)`);
  if (!(await bot.goTo(spare, 'the spare cover'))) throw new Error('year2000: no way to the spare cover');
  if (lost.meter[CTR.cover] !== 2) throw new Error(`year2000: the spare cover left the counter at ${lost.meter[CTR.cover] - 1} (want 1)`);
  const ok = (await bot.goTo([[lm.at('exit').x, lm.at('exit').y]], 'exit')) && sim.link >= 0 && !sim.dead;
  if (!ok)
    throw new Error(
      `year2000: with the spare cover, the bot did not finish (cover ${lost.meter[CTR.cover] - 1}, pages ${lost.meter[CTR.pages] - 1}, dead ${sim.dead})`,
    );
  console.log(`spare cover: Sparky's cover lost, took the spare beside the copier, won in ${(sim.ticks / 18.2).toFixed(0)}s`);
}

for (const [i, l] of LEVELS.entries()) {
  const set = SETS[l.set]();
  const bbl = set.build();
  const lm = l.build(set);
  const map = lm.done();
  const names = set.names;
  // the spare cover is for a player whose cover a zap burned: the bot brings back Sparky's
  const avoid = new Set(['booth_door', 'sparecover'].filter((n) => set.has(n)).map((n) => set.id(n)));
  // never the tin heart or the Easter egg: they're left for the player to find
  set.names.forEach((n, i) => /^(tinHeart|easterEgg)\d*$/.test(n) && avoid.add(i));
  const links: SimScene['links'] = [];
  if (l.file === 'exchange') for (const [from, to] of DIALS) links.push({ from: lm.at(from), to: lm.at(to) });
  links.push({ from: lm.at('exit'), to: { x: 0, y: 0 } });
  const scene: SimScene = { map, bbl, ...(l.mon === 'sky' ? sky : { mbl, mon: mons }), chr: chars[l.chr], cbl, links };
  const startAt = lm.marks.has('start') ? lm.at('start') : lm.at('hall');
  let sim = new Sim(scene, startAt, ci, 7 + i);
  let arrival = startAt;
  const fresh = (at: { x: number; y: number }) => (sim = new Sim(scene, at, ci, 11 + i));
  // along the sidewalks, as a person walks (walkPaths.json, written by the build)
  const walks = readWalkPaths('year2000')[`${l.set}.bbl`];
  const paths = walks && new Set(walks);
  const opts = { god, zapAt: (n: number) => ROBOTS.has(n), avoid, paths };
  let bot = new Bot(sim, opts);
  const pages0 = ci.meter[CTR.pages];
  if (l.file === 'school') pagesAtFair = pages0 - 1;
  const lives0 = ci.lives;
  let outcome = '';

  const run = async (): Promise<boolean> => {
    if (l.file === 'clouds') {
      // Steer clear of the traffic until the ramp opens, then ride it up onto the link.
      const fly = new FlyBot(sim);
      const ok = await fly.fly();
      bot.log.push(...fly.log);
      return ok;
    }
    if (l.file === 'exchange') {
      // Dial around the exchange: 1 -> Florida -> the sea -> the TV -> the jungle -> the launch pad.
      const DOOR: Record<string, string> = { hall: 'hall1', florida: 'floridaOut', sea: 'seaOut', tv: 'tvOut', jungle: 'jungleOut' };
      const roomOf = (p: { x: number; y: number }) => [...lm.marks].find(([, [x, y]]) => x === p.x && y === p.y)?.[0] ?? 'hall';
      for (let room = roomOf(arrival); room !== 'launch'; room = roomOf(arrival)) {
        const door = DOOR[room];
        await bot.collect(names, (n) => /^(quarter|pill)_/.test(n), 'quarters and pills');
        if (!(await bot.goTo([[lm.at(door).x, lm.at(door).y]], door))) return false;
        if (sim.link < 0) return false;
        const to = links[sim.link].to;
        arrival = to;
        fresh(to);
        bot = new Bot(sim, opts);
      }
      return bot.board(lm.at('exit'));
    }
    await bot.collect(names, (n) => ITEMS.test(n), 'items');
    if (l.file === 'school' && !(await catchSparky(bot, names))) return false;
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
  if (!outcome.startsWith('EXIT')) throw new Error(`year2000: ${l.desc}: ${outcome}`);
}
console.log(`${(totalTicks / 18.2 / 60).toFixed(1)} minutes; ${pagesAtFair} pages at the fair (need ${PAGES_NEEDED}); deaths ${deaths}`);
// The bot must win clean: every level exited, every page found, and no life lost.
if (!god && deaths) throw new Error(`year2000: the bot lost ${deaths} ${deaths === 1 ? 'life' : 'lives'}`);
if (pagesAtFair < PAGES_NEEDED) throw new Error(`year2000: only ${pagesAtFair} of ${PAGES_NEEDED} pages reached the fair`);
await shortOfPages();
await spareCover();
