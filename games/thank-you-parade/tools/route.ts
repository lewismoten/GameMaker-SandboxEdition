// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level,
// with a look at each placard, every playbook page, the notes over the cannons, hops past geese and waits for the beat.
// Each level checks what it took.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { AT1 } from '../src/level1';
import { AT2, CARDS_AT } from '../src/level2';
import { AT3 } from '../src/level3';
import { AT4 } from '../src/level4';
import { AT5, ZONES } from '../src/level5';
import { AT6 } from '../src/level6';
import { AT7 } from '../src/level7';
import { BANNER, LETTERS } from '../src/airstrip';
import { PAGE_POINTS } from '../src/base';
import { CARDS_WANTED } from '../src/items';
import { CARDS } from '../src/town';
import { buildLevels } from '../src/levels';

/** A person's look at a placard, in ticks (about two seconds). */
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

/** Takes a playbook page: the orders in `go` must raise the score by at least its points. */
async function page(bot: StarterBot, go: () => Promise<void>, what: string): Promise<void> {
  const before = bot.sim.ci.score;
  await go();
  if (bot.sim.ci.score - before < PAGE_POINTS) throw new Error(`${what}: no page taken (score ${before} -> ${bot.sim.ci.score})`);
  bot.say('a playbook page');
}

/** Walks through a goose's lane as a person does when a goose is in the way: straight on, taking the few pecks. */
async function hop(bot: StarterBot, bx: number): Promise<void> {
  await must(bot, bot.walk(bx, 'past the geese', 900, { jumpWhenJittering: true }), 'past the geese');
}

