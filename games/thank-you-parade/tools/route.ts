// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level,
// with a look at each placard, every playbook page, the notes over the cannons, hops past geese and waits for the beat.
// Each level checks what it took.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { AT1 } from '../src/level1';
import { AT2, CARDS_AT } from '../src/level2';
import { AT3 } from '../src/level3';
import { AT_BAKERY } from '../src/bakery';
import { AT_CREEK } from '../src/creek';
import { AT_HALL } from '../src/hall';
import { AT_THAW } from '../src/thaw';
import { AT_CLOCK } from '../src/clock';
import { AT_RUSH } from '../src/rush';
import { phaseAt } from '../src/traffic';
import { cogOffset, cogSolid } from '../src/cogs';
import { AT_TRUCK } from '../src/truck';
import { AT_BLEACHERS } from '../src/bleachers';
import { FUSES } from '../src/extra';
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
  bot.say(`leaving ${what} with hit points ${bot.sim.ci.hitpts}, lives ${bot.sim.ci.meter[1]}`);
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
  const [first] = AT2.escape;
  await must(bot, bot.walk(first[0] - 2, 'the fire escape'), 'to the fire escape');
  await must(bot, bot.jump('right', first[0]), 'onto the first landing');
  await page(bot, () => must(bot, bot.jump('right', AT2.page[0]), 'onto the top landing'), 'the second page');
  await must(bot, bot.wait(READ), 'reading the page');
  await must(bot, bot.walk(first[0] - 2, 'down the fire escape'), 'down');
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
async function afterSplash(bot: StarterBot, file: string, kind: string, x: number, row = 9): Promise<void> {
  const book = levels.find((l) => l.file === file)!.book;
  const fire = book.n(`${kind}!`);
  const at = () => bot.sim.w.blkmap[bot.sim.blockAt(x + ORIGIN, row + ORIGIN)];
  for (let t = 0; t < 120 && at() !== fire; t++) await must(bot, bot.wait(1), 'waiting for a cannon');
  for (let t = 0; t < 40 && at() === fire; t++) await must(bot, bot.wait(1), 'the burst');
}

/** Crosses a zone of cannons just after they fire: a jump over them (through the notes above), landing just past the zone. */
async function cross(bot: StarterBot, file: string, kind: string, a: number, b: number, leap = true, row = 9): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(a - 1, 'a cannon zone'), 'to the zone');
  await afterSplash(bot, file, kind, a, row);
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
    await cross(bot, 'drumoff', kind === 'A' ? 'cannonA' : 'cannonB', a, b);
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
  await cross(bot, 'route', 'cannonA', AT6.cannon[0], AT6.cannon[1]);
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
  await cross(bot, 'stepoff', 'cannonA', AT7.cannon[0], AT7.cannon[1]);
  await must(bot, bot.walk(AT7.steps[0] - 2, 'the stage'), 'to the stage steps');
  await must(bot, bot.wait(READ), 'reading');
  await leave(bot, bot.walk(AT7.exit + 1, 'the stage door'), 'the stage door');
}

/** Climbs a shaft: walks to it, goes up until the hero's head is at `top`, then lands. */
async function climbShaft(bot: StarterBot, x: number, top: number, what: string): Promise<void> {
  await must(bot, bot.walk(x, `the ${what} ladder`), `to the ${what} ladder`);
  await must(bot, bot.climb('up', top, `up the ${what} ladder`), `up the ${what} ladder`);
}

/** 3. Bakery Row: the three roofs, the donuts, the water tower's page, down the awnings, through the shutter. */
export async function bakeryRow(bot: StarterBot): Promise<void> {
  const A = AT_BAKERY;
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  const [r1, r2, r3] = A.roofs;
  await climbShaft(bot, A.shafts[0], r1[2] - 1, 'first');
  await must(bot, bot.walk(r1[1], 'along the first roof'), 'along the first roof');
  await must(bot, bot.wait(READ / 2), 'reading the donuts placard');
  await climbShaft(bot, A.shafts[1], r2[2] - 1, 'second');
  await must(bot, bot.walk(r2[0] + 4, 'the second roof'), 'onto the second roof');
  await hop(bot, r2[1]);
  await climbShaft(bot, A.shafts[2], r3[2] - 1, 'third');
  await must(bot, bot.walk(r3[1], 'along the third roof'), 'along the third roof');
  // the water tower's lookout, and the fifth page
  await climbShaft(bot, A.shafts[3], A.tower.row - 1, 'tower');
  await page(bot, () => must(bot, bot.walk(A.tower.page, 'the lookout'), 'along the lookout'), 'the fifth page');
  await must(bot, bot.wait(READ), 'reading the page');
  await must(bot, bot.walk(A.shafts[3], 'the ladder'), 'back to the ladder');
  await must(bot, bot.climb('down', r3[2] + 1, 'down to the awnings'), 'down');
  // down the awnings, donut by donut
  for (const [a, b] of A.awnings) await must(bot, bot.walk(b - 1, 'an awning'), `along the awning at ${a}`);
  await must(bot, bot.walk(A.awnings[3][1] + 3, 'the street'), 'to the street');
  await must(bot, bot.wait(READ / 2), 'reading');
  await hop(bot, 78);
  bot.say(`bakery: ${bot.sim.ci.score - score} points at tick ${bot.sim.ticks}`);
  if (bot.sim.ticks > A.segments * A.each * 0.7) throw new Error(`the bot is too slow for the shutter: tick ${bot.sim.ticks}`);
  await leave(bot, bot.walk(A.exit + 1, 'the back counter'), 'the back counter');
}

