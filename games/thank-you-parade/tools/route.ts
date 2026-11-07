// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level,
// with a look at each sign, jumps over geese, waits for the puddles and the drums. Each level checks what it took.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { AT1 } from '../src/level1';
import { AT2, CARDS_AT } from '../src/level2';
import { AT3 } from '../src/level3';
import { AT4, ZONES } from '../src/level4';
import { AT5 } from '../src/level5';
import { AT6 } from '../src/level6';
import { CARDS_WANTED } from '../src/items';
import { CARDS } from '../src/town';
import { buildLevels } from '../src/levels';

/** A person's look at a sign, in ticks (about two seconds). */
const READ = 36;

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door. */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

const need = (bot: StarterBot, counter: number, n: number, what: string): void => {
  const got = bot.sim.ci.meter[counter] - 1;
  if (got !== n) throw new Error(`${what}: counter ${counter} holds ${got}, expected ${n}`);
};

/** Walks through a goose's lane as a person does when a goose is in the way: straight on, taking the few pecks. */
async function hop(bot: StarterBot, bx: number): Promise<void> {
  await must(bot, bot.walk(bx, 'past the geese', 900, { jumpWhenJittering: true }), 'past the geese');
}

/** 1. Scattered. */
export async function scattered(bot: StarterBot): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(8, 'the first sign'), 'to the sign');
  await must(bot, bot.wait(READ), 'reading');
  for (const x of AT1.piles) await must(bot, bot.walk(x + 1, 'a leaf pile'), 'through the piles');
  need(bot, 20, 1, 'the mouthpiece');
  await must(bot, bot.walk(AT1.gates.tuba - 4, 'the band sign'), 'to the sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(AT1.gates.tuba + 1, 'the tuba kid'), 'to the tuba kid');
  need(bot, 20, 0, 'the tuba kid took the mouthpiece');
  await must(bot, bot.walk(AT1.trunk, 'the trunk'), 'to the tree');
  await must(bot, bot.climb('up', 2, 'up the tree'), 'climb');
  await must(bot, bot.walk(AT1.sticks, 'the drum sticks'), 'along the branch');
  need(bot, 21, 1, 'the sticks');
  await must(bot, bot.walk(AT1.trunk + 1, 'the trunk'), 'back along the branch');
  await must(bot, bot.walk(AT1.trunk, 'the trunk'), 'onto the trunk');
  await must(bot, bot.climb('down', 8, 'down the tree'), 'down');
  await must(bot, bot.walk(AT1.gates.drum + 1, 'the drummer'), 'to the drummer');
  need(bot, 21, 0, 'the drummer took the sticks');
  await hop(bot, AT1.pond[0] - 2);
  bot.say(`hit points ${bot.sim.ci.hitpts}/${hp}`);
  await must(bot, bot.wait(READ), 'reading the pond sign');
  await must(bot, bot.walk(AT1.pond[0], 'into the pond'), 'wade in');
  await must(bot, bot.walk(AT1.lilies[0] - 1, 'the first lily'), 'to the lily');
  await must(bot, bot.jump('right', AT1.lilies[0]), 'onto lily 1');
  await must(bot, bot.jump('right', AT1.flute), 'onto lily 2');
  need(bot, 22, 1, 'the flute');
  await must(bot, bot.jump('right', AT1.lilies[2]), 'onto lily 3');
  await must(bot, bot.walk(AT1.pond[1] + 3, 'out of the pond'), 'out');
  await must(bot, bot.walk(AT1.gates.flute + 1, 'the flute kid'), 'to the flute kid');
  need(bot, 22, 0, 'the flute kid took the flute');
  if (bot.sim.ci.hitpts < hp - 30) throw new Error(`too many pecks: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(AT1.exit + 1, 'the exit'), 'the exit');
}

const levels = buildLevels().levels;
const ticksNote = (bot: StarterBot, what: string): void => bot.say(`${what} at tick ${bot.sim.ticks}`);

/** 2. Gust: every card, then the box. */
export async function gust(bot: StarterBot): Promise<void> {
  const before = bot.sim.ci.meter[CARDS] - 1;
  await must(bot, bot.walk(8, 'the first sign'), 'to the sign');
  await must(bot, bot.wait(20), 'reading');
  for (const [k, c] of CARDS_AT.entries()) {
    if (c.y === 7) {
      await must(bot, bot.walk(c.x - 2, 'a plank'), 'to the plank');
      await must(bot, bot.jump('right', c.x + 1), 'onto the plank');
      await must(bot, bot.walk(c.x + 3, 'off the plank'), 'along the plank');
    } else await must(bot, bot.walk(c.x + 1, 'a card'), 'to a card');
    ticksNote(bot, `card ${k}`);
    if (bot.sim.ci.meter[CARDS] - 1 !== before + k + 1) throw new Error(`card ${k} (until tick ${c.until}) was not caught: ${bot.sim.ci.meter[CARDS] - 1}`);
  }
  await must(bot, bot.walk(AT2.box - 4, 'the sign'), 'to the sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(AT2.box + 1, 'the card box'), 'through the box');
  need(bot, CARDS, before + CARDS_AT.length - CARDS_WANTED, 'cards left after the box');
  await leave(bot, bot.walk(AT2.exit + 1, 'the exit'), 'the exit');
}

/** 3. The Float. */
export async function theFloat(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(8, 'the first sign'), 'to the sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(AT3.planksA[0] - 3, 'the shelf'), 'to the shelf');
  await must(bot, bot.jump('right', AT3.key1 + 1), 'onto the shelf');
  need(bot, 20, 1, 'the gold key');
  await must(bot, bot.walk(AT3.planksA[1] + 2, 'off the shelf'), 'off the shelf');
  await must(bot, bot.walk(AT3.gate1 + 1, 'the gold gate'), 'through the gold gate');
  need(bot, 20, 0, 'the gold gate took the key');
  await must(bot, bot.walk(AT3.wheel + 1, 'the wheel'), 'to the wheel');
  await must(bot, bot.walk(AT3.planksB[0] - 3, 'the shelf'), 'to the shelf');
  await must(bot, bot.jump('right', AT3.silver + 1), 'onto the shelf');
  need(bot, 21, 1, 'the silver key');
  await must(bot, bot.walk(AT3.planksB[1] + 2, 'off the shelf'), 'off the shelf');
  await must(bot, bot.walk(AT3.gate2 + 1, 'the silver gate'), 'through the silver gate');
  await must(bot, bot.walk(AT3.ladder, 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('up', 4, 'up the ladder'), 'climb');
  await must(bot, bot.walk(AT3.streamers + 1, 'the streamers'), 'to the streamers');
  await must(bot, bot.walk(AT3.key2 + 1, 'the second gold key'), 'to the key');
  need(bot, 20, 1, 'the second gold key');
  await must(bot, bot.walk(AT3.ladder + 1, 'the ladder'), 'back');
  await must(bot, bot.walk(AT3.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down');
  await must(bot, bot.walk(AT3.gate3 + 1, 'the second gold gate'), 'through the gate');
  await must(bot, bot.walk(AT3.flowers + 1, 'the flowers'), 'to the flowers');
  need(bot, 24, 3, 'the float parts');
  await must(bot, bot.wait(READ), 'looking at the float');
  await must(bot, bot.walk(AT3.float + 1, 'the float'), 'through the float');
  need(bot, 24, 0, 'the float took its parts');
  await leave(bot, bot.walk(AT3.exit + 1, 'the exit'), 'the exit');
}

/** Waits for the puddle at (x, GROUND-1) to splash and then settle, so a zone can be crossed in its calm. */
async function afterSplash(bot: StarterBot, levelIdx: number, kind: string, x: number): Promise<void> {
  const book = levels[levelIdx].book;
  const squirt = book.n(`${kind}!`);
  const at = () => bot.sim.w.blkmap[bot.sim.blockAt(x + ORIGIN, 9 + ORIGIN)];
  for (let t = 0; t < 120 && at() !== squirt; t++) await must(bot, bot.wait(1), 'waiting for a splash');
  for (let t = 0; t < 40 && at() === squirt; t++) await must(bot, bot.wait(1), 'the splash');
}

/** Crosses a zone of puddles just after they splash. */
async function cross(bot: StarterBot, levelIdx: number, kind: string, a: number, b: number): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(a - 1, 'a puddle zone'), 'to the zone');
  await afterSplash(bot, levelIdx, kind, a);
  if (process.env.HOPLOG)
    console.log(
      'cross',
      a,
      [a, a + 1, a + 2].map((x) => bot.sim.blockAt(x + ORIGIN, 9 + ORIGIN)).join(','),
      'hero',
      bot.px.x,
      'tick',
      bot.sim.ticks,
      levels[levelIdx].book.n('puddleB!'),
      levels[levelIdx].book.n('puddleB'),
    );
  await must(bot, bot.walk(b + 2, 'across the puddles'), 'across');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`a squirt hit: hit points ${hp} -> ${bot.sim.ci.hitpts} at ${a}`);
}

/** 4. In Step. */
export async function inStep(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(8, 'the first sign'), 'to the sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(15, 'the drums'), 'to the drums sign');
  await must(bot, bot.wait(READ), 'reading');
  for (const [a, b, kind] of ZONES) {
    if (a === 28) await must(bot, bot.wait(READ), 'reading');
    await cross(bot, 3, kind === 'A' ? 'puddleA' : 'puddleB', a, b);
    bot.say(`crossed ${kind} at ${a}`);
  }
  await leave(bot, bot.walk(AT4.exit + 1, 'the exit'), 'the exit');
}

/** 5. The Route. */
export async function theRoute(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(AT5.cards[0] - 1, 'the cards'), 'to the cards');
  await must(bot, bot.walk(AT5.cards[1] + 3, 'the cards'), 'along the cards');
  await must(bot, bot.wait(READ), 'reading');
  const cardsIn = bot.sim.ci.meter[CARDS] - 1;
  for (const [x] of AT5.vets.slice(0, 3)) {
    await must(bot, bot.walk(x + 1, 'a neighbor'), 'to a neighbor');
    await must(bot, bot.wait(20), 'a hat tip');
    bot.say(`cards ${bot.sim.ci.meter[CARDS] - 1}`);
  }
  await hop(bot, 62);
  await must(bot, bot.walk(AT5.vets[3][0] + 1, 'a neighbor'), 'to a neighbor');
  await must(bot, bot.walk(AT5.balloon + 2, 'the balloon'), 'through the balloon');
  await must(bot, bot.walk(AT5.vets[4][0] + 1, 'a neighbor'), 'to a neighbor');
  await cross(bot, 4, 'puddleA', AT5.puddle[0], AT5.puddle[1]);
  await must(bot, bot.walk(AT5.vets[5][0] + 1, 'a neighbor'), 'to the last neighbor');
  const gained = bot.sim.ci.score - score;
  if (gained < 6 * 50 + 8 * 10) throw new Error(`score ${gained}: not every neighbor got a card (cards ${cardsIn} -> ${bot.sim.ci.meter[CARDS] - 1})`);
  await leave(bot, bot.walk(AT5.exit + 1, 'the exit'), 'the exit');
}

/** 6. Finale. */
export async function finale(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(AT6.cards[1] + 3, 'the cards'), 'along the cards');
  await must(bot, bot.walk(AT6.vets[0][0] + 1, 'a neighbor'), 'to a neighbor');
  await hop(bot, AT6.vets[1][0] + 1);
  await must(bot, bot.walk(AT6.vets[2][0] + 1, 'a neighbor'), 'to a neighbor');
  await must(bot, bot.walk(AT6.vets[3][0] + 1, 'a neighbor'), 'to a neighbor');
  await must(bot, bot.walk(AT6.balloon + 2, 'the balloon'), 'through the balloon');
  await cross(bot, 5, 'puddleA', AT6.puddle[0], AT6.puddle[1]);
  await must(bot, bot.walk(AT6.steps[0] - 2, 'the stage'), 'to the stage steps');
  await must(bot, bot.wait(READ), 'reading');
  await leave(bot, bot.walk(AT6.exit + 1, 'the stage door'), 'the stage door');
}