/** 1. Call Time. */
export async function callTime(bot: StarterBot): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(7, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  for (const x of AT1.piles) await must(bot, bot.walk(x + 1, 'a leaf pile'), 'through the piles');
  need(bot, 20, 1, 'the mouthpiece');
  await must(bot, bot.wait(READ), "reading Doug's placard");
  await must(bot, bot.walk(AT1.gates.tuba + 1, 'Doug'), 'to Doug');
  need(bot, 20, 0, 'Doug took the mouthpiece');
  // halfway up the trunk, the far branch and the first playbook page
  await must(bot, bot.walk(AT1.trunk, 'the trunk'), 'to the tree');
  await must(bot, bot.climb('up', AT1.farBranch[2] - 1, 'halfway up'), 'climb');
  await page(bot, () => must(bot, bot.walk(AT1.page, 'the far branch'), 'along the far branch'), 'the first page');
  await must(bot, bot.walk(AT1.trunk, 'the trunk'), 'back to the trunk');
  await must(bot, bot.climb('up', 2, 'up the tree'), 'climb');
  await must(bot, bot.walk(AT1.sticks, 'the drum sticks'), 'along the branch');
  need(bot, 21, 1, 'the sticks');
  await must(bot, bot.walk(AT1.trunk + 1, 'the trunk'), 'back along the branch');
  await must(bot, bot.walk(AT1.trunk, 'the trunk'), 'onto the trunk');
  await must(bot, bot.climb('down', 8, 'down the tree'), 'down');
  await must(bot, bot.wait(READ / 2), 'reading the tree placard');
  await must(bot, bot.walk(AT1.gates.drum + 1, 'the drummer'), 'to the drummer');
  need(bot, 21, 0, 'the drummer took the sticks');
  await hop(bot, AT1.pond[0] - 2);
  bot.say(`hit points ${bot.sim.ci.hitpts}/${hp}`);
  await must(bot, bot.wait(READ), 'reading the pond placard');
  await must(bot, bot.walk(AT1.pond[0], 'into the pond'), 'wade in');
  await must(bot, bot.walk(AT1.lilies[0] - 1, 'the first lily'), 'to the lily');
  await must(bot, bot.jump('right', AT1.lilies[0]), 'onto lily 1');
  await must(bot, bot.jump('right', AT1.flute), 'onto lily 2');
  need(bot, 22, 1, 'the flute');
  await must(bot, bot.jump('right', AT1.lilies[2]), 'onto lily 3');
  await must(bot, bot.walk(AT1.pond[1] + 3, 'out of the pond'), 'out');
  await must(bot, bot.walk(AT1.gates.flute + 1, 'the flute player'), 'to the flute player');
  need(bot, 22, 0, 'the flute player took the flute');
  await must(bot, bot.wait(READ), 'reading the note on the gate');
  if (bot.sim.ci.hitpts < hp - 30) throw new Error(`too many pecks: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(AT1.exit + 1, 'the exit'), 'the exit');
}

const levels = buildLevels().levels;
const ticksNote = (bot: StarterBot, what: string): void => bot.say(`${what} at tick ${bot.sim.ticks}`);

/** 2. Gust: every card, the fire escape's page, then the box. */
export async function gust(bot: StarterBot): Promise<void> {
  const before = bot.sim.ci.meter[CARDS] - 1;
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
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
  // up the fire escape for Gigi's second page, then down again
  const [first, second] = AT2.escape;
  await must(bot, bot.walk(first[0] - 2, 'the fire escape'), 'to the fire escape');
  await must(bot, bot.jump('right', first[0]), 'onto the first landing');
  await page(bot, () => must(bot, bot.jump('right', AT2.page[0]), 'onto the top landing'), 'the second page');
  await must(bot, bot.wait(READ), 'reading the page');
  await must(bot, bot.walk(first[0] - 2, 'down the fire escape'), 'down');
  void second;
  await must(bot, bot.walk(AT2.box + 1, 'the card box'), 'through the box');
  need(bot, CARDS, before + CARDS_AT.length - CARDS_WANTED, 'cards left after the box');
  await leave(bot, bot.walk(AT2.exit + 1, 'the exit'), 'the exit');
}

/** 3. Meanwhile (as Marge): all eight letters, the third page, the rack, the plane. */
export async function airstrip(bot: StarterBot): Promise<void> {
  const L = AT3.letters;
  const got = (n: number, what: string) => need(bot, LETTERS, n, what);
  await must(bot, bot.walk(9, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(L.A[0] + 1, 'the A'), 'to the A');
  got(1, 'the A');
  await must(bot, bot.walk(AT3.ladder, 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('up', 4, 'up to the rafters'), 'climb');
  await must(bot, bot.walk(L.T[0] + 1, 'the T'), 'along the rafters');
  await must(bot, bot.walk(L.H[0] + 1, 'the H'), 'along the rafters');
  got(3, 'the T and the H');
  await must(bot, bot.walk(AT3.hangar[1] + 2, 'off the rafters'), 'off the end');
  await must(bot, bot.wait(READ), 'reading the NO placard');
  // up the hay bales: two high, then four, then six; the N and the K on top
  const [s1, s2, s3] = AT3.stacks;
  await must(bot, bot.walk(s1[0] - 2, 'the bales'), 'to the bales');
  await must(bot, bot.jump('right', s1[0]), 'onto the first stack');
  await must(bot, bot.jump('right', s2[0]), 'onto the second stack');
  await must(bot, bot.walk(L.N[0] + 1, 'the N'), 'to the N');
  await must(bot, bot.jump('right', s3[0]), 'onto the tall stack');
  await must(bot, bot.walk(L.K[0], 'the K'), 'to the K');
  got(5, 'the N and the K');
  // the jump out to the lookout plank, for the third page
  await page(
    bot,
    async () => {
      await must(bot, bot.jump('right', AT3.lookout[0] + 1), 'out to the lookout');
      await must(bot, bot.walk(AT3.page, 'the end of the lookout'), 'along the lookout');
    },
    'the third page',
  );
  await must(bot, bot.wait(READ), 'reading the page');
  await must(bot, bot.walk(AT3.lookout[1] + 2, 'down'), 'off the lookout');
  // the plank over the goose lane, for the Y
  await hop(bot, AT3.plankY[0] - 2);
  await must(bot, bot.jump('right', AT3.plankY[0]), 'onto the plank');
  await must(bot, bot.walk(L.Y[0] + 1, 'the Y'), 'to the Y');
  got(6, 'the Y');
  await hop(bot, AT3.stacks[3][0] - 2);
  await must(bot, bot.jump('right', AT3.stacks[3][0]), 'onto the last stack');
  await must(bot, bot.walk(L.O[0], 'the O'), 'to the O');
  got(7, 'the O');
  await must(bot, bot.walk(L.U[0] + 1, 'the U'), 'to the U');
  got(BANNER.length, 'every letter');
  await must(bot, bot.wait(READ), 'reading the rack placard');
  await must(bot, bot.walk(AT3.rack + 1, 'the rack'), 'through the rack');
  got(0, 'the rack took the letters');
  await leave(bot, bot.walk(AT3.exit + 1, 'the cockpit'), 'the cockpit');
}

/** 4. The Float. */
export async function theFloat(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(AT4.planksA[0] - 3, 'the shelf'), 'to the shelf');
  await must(bot, bot.jump('right', AT4.key1 + 1), 'onto the shelf');
  need(bot, 20, 1, 'the brass key');
  await must(bot, bot.walk(AT4.planksA[1] + 2, 'off the shelf'), 'off the shelf');
  await must(bot, bot.walk(AT4.gate1 + 1, 'the brass gate'), 'through the brass gate');
  need(bot, 20, 0, 'the brass gate took the key');
  await must(bot, bot.wait(READ), "reading the captain's placard");
  await must(bot, bot.walk(AT4.wheel + 1, 'the wheel'), 'to the wheel');
  await must(bot, bot.walk(AT4.planksB[0] - 3, 'the shelf'), 'to the shelf');
  await must(bot, bot.jump('right', AT4.silver + 1), 'onto the shelf');
  need(bot, 21, 1, 'the steel key');
  await must(bot, bot.walk(AT4.planksB[1] + 2, 'off the shelf'), 'off the shelf');
  await must(bot, bot.walk(AT4.gate2 + 1, 'the steel gate'), 'through the steel gate');
  await must(bot, bot.walk(AT4.ladder, 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('up', 4, 'up the ladder'), 'climb');
  await page(bot, () => must(bot, bot.walk(AT4.page, 'the loft, the wrong way'), 'to the far end of the loft'), 'the fourth page');
  await must(bot, bot.wait(READ), 'reading the page');
  await must(bot, bot.walk(AT4.streamers + 1, 'the streamers'), 'to the streamers');
  await must(bot, bot.walk(AT4.key2 + 1, 'the second brass key'), 'to the key');
  need(bot, 20, 1, 'the second brass key');
  await must(bot, bot.walk(AT4.ladder + 1, 'the ladder'), 'back');
  await must(bot, bot.walk(AT4.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down');
  await must(bot, bot.walk(AT4.gate3 + 1, 'the second brass gate'), 'through the gate');
  await must(bot, bot.walk(AT4.flowers + 1, 'the flowers'), 'to the flowers');
  need(bot, 24, 3, 'the float parts');
  await must(bot, bot.wait(READ), 'looking at the float');
  await must(bot, bot.walk(AT4.float + 1, 'the float'), 'through the float');
  need(bot, 24, 0, 'the float took its parts');
  await leave(bot, bot.walk(AT4.exit + 1, 'the exit'), 'the exit');
}

/** Waits for the cannon at (x, GROUND-1) to fire and then settle, so a zone can be crossed in its quiet. */
async function afterSplash(bot: StarterBot, levelIdx: number, kind: string, x: number): Promise<void> {
  const book = levels[levelIdx].book;
  const fire = book.n(`${kind}!`);
  const at = () => bot.sim.w.blkmap[bot.sim.blockAt(x + ORIGIN, 9 + ORIGIN)];
  for (let t = 0; t < 120 && at() !== fire; t++) await must(bot, bot.wait(1), 'waiting for a cannon');
  for (let t = 0; t < 40 && at() === fire; t++) await must(bot, bot.wait(1), 'the burst');
}

/** Crosses a zone of cannons just after they fire: a jump over them (through the notes above), landing just past the zone. */
async function cross(bot: StarterBot, levelIdx: number, kind: string, a: number, b: number, leap = true): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(a - 1, 'a cannon zone'), 'to the zone');
  await afterSplash(bot, levelIdx, kind, a);
  if (leap) await must(bot, bot.jump('right', b + 1), 'over the cannons');
  else await must(bot, bot.walk(b + 2, 'past the cannons'), 'across');
  if (bot.sim.ci.hitpts !== hp) throw new Error(`a cannon hit: hit points ${hp} -> ${bot.sim.ci.hitpts} at ${a}`);
}

/** 5. Drum-Off. */
export async function drumOff(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(15, "Gigi's placard"), "to Gigi's placard");
  await must(bot, bot.wait(READ), 'reading');
  for (const [a, b, kind] of ZONES) {
    if (a === 30 || a === 40 || a === 52 || a === 64) await must(bot, bot.wait(READ / 2), 'reading');
    await cross(bot, 4, kind === 'A' ? 'cannonA' : 'cannonB', a, b);
    bot.say(`crossed ${kind} at ${a}`);
  }
  bot.say(`notes: ${bot.sim.ci.score - score} points`);
  await must(bot, bot.wait(READ), 'looking at the Ridgemont band');
  await leave(bot, bot.walk(AT5.exit + 1, 'the exit'), 'the exit');
}

/** 6. The Route. */
export async function theRoute(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(AT6.cards[1] + 1, 'the cards'), 'along the cards');
  const cardsIn = bot.sim.ci.meter[CARDS] - 1;
  for (const [x] of AT6.vets.slice(0, 3)) {
    await must(bot, bot.wait(READ / 2), 'reading');
    await must(bot, bot.walk(x + 1, 'a veteran'), 'to a veteran');
    await must(bot, bot.wait(20), 'a cap tip');
    bot.say(`cards ${bot.sim.ci.meter[CARDS] - 1}`);
  }
  await hop(bot, AT6.vets[3][0] + 1);
  await must(bot, bot.walk(AT6.balloon + 2, 'the balloon'), 'through the balloon');
  await must(bot, bot.walk(AT6.vets[4][0] + 1, 'a veteran'), 'to a veteran');
  await cross(bot, 5, 'cannonA', AT6.cannon[0], AT6.cannon[1]);
  await must(bot, bot.walk(AT6.vets[5][0] + 1, 'a veteran'), 'to the last veteran');
  const gained = bot.sim.ci.score - score;
  if (gained < 6 * 50 + 8 * 10) throw new Error(`score ${gained}: not every veteran got a card (cards ${cardsIn} -> ${bot.sim.ci.meter[CARDS] - 1})`);
  await leave(bot, bot.walk(AT6.exit + 1, 'the exit'), 'the exit');
}

/** 7. Step Off. */
export async function stepOff(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(AT7.cards[1] + 1, 'the cards'), 'along the cards');
  await hop(bot, AT7.vets[0][0] + 1);
  await must(bot, bot.wait(READ), 'reading the llama placard');
  for (const [x] of AT7.vets.slice(1)) await must(bot, bot.walk(x + 1, 'a veteran'), 'to a veteran');
  await must(bot, bot.wait(READ), "reading Gigi's placard");
  await must(bot, bot.walk(AT7.balloon + 2, 'the balloon'), 'through the balloon');
  await cross(bot, 6, 'cannonA', AT7.cannon[0], AT7.cannon[1]);
  await must(bot, bot.walk(AT7.steps[0] - 2, 'the stage'), 'to the stage steps');
  await must(bot, bot.wait(READ), 'reading');
  await leave(bot, bot.walk(AT7.exit + 1, 'the stage door'), 'the stage door');
}