/** 5. Mill Creek: the broken bridge (brass key), the creek's bed (steel key), the two tolls, the mill roof's page. */
export async function millCreek(bot: StarterBot): Promise<void> {
  const A = AT_CREEK;
  const G = A.ground;
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(13, 'the bridge placard'), 'to the bridge placard');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(A.planks[0][0] - 2, 'the broken bridge'), 'to the bank');
  await must(bot, bot.jump('right', A.planks[0][0] + 1), 'onto the first plank');
  for (const [a] of A.planks.slice(1)) {
    await must(bot, bot.walk(a - 3, 'the end of a plank'), 'to the end of a plank');
    await must(bot, bot.jump('right', a + 1), 'onto the next plank');
  }
  need(bot, 20, 1, 'the brass key');
  await must(bot, bot.walk(A.creek[1], 'the far ladder'), 'to the far ladder');
  // down the far ladder to the bed, back along it to the steel key, hopping the cones
  await must(bot, bot.climb('down', A.bed - 1, 'down to the bed'), 'down');
  await must(bot, bot.walk(A.cones[1] + 2, 'the cone'), 'to the cone');
  await must(bot, bot.jump('left', A.cones[1] - 2), 'over the cone');
  await must(bot, bot.walk(A.steel, 'the steel key'), 'to the steel key');
  need(bot, 21, 1, 'the steel key');
  await must(bot, bot.walk(A.cones[1] - 2, 'the cone'), 'back to the cone');
  await must(bot, bot.jump('right', A.cones[1] + 2), 'over the cone');
  await must(bot, bot.walk(A.creek[1], 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('up', G - 1, 'up out of the creek'), 'up');
  await must(bot, bot.walk(A.creek[1] + 2, 'the bank'), 'onto the bank');
  await hop(bot, A.gates[0] - 6);
  await must(bot, bot.wait(READ), 'reading the toll placard');
  await must(bot, bot.walk(A.gates[0] + 1, 'the brass gate'), 'through the brass gate');
  need(bot, 20, 0, 'the brass gate took the key');
  await must(bot, bot.walk(A.gates[1] + 1, 'the steel gate'), 'through the steel gate');
  need(bot, 21, 0, 'the steel gate took the key');
  // the mill's roof, for the sixth page
  await must(bot, bot.walk(A.millLadder, 'the mill ladder'), 'to the mill ladder');
  await must(bot, bot.climb('up', A.mill[2] - 1, 'up the mill'), 'up the mill');
  await page(bot, () => must(bot, bot.walk(A.page, 'the roof'), 'along the roof'), 'the sixth page');
  await must(bot, bot.wait(READ), 'reading the page');
  await must(bot, bot.walk(A.millLadder, 'the ladder'), 'back to the ladder');
  await must(bot, bot.climb('down', G - 1, 'down the mill'), 'down');
  await leave(bot, bot.walk(A.exit + 1, 'the exit'), 'the exit');
}

/** Frost Lot: across the ice with the clock, the notes and donuts on it, the tent. */
export async function frostLot(bot: StarterBot): Promise<void> {
  const A = AT_THAW;
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(14, 'the thaw placard'), 'to the thaw placard');
  await must(bot, bot.wait(READ), 'reading');
  await hop(bot, A.pond[0] - 2);
  const t0 = bot.sim.ticks;
  await must(bot, bot.walk(A.pond[1] + 1, 'across the ice'), 'across the ice');
  bot.say(`across the ice at tick ${bot.sim.ticks} (the first section cracks at ${A.first})`);
  if (bot.sim.ticks > A.first + 5 * A.gap) throw new Error(`the bot is too slow for the ice: tick ${bot.sim.ticks} (${t0} at the edge)`);
  await must(bot, bot.wait(READ / 2), 'reading the pond placard');
  await must(bot, bot.walk(A.exit - 6, 'the tent'), 'to the tent');
  await must(bot, bot.wait(READ), 'reading the tent placard');
  await leave(bot, bot.walk(A.exit + 1, 'the exit'), 'the exit');
}

