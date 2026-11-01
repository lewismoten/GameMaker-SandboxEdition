// The way through the game, as orders for the bot: every instrument picked up, every note on
// the stairs rung, the player piano played by ear and eye (a boop a tick or two after its key
// lights), and out of each level by its door.
import { expectScene as expect } from '@lewismoten/gamemaker-sandbox-tools/kit/routeChecks';
import { buildPalette } from '../src/art/pal';
import { CTR, HITS_NEEDED } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import { HARPS } from '../src/levels/strings';
import { LANES, KEY_ROW, SONG_TICKS, STEPS, railBlocks } from '../src/levels/rail';
import { Bot } from './bot';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** Runs the last order of a level: it must take Teddy into the next scene (or the ending). */
async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/**
 * Plays a stretch where a toy drummer can catch Teddy out: if it costs a life or more than
 * `maxLoss` hit points, it is taken back and played again after a short wait, so Teddy sets
 * out at a better moment (as a person waits for the drummer to march away).
 */
async function carefully(bot: Bot, label: string, maxLoss: number, stretch: () => Promise<void>): Promise<void> {
  const start = bot.snapshot();
  const hp = bot.sim.ci.hitpts;
  const deaths = bot.sim.deaths;
  let why = '';
  for (let wait = 0; wait <= 120; wait += 4) {
    bot.restore(start);
    try {
      if (wait && (await bot.wait(wait))) throw new Error('a scene change while waiting');
      await stretch();
    } catch (e) {
      why = String(e).split('\n').slice(0, 3).join(' / ');
      continue;
    }
    const loss = hp - bot.sim.ci.hitpts;
    if (bot.sim.deaths === deaths && loss <= maxLoss) {
      bot.say(`${label}: waited ${wait} ticks, lost ${loss} hit points`);
      return;
    }
    why = `lost ${loss} hit points, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

/** An instrument picked up at level (x, y): it must be gone, not still lying there. */
function picked(bot: Bot, x: number, y: number, what: string): void {
  if (bot.shown(x, y).effect === CTR.found) throw new Error(`missed ${what} at ${x},${y}`);
}

const found = (bot: Bot) => bot.sim.meter(CTR.found) - 1;

/** 1. The Piano Shop: six keyboards, the piano stairs, and out the back door. */
export async function thePianoShop(bot: Bot): Promise<void> {
  expect(bot, 2, 'the piano shop');
  await must(bot, bot.land(), 'standing on the counter');
  await must(bot, bot.walk(12, 'along the counter'), 'counter');
  picked(bot, 12, 5, 'the mellow piano on the counter');
  // off the left end of the counter, and back under it for the keyboard on the floor
  await must(bot, bot.walk(5, 'off the counter'), 'down');
  await must(bot, bot.walk(7, 'under the counter'), 'under');
  picked(bot, 7, 8, 'the bright piano under the counter');
  await carefully(bot, 'over the black keys and past the drummer', 8, async () => {
    // up onto the black keys, then a hop right over the drummer while he marches away
    await must(bot, bot.walk(16, 'onto the black keys'), 'black keys');
    await must(bot, bot.hop('right', 12, 'right', 22), 'over the toy drummer');
    await must(bot, bot.walk(23, 'past the toy drummer'), 'drummer');
    picked(bot, 22, 8, 'the electric piano');
  });
  // up the piano stairs, ringing a note on every step
  await must(bot, bot.walk(29, 'up the piano stairs'), 'stairs');
  if (bot.sim.meter(CTR.stairs) - 1 < 1 || bot.sim.meter(CTR.down) - 1 >= 99) throw new Error('the stairs did not ring');
  await must(bot, bot.walk(32, 'along the high shelf'), 'high shelf');
  picked(bot, 32, 2, 'the round electric piano');
  await carefully(bot, "down to Gwinn's shelf", 8, async () => {
    await must(bot, bot.walk(35, 'off the high shelf'), 'off the shelf');
    await must(bot, bot.hop('right', 12, 'right', 38), "onto Gwinn's shelf");
    await must(bot, bot.walk(39, "along Gwinn's shelf"), "Gwinn's shelf");
    picked(bot, 39, 5, 'the harpsichord');
  });
  await carefully(bot, 'onto the black keys', 8, async () => {
    await must(bot, bot.walk(41, "off Gwinn's shelf"), 'down');
    await must(bot, bot.walk(43, 'up onto the black keys'), 'black keys');
    picked(bot, 43, 7, 'the clavinet');
  });
  if (found(bot) !== 6) throw new Error(`found ${found(bot)} keyboards, not 6`);
  await leave(bot, bot.walk(48, 'out the back door'), 'the back door');
}

/** The art ring members that show a note head, by lane: the bot watches the tubes as a person does. */
const NOTE_HEADS = (() => {
  const book = railBlocks(buildPalette('noon')).book;
  return LANES.map((lane) => {
    const set = new Set<number>();
    for (let j = 0; j < STEPS; j++) if ((lane.notes as readonly number[]).includes((j + 6) % STEPS)) set.add(book.n(`${lane.id}.t${j}`));
    return set;
  });
})();

/** How far down its tube a lane's lowest note is (0 none, 6 the row above the key). */
function lowestNote(bot: Bot, lane: number): number {
  for (let r = 6; r >= 1; r--) if (NOTE_HEADS[lane].has(bot.sim.w.blkmap[bot.sim.blockAt(LANES[lane].x + ORIGIN, r + ORIGIN)])) return r;
  return 0;
}

/** 2. The Player Piano: play the notes as they land until the lid opens, then out. */
export async function thePlayerPiano(bot: Bot): Promise<void> {
  expect(bot, 3, 'the player piano');
  await must(bot, bot.land(), 'onto the rail');
  const hits = () => bot.sim.meter(CTR.hits) - 1;
  let played = 0;
  let whiffs = 0;
  while (bot.sim.ticks < SONG_TICKS || hits() < HITS_NEEDED) {
    if (bot.sim.ticks > SONG_TICKS * 3) throw new Error(`still in the piano with ${hits()} hits`);
    // the next note to land is the lowest one in either tube
    const next = [0, 1].sort((a, b) => lowestNote(bot, b) - lowestNote(bot, a))[0];
    const lane = LANES[next];
    if (process.env.BOT_NOTES) bot.say(`next ${lane.id}: lowest lo ${lowestNote(bot, 0)} hi ${lowestNote(bot, 1)} lit ${bot.shown(lane.x, KEY_ROW).scorePts}`);
    // step along the rail to the key (no settling: the rail is flat)
    const goal = lane.x * 20;
    if (bot.px.x !== goal)
      await must(
        bot,
        bot.until(bot.px.x > goal ? 'left' : 'right', () => bot.px.x === goal, `to the ${lane.id} key`, 30),
        'along the rail',
      );
    // wait for the key to light, then a person's reaction before the boop
    let waited = 0;
    while (!(bot.shown(lane.x, KEY_ROW).scorePts > 0)) {
      const r = await bot.tick();
      if (r) throw new Error(`the piano: ${r}`);
      if (++waited > 60) throw new Error(`the ${lane.id} key never lit`);
    }
    await must(bot, bot.wait(1 + Math.floor(bot.hand() * 2)), 'reacting');
    const before = hits();
    await must(bot, bot.boop(), 'boop');
    if (hits() > before) played++;
    else whiffs++;
    if (process.env.BOT_NOTES) bot.say(`boop ${lane.id} ${hits() > before ? 'hit' : 'MISS'}`);
    // let the key go dark before looking for the next note
    while (bot.shown(lane.x, KEY_ROW).scorePts > 0) await must(bot, bot.wait(1), 'waiting');
  }
  bot.say(`played ${played} notes on the beat, ${whiffs} missed; ${hits()} hits`);
  if (whiffs) throw new Error(`the bot missed ${whiffs} notes`);
  await leave(bot, bot.walk(16, 'through the lid and out'), 'out of the piano');
}

/** The bandstand: every stand along the stage gets its instrument, then out by the gate. */
function theBandstand(scene: number, stands: number) {
  const run = async (bot: Bot): Promise<void> => {
    expect(bot, scene, 'the bandstand');
    await must(bot, bot.land(), 'on the stage');
    await must(bot, bot.walk(2, 'to the first stand'), 'stands');
    await must(bot, bot.walk(2 + stands - 1, 'along the stands'), 'stands');
    const set = bot.sim.meter(CTR.band) - 1;
    if (set !== stands) throw new Error(`set ${set} of ${stands} instruments on their stands`);
    await leave(bot, bot.walk(16, 'off the stage and out the gate'), 'the gate');
  };
  Object.defineProperty(run, 'name', { value: `theBandstand${scene}` });
  return run;
}
export const theBandstand1 = theBandstand(4, 7);
export const theBandstand2 = theBandstand(6, 8);

/** Climbs a harp's strings (nothing pulls Teddy down there) to level row `row`. */
async function climb(bot: Bot, row: number, what: string): Promise<void> {
  await must(
    bot,
    bot.until('up', () => bot.px.y <= row * 20, `up ${what}`, 120),
    what,
  );
}

/** 3. The Music Store's Back Room: eight string instruments, two harps, the guitar cases. */
export async function theMusicStore(bot: Bot): Promise<void> {
  expect(bot, 5, 'the music store');
  await must(bot, bot.land(), 'on the counter');
  await must(bot, bot.walk(6, 'along the counter'), 'counter');
  picked(bot, 6, 5, 'the violin');
  await must(bot, bot.walk(3, 'off the counter'), 'down');
  picked(bot, 3, 8, 'the steel guitar');
  await must(bot, bot.walk(11, 'under the counter'), 'under');
  picked(bot, 11, 8, 'the pizzicato strings');
  await must(bot, bot.walk(HARPS[0], 'to the first harp'), 'harp');
  await climb(bot, 1, 'the first harp');
  await must(bot, bot.walk(18, 'along the high shelf'), 'high shelf');
  picked(bot, 18, 1, 'the harp');
  await carefully(bot, 'down past the drummer', 8, async () => {
    await must(bot, bot.walk(21, 'off the high shelf'), 'down');
    picked(bot, 21, 8, 'the nylon guitar');
  });
  await must(bot, bot.walk(27, 'up the guitar cases'), 'cases');
  await must(bot, bot.walk(30, 'along the shelf'), 'shelf');
  picked(bot, 30, 2, 'the oud');
  await must(bot, bot.walk(33, 'down to the floor'), 'floor');
  picked(bot, 33, 8, 'the orchestra');
  await must(bot, bot.walk(HARPS[1], 'to the second harp'), 'harp');
  await climb(bot, 1, 'the second harp');
  picked(bot, HARPS[1], 1, 'the chime harp');
  await must(bot, bot.walk(37, 'off the harp'), 'off');
  if (found(bot) < 8) throw new Error(`found ${found(bot)} string instruments, not 8`);
  await leave(bot, bot.walk(40, 'out the door'), 'the door');
}
