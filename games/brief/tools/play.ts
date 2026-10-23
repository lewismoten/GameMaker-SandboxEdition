// The whole game, played by the bot in the headless simulator, scene by scene, from the reading room through every wing and every book (a
// hundred words each, THE END, the story card, back to the hallway), into the Reserve
// Stacks, through all eight stamp gates, to the thirty-third book and the ending.
import { CTR, WORDS_PER_BOOK, wingCounter } from '../src/ids';
import { compileAll } from '../src/compile';
import { sceneIds } from '../src/game';
import { Bot, hazardsOf, windowBox, wordCells } from './bot';

export async function playThrough(only?: string, verbose = true) {
  const { game, hub, wings, chr, cb } = compileAll();
  const id = sceneIds();
  const areas: Record<string, { area: (typeof hub)['area']; names: string[]; hazards: Set<string> }> = {
    library: { area: hub.area, names: hub.area.mons.names, hazards: hazardsOf(hub.area) },
  };
  for (const w of wings) areas[w.area.file] = { area: w.area, names: w.area.mons.names, hazards: hazardsOf(w.area) };
  const bot = new Bot(game, areas, chr, cb.build());
  const say = (s: string) => verbose && console.log(s);
  bot.enter(id.room, hub.room.entry);
  let score = 0;
  for (const w of wings) {
    if (only && w.spec.wing.id !== only) continue;
    // reading room -> the wing's door
    if (bot.scene !== id.room) throw new Error('Not in the reading room');
    await bot.walk(
      () => [hub.doors[w.index]],
      windowBox(0, 0),
      () => false,
      false,
    );
    if (bot.follow() !== id.hall(w.index)) throw new Error(`Door ${w.index} leads elsewhere`);
    for (const [k, b] of w.books.entries()) {
      await bot.walk(
        () => [w.spines[k]],
        windowBox(0, 0),
        () => false,
        false,
      );
      if (bot.follow() !== id.book(w.index, k)) throw new Error(`Spine ${k} leads elsewhere`);
      const box = windowBox(b.win.ox, b.win.oy);
      const before = bot.words;
      const t0 = bot.sim.ticks;
      await bot.walk(
        () => wordCells(bot.sim, w.area, box),
        box,
        () => false,
      );
      const got = bot.words - before;
      const secs = (bot.sim.ticks - t0) / 18.2;
      if (bot.words < WORDS_PER_BOOK) throw new Error(`${w.spec.wing.id} book ${b.spec.n}: only ${bot.words} words`);
      const shelved = bot.ci.meter[wingCounter(w.index)];
      await bot.walk(
        () => [b.page],
        box,
        () => bot.ci.meter[wingCounter(w.index)] > shelved,
      );
      await bot.walk(
        () => [b.end],
        box,
        () => false,
      );
      if (bot.ci.meter[wingCounter(w.index)] !== shelved + 1) throw new Error(`${w.spec.wing.id} book ${b.spec.n}: the story was not counted`);
      if (bot.follow() !== id.hall(w.index)) throw new Error(`THE END of ${b.spec.n} leads elsewhere`);
      score = bot.ci.score;
      say(`ok   ${w.spec.wing.id.padEnd(7)} story ${String(b.spec.n).padStart(2)}: ${got} words picked up in ${secs.toFixed(0)}s, score ${score}`);
    }
    await bot.walk(
      () => [w.door],
      windowBox(0, 0),
      () => false,
      false,
    );
    if (bot.follow() !== id.room) throw new Error('The hallway door leads elsewhere');
  }
  // the Reserve Stacks
  await bot.walk(
    () => [hub.toStacks],
    windowBox(0, 0),
    () => false,
    false,
  );
  if (bot.follow() !== id.stacks) throw new Error('The Stacks door leads elsewhere');
  const counts = wings.map((w) => bot.ci.meter[wingCounter(w.index)] - 1);
  if (only) return { bot, counts };
  for (const g of hub.gates.slice(0, wings.length))
    await bot.walk(
      () => [g],
      windowBox(16, 0),
      () => false,
      false,
      3000,
    );
  await bot.walk(
    () => [hub.book33],
    windowBox(16, 0),
    () => false,
    false,
    3000,
  );
  if (bot.follow() !== id.card33) throw new Error('The thirty-third book leads elsewhere');
  const after = wings.map((w) => bot.ci.meter[wingCounter(w.index)] - 1);
  if (after.join() !== counts.join()) throw new Error(`The gates kept stories: ${counts} -> ${after}`);
  await bot.ticks(3);
  if (bot.follow() !== 1) throw new Error('The thirty-third book does not end the game');
  say(
    `ok   the Reserve Stacks: ${counts.join(' ')} stories a wing; the 33rd book; THE END. Score ${bot.ci.score}, ${bot.ci.meter[CTR.words] - 1} words left over.`,
  );
  return { bot, counts };
}