/** The tick (mod the 144-tick cycle) at which the clock's cog planks began, found by watching the first one go out. */
async function cogClock(bot: StarterBot): Promise<number> {
  const A = AT_CLOCK;
  const book = levels.find((l) => l.file === 'clock')!.book;
  const off = book.n('cogOff');
  const at = () => bot.sim.w.blkmap[bot.sim.blockAt(A.bridge[0] + ORIGIN, A.tiers[0] + ORIGIN)];
  let prev = at();
  for (let t = 0; t < 400; t++) {
    await must(bot, bot.wait(1), 'watching the cogs');
    const now = at();
    if (now === off && prev !== off) return bot.sim.ticks - 108;
    prev = now;
  }
  throw new Error('the cogs never blinked');
}

/** Crosses a bridge of cogs when every plank will hold for the walk (about 5 ticks a block), going right (dir 1) or left (-1). */
async function crossCogs(bot: StarterBot, t0: number, dir: 1 | -1, to: number): Promise<void> {
  const A = AT_CLOCK;
  const n = A.bridge[1] - A.bridge[0] + 1;
  const safe = (s: number): boolean => {
    for (let k = 0; k < n; k++) {
      const i = dir > 0 ? k : n - 1 - k;
      const ta = s + 5 * (k + 1);
      if (!cogSolid(cogOffset(i), ta - 8 - t0) || !cogSolid(cogOffset(i), ta + 10 - t0)) return false;
    }
    return true;
  };
  for (let t = 0; t < 300 && !safe(bot.sim.ticks); t++) await must(bot, bot.wait(1), 'waiting for the cogs');
  await must(bot, bot.walk(to, 'across the cogs'), 'across the cogs');
}

