// Proves the library can be finished: the bot plays the whole game in the headless
// simulator, scene by scene, from the reading room through every wing and every book (a
// hundred words each, THE END, the story card, back to the hallway), into the Reserve
// Stacks, through all eight egg cup gates, to the thirty-third book and the ending.
//   cd web && npx vite-node ../games/brief/tools/check.ts [wing id]
import { CTR, WORDS_PER_BOOK, wingCounter } from '../src/ids';
import { compileAll } from '../src/compile';
import { sceneIds } from '../src/game';
import { Bot, monstersNamed, windowBox } from './bot';

export async function playThrough(only?: string, verbose = true) {
  const { game, hub, wings, chr, cb } = compileAll();
  const id = sceneIds();
  const areas: Record<string, { area: (typeof hub)['area']; names: string[] }> = { library: { area: hub.area, names: hub.area.mons.names } };
  for (const w of wings) areas[w.area.file] = { area: w.area, names: w.area.mons.names };
  const bot = new Bot(game, areas, chr, cb.build());
  const say = (s: string) => verbose && console.log(s);
  bot.enter(id.room, hub.room.entry);
  let score = 0;
  for (const w of wings) {
    if (only && w.spec.wing.id !== only) continue;
    // reading room -> the wing's door
    if (bot.scene !== id.room) throw new Error('Not in the reading room');
    await bot.walk(() => [hub.doors[w.index]], windowBox(0, 0), () => false, false);
    if (bot.follow() !== id.hall(w.index)) throw new Error(`Door ${w.index} leads elsewhere`);
    for (const [k, b] of w.books.entries()) {
      await bot.walk(() => [w.spines[k]], windowBox(0, 0), () => false, false);
      if (bot.follow() !== id.book(w.index, k)) throw new Error(`Spine ${k} leads elsewhere`);
      const box = windowBox(b.win.ox, b.win.oy);
      const before = bot.words;
      const t0 = bot.sim.ticks;
      await bot.walk(() => monstersNamed(bot.sim, areas[w.area.file].names, (n) => /^w\d+$/.test(n)), box, () => false);
      const got = bot.words - before;
      if (bot.words < WORDS_PER_BOOK) throw new Error(`${w.spec.wing.id} book ${b.spec.n}: only ${bot.words} words`);
      const shelved = bot.ci.meter[wingCounter(w.index)];
      await bot.walk(() => [b.end], box, () => false);
      if (bot.ci.meter[wingCounter(w.index)] !== shelved + 1) throw new Error(`${w.spec.wing.id} book ${b.spec.n}: the story was not counted`);
      if (bot.follow() !== id.card(w.index, k)) throw new Error(`THE END of ${b.spec.n} leads elsewhere`);
      await bot.ticks(3);
      if (bot.follow() !== id.hall(w.index)) throw new Error(`The card of ${b.spec.n} leads elsewhere`);
      score = bot.ci.score;
      say(`ok   ${w.spec.wing.id.padEnd(7)} story ${String(b.spec.n).padStart(2)}: ${got} words picked up in ${((bot.sim.ticks + 0) / 18.2).toFixed(0)}s, ${bot.words} left over, score ${score}${t0 ? '' : ''}`);
    }
    await bot.walk(() => [w.door], windowBox(0, 0), () => false, false);
    if (bot.follow() !== id.room) throw new Error('The hallway door leads elsewhere');
  }
  // the Reserve Stacks
  await bot.walk(() => [hub.toStacks], windowBox(0, 0), () => false, false);
  if (bot.follow() !== id.stacks) throw new Error('The Stacks door leads elsewhere');
  const counts = wings.map((w) => bot.ci.meter[wingCounter(w.index)] - 1);
  if (only) return { bot, counts };
  await bot.walk(() => [hub.book33], windowBox(16, 0), () => false, false, 3000);
  if (bot.follow() !== id.card33) throw new Error('The thirty-third book leads elsewhere');
  const after = wings.map((w) => bot.ci.meter[wingCounter(w.index)] - 1);
  if (after.join() !== counts.join()) throw new Error(`The gates kept stories: ${counts} -> ${after}`);
  await bot.ticks(3);
  if (bot.follow() !== 1) throw new Error('The thirty-third book does not end the game');
  say(`ok   the Reserve Stacks: ${counts.join(' ')} stories a wing; the 33rd book; THE END. Score ${bot.ci.score}, ${bot.ci.meter[CTR.words] - 1} words left over.`);
  return { bot, counts };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('check.ts')) {
  await playThrough(process.argv[2]).catch((e) => {
    console.error(`FAIL ${e.message}`);
    process.exitCode = 1;
  });
}
