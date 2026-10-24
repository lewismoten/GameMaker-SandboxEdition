// Writes games/year2000/walkthrough.json: the bot plays all six levels the way check.ts
// does, carrying its counters from level to level, one key segment each time play enters a
// scene (every dial in the exchange enters it again), and games/kit/walkthrough.ts checks
// the whole run on the real engine (title, story, the six levels, the ending, the credits).
// It never goes near the launch pad's closet.
//   cd web && npx vite-node ../games/year2000/tools/walkthrough.ts
import { newCharInfo } from '../../../web/src/engine/world';
import { buildCharacter } from '../src/characters/character';
import { CTR, MON, SEQ } from '../src/ids';
import { LEVELS, SETS } from '../src/levels/levels';
import { DIALS } from '../src/levels/level4';
import { buildMonsters } from '../src/characters/monsters';
import { Sim, type SimScene } from './sim';
import { Bot } from './bot';
import { buildCharBlocks, buildMonsterBlocks } from '../src/sprites/sprites';
import { encodeKeys, keysAt, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';

/** Every scene starts its monsters' random numbers over from this seed (rand below). */
const SEED = Number(process.env.SEED ?? 7);
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
const ITEMS = /^(page|quarter|pill|remote|zapper|battery|keycard|pass|cola)_/;
const segments: WalkSegment[] = [];
const chapters: WalkChapterMark[] = [];
let deaths = 0;

for (const [i, l] of LEVELS.entries()) {
  const sceneNo = i + 2;
  const set = SETS[l.set]();
  const bbl = set.build();
  const lm = l.build(set);
  const map = lm.done();
  const names = set.names;
  // Booth doors only when dialing; never the closet (its hologram wall, the egg, the hatch).
  const avoid = new Set(['booth_door', 'xwallGlow', 'egg', 'hatch'].filter((n) => set.has(n)).map((n) => set.id(n)));
  // never the tin heart or the Easter egg: they're left for the player to find
  set.names.forEach((n, i) => /^(tinHeart|easterEgg)\d*$/.test(n) && avoid.add(i));
  const links: SimScene['links'] = [];
  if (l.file === 'exchange') for (const [from, to] of DIALS) links.push({ from: lm.at(from), to: lm.at(to) });
  links.push({ from: lm.at('exit'), to: { x: 0, y: 0 } });
  const scene: SimScene = { map, bbl, mbl, mon: mons, chr: chars[l.chr], cbl, links };
  const startAt = lm.marks.has('start') ? lm.at('start') : lm.at('hall');
  const opts = { zapAt: (n: number) => ROBOTS.has(n), avoid };
  let sim!: Sim;
  let bot!: Bot;
  // Each time play enters the scene: a fresh world (seeded like the engine's) and a segment.
  const enter = (at: { x: number; y: number }) => {
    if (sim) close();
    sim = new Sim(scene, at, ci, SEED);
    bot = new Bot(sim, opts);
  };
  // (keys still held when the scene ends need no release: play flushes them as it changes scenes)
  const close = () => {
    segments.push({ scene: sceneNo, keys: encodeKeys(keysAt(sim.log.map(([t, key]) => ({ tick: t + 1, key })))) });
  };
  let arrival = startAt;
  enter(startAt);
  chapters.push({ scene: sceneNo, title: `Level ${i + 1}: ${l.desc}` });

  const run = async (): Promise<boolean> => {
    if (l.file === 'exchange') {
      // Dial around the exchange: 1 -> Florida -> the sea -> the TV -> the jungle -> the launch pad.
      const DOOR: Record<string, string> = { hall: 'hall1', florida: 'floridaOut', sea: 'seaOut', tv: 'tvOut', jungle: 'jungleOut' };
      const roomOf = (p: { x: number; y: number }) => [...lm.marks].find(([, [x, y]]) => x === p.x && y === p.y)?.[0] ?? 'hall';
      for (let room = roomOf(arrival); room !== 'launch'; room = roomOf(arrival)) {
        const door = DOOR[room];
        await bot.collect(names, (n) => /^(quarter|pill)_/.test(n), 'quarters and pills');
        if (!(await bot.goTo([[lm.at(door).x, lm.at(door).y]], door))) return false;
        if (sim.link < 0) return false;
        arrival = links[sim.link].to;
        enter(arrival);
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
    const exit = lm.at('exit');
    return bot.goTo([[exit.x, exit.y]], 'exit');
  };
  let ok = await run();
  // Like PLAYGAME: a death costs a life and plays the scene again from where it was entered.
  for (let tries = 0; sim.dead && ci.lives > 0 && tries < 8; tries++) {
    deaths++;
    console.log(`  ${l.desc}: died at tick ${sim.ticks}`);
    ci.lives--;
    ci.hitpts = -1;
    enter(arrival);
    ok = await run();
  }
  close();
  const exited = ok && sim.link >= 0;
  console.log(`${i + 1}. ${l.desc.padEnd(18)} ${exited ? 'EXIT' : 'STUCK'}  pages ${ci.meter[CTR.pages] - 1}  lives ${ci.lives}  score ${ci.score}`);
  for (const s of bot.log) console.log('   ', s);
  if (!exited) throw new Error(`${l.desc}: the bot did not reach the exit`);
}
console.log(`${deaths} deaths, ${segments.length} segments, egg ${ci.meter[CTR.tomorrow]}`);
if (deaths) throw new Error(`year2000: the bot lost ${deaths} ${deaths === 1 ? 'life' : 'lives'}`);
if (process.env.DRY) process.exit(0);
const r = await writeWalkthrough('year2000', { rand: { seed: SEED, per: 'scene' }, segments, chapters });
// The engine must enter the scenes just as the bot did (a death or a missed dial would show here).
const want = [...segments.map((s) => s.scene), 1].join(' ');
if (r.scenes.join(' ') !== want || r.keysLeft) throw new Error(`the engine went ${r.scenes.join(' ')} (the bot ${want}), ${r.keysLeft} keys unplayed`);