/** 4. Crosswalk Corner: five gates on their own lights, the barber's key up a ladder, the brass gate. */
export async function crosswalk(bot: StarterBot): Promise<void> {
  const A = AT_RUSH;
  const G = A.ground;
  const book = levels.find((l) => l.file === 'rush')!.book;
  const stop = book.n('barrStop');
  const at = () => bot.sim.w.blkmap[bot.sim.blockAt(A.gates[0] + ORIGIN, G - 1 + ORIGIN)];
  // the first gate's shutting is what tells the bot where the lights are in their cycle (it shuts 120 ticks into the cycle)
  let t0 = -1;
  const calibrate = async (): Promise<void> => {
    let prev = at();
    for (let t = 0; t < 400 && t0 < 0; t++) {
      await must(bot, bot.wait(1), 'watching the lights');
      const now = at();
      if (now === stop && prev !== stop) t0 = bot.sim.ticks - 120 + A.offsets[0];
      prev = now;
    }
    if (t0 < 0) throw new Error('the first gate never shut');
  };
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  const through = async (i: number): Promise<void> => {
    const x = A.gates[i];
    await must(bot, bot.walk(x - 3, 'a stop line'), 'to a stop line');
    if (t0 < 0) await calibrate();
    for (let t = 0; t < 400; t++) {
      const { phase, left } = phaseAt(A.offsets[i], bot.sim.ticks - t0);
      if (phase === 'Go' && left >= 34 && left <= 80) break;
      await must(bot, bot.wait(1), 'waiting at a light');
    }
    bot.say(`gate ${i} at tick ${bot.sim.ticks}, hit points ${bot.sim.ci.hitpts}, ${JSON.stringify(phaseAt(A.offsets[i], bot.sim.ticks - t0))}`);
    await must(bot, bot.walk(x + 3, 'through a gate'), 'through the gate');
  };
  await through(0);
  await must(bot, bot.wait(READ), 'reading the gates placard');
  await through(1);
  await through(2);
  // the barber's roof and the key
  await climbShaft(bot, A.ladder, A.roof[2] - 1, 'barber');
  await must(bot, bot.walk(A.key, 'the brass key'), 'along the roof');
  need(bot, 20, 1, 'the brass key');
  await must(bot, bot.walk(A.ladder + 1, 'the ladder'), 'back along the roof');
  await must(bot, bot.walk(A.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', G - 1, 'down the ladder'), 'down');
  await must(bot, bot.walk(A.ladder + 2, 'the street'), 'onto the street');
  await through(3);
  await through(4);
  await must(bot, bot.wait(READ), 'reading the brass placard');
  await must(bot, bot.walk(A.brass + 1, 'the brass gate'), 'through the brass gate');
  need(bot, 20, 0, 'the brass gate took the key');
  await leave(bot, bot.walk(A.exit + 1, 'the exit'), 'the exit');
}

/** 11. The Clock Tower: up four tiers, a bridge of blinking cogs on each, to the door at the top. */
export async function clockTower(bot: StarterBot): Promise<void> {
  const A = AT_CLOCK;
  const [t1, t2, t3] = A.tiers;
  const [lx, rx] = A.ladders;
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  await climbShaft(bot, lx, t1 - 1, 'first');
  await must(bot, bot.walk(A.left[1], 'the end of the ledge'), 'along the ledge');
  const t0 = await cogClock(bot);
  await crossCogs(bot, t0, 1, A.right[0] + 1);
  await must(bot, bot.wait(READ / 2), 'reading the cog placard');
  await climbShaft(bot, rx, t2 - 1, 'second');
  await must(bot, bot.walk(A.right[0], 'the end of the ledge'), 'along the ledge');
  await crossCogs(bot, t0, -1, A.left[1] - 1);
  await climbShaft(bot, lx, t3 - 1, 'third');
  await must(bot, bot.walk(A.left[1], 'the end of the ledge'), 'along the ledge');
  await crossCogs(bot, t0, 1, A.right[0] + 1);
  await must(bot, bot.wait(READ / 2), 'reading the bell placard');
  await climbShaft(bot, rx, A.tiers[3] - 1, 'fourth');
  await must(bot, bot.wait(READ / 2), 'reading the door placard');
  await must(bot, bot.walk(A.right[0], 'the end of the ledge'), 'along the ledge');
  await crossCogs(bot, t0, -1, A.left[1] - 1);
  await leave(bot, bot.walk(A.door, 'the clock face'), 'the clock face');
}

/** 7. Practice Hall: the shelf, the lights, the basement, the rafters. */
export async function practiceHall(bot: StarterBot): Promise<void> {
  const A = AT_HALL;
  const G = A.ground;
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  // the shelf and the first brass key
  await climbShaft(bot, A.shelf.ladder, A.shelf.planks[2] - 1, 'shelf');
  await must(bot, bot.walk(A.shelf.key, 'the brass key'), 'along the shelf');
  need(bot, 20, 1, 'the first brass key');
  await must(bot, bot.walk(A.shelf.planks[1] + 2, 'off the shelf'), 'off the shelf');
  await must(bot, bot.wait(READ / 2), 'reading the shelf placard');
  await must(bot, bot.walk(A.gates[0] + 1, 'the brass gate'), 'through the brass gate');
  need(bot, 20, 0, 'the brass gate took the key');
  // the lights: two ladders and the balcony, and the steel key
  await climbShaft(bot, A.lights.ladder1, A.lights.mezz[2] - 1, 'mezzanine');
  await must(bot, bot.walk(A.lights.ladder2, 'the second ladder'), 'along the mezzanine');
  await must(bot, bot.climb('up', A.lights.balcony[2] - 1, 'up to the balcony'), 'up');
  await must(bot, bot.walk(A.lights.key, 'the steel key'), 'along the balcony');
  need(bot, 21, 1, 'the steel key');
  await must(bot, bot.walk(A.lights.balcony[1] + 1, 'off the balcony'), 'off the balcony');
  await must(bot, bot.walk(A.gates[1] + 1, 'the steel gate'), 'through the steel gate');
  need(bot, 21, 0, 'the steel gate took the key');
  // the basement: down one hole, past a cone and a goose to the second brass key, up the other
  const b = A.basement;
  await must(bot, bot.walk(b.holes[0], 'the hole'), 'to the hole');
  await must(bot, bot.climb('down', b.floor - 1, 'down the hole'), 'down');
  await must(bot, bot.walk(b.cone - 2, 'the cone'), 'to the cone');
  await must(bot, bot.wait(READ / 2), 'reading the basement placard');
  await must(bot, bot.jump('right', b.cone + 2), 'over the cone');
  await hop(bot, b.key);
  need(bot, 20, 1, 'the second brass key');
  await hop(bot, b.holes[1]);
  await must(bot, bot.climb('up', G - 1, 'up the other hole'), 'up');
  await must(bot, bot.walk(A.gates[2] + 1, 'the second brass gate'), 'through the gate');
  need(bot, 20, 0, 'the second brass gate took the key');
  // the rafters, and the seventh page
  await climbShaft(bot, A.rafters.ladder, A.rafters.planks[2] - 1, 'rafters');
  await page(bot, () => must(bot, bot.walk(A.rafters.page, 'the rafters'), 'along the rafters'), 'the seventh page');
  await must(bot, bot.wait(READ), 'reading the page');
  await must(bot, bot.walk(A.rafters.ladder, 'the ladder'), 'back to the ladder');
  await must(bot, bot.climb('down', G - 1, 'down'), 'down');
  await leave(bot, bot.walk(A.exit + 1, 'the exit'), 'the exit');
}

/** 10. The Cannon Truck: three fuses (two guarded by sweepers), the high roads over the cannons, the truck's door. */
export async function cannonTruck(bot: StarterBot): Promise<void> {
  const A = AT_TRUCK;
  const G = A.ground;
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  await hop(bot, A.fuses[0]);
  need(bot, FUSES, 1, 'the first fuse');
  await must(bot, bot.wait(READ / 2), 'reading the ladders placard');
  // the first high road: the second fuse, and the page at its end
  await climbShaft(bot, A.high1.ladder, A.high1.planks[2] - 1, 'first high road');
  await must(bot, bot.walk(A.fuses[1], 'the second fuse'), 'along the plank');
  need(bot, FUSES, 2, 'the second fuse');
  await page(bot, () => must(bot, bot.walk(A.page[0], 'the end of the plank'), 'to the page'), 'the ninth page');
  await must(bot, bot.wait(READ), 'reading the page');
  await must(bot, bot.walk(A.high1.planks[1] + 2, 'off the plank'), 'off the plank');
  // the second high road, over the last cannons, down its far ladder
  await climbShaft(bot, A.high2.ladder, A.high2.planks[2] - 1, 'second high road');
  await must(bot, bot.walk(A.high2.down, 'the far ladder'), 'along the plank');
  await must(bot, bot.climb('down', G - 1, 'down'), 'down');
  await must(bot, bot.walk(A.high2.down + 2, 'the street'), 'onto the street');
  await hop(bot, A.fuses[2]);
  need(bot, FUSES, 3, 'the third fuse');
  await must(bot, bot.wait(READ), "reading Gigi's placard");
  await must(bot, bot.walk(A.truck + 1, 'the truck door'), 'through the truck door');
  need(bot, FUSES, 0, 'the truck took the fuses');
  await leave(bot, bot.walk(A.exit + 1, 'the exit'), 'the exit');
}

/** 9. The Bleachers: up the five rows with a judge and a card on each, the scoreboard's page, down, across two cannon zones. */
export async function bleachers(bot: StarterBot): Promise<void> {
  const A = AT_BLEACHERS;
  const G = A.ground;
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(8, 'the first placard'), 'to the placard');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(A.tiers[0][0] - 3, 'the bleachers'), 'to the first row');
  await must(bot, bot.wait(READ / 2), 'reading the judges placard');
  for (const [i, [a, b, row]] of A.tiers.entries()) {
    await must(bot, i === 0 ? bot.jump('right', a + 1) : bot.jump('right', a + 1), `up onto row ${i + 1}`);
    await must(bot, bot.walk(b - 1, 'along the row'), `along row ${i + 1}`);
    if (i < A.tiers.length - 1) await must(bot, bot.walk(b, 'the end of the row'), 'to the end of the row');
    void row;
  }
  if (bot.sim.ci.score - score < 4 * 50) throw new Error(`score ${bot.sim.ci.score - score}: not every judge got a card`);
  // the scoreboard's lookout and the eighth page, then down the ladder
  await must(bot, bot.walk(A.ladder, 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('up', A.lookout[2] - 1, 'up to the lookout'), 'up');
  await page(bot, () => must(bot, bot.walk(A.page, 'the scoreboard'), 'along the lookout'), 'the eighth page');
  await must(bot, bot.wait(READ), 'reading the page');
  await must(bot, bot.walk(A.ladder, 'the ladder'), 'back to the ladder');
  await must(bot, bot.climb('down', G - 1, 'down'), 'down');
  await must(bot, bot.walk(A.ladder + 3, 'the street'), 'to the street');
  await must(bot, bot.wait(READ), 'reading the cannon placard');
  for (const [a, b, kind] of A.zones) await cross(bot, 'stands', kind === 'A' ? 'cannonA' : 'cannonB', a, b, true, G - 1);
  await leave(bot, bot.walk(A.exit + 1, 'the exit'), 'the exit');
}
