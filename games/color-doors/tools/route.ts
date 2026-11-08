// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press. It visits every door:
//   the hall: walk to a door, in; the gallery: a look at the swatches, along the wall, past the light, the table and the
//   flowers to the last door, which puts him back in the hall beside the door he used; the next door, and so on; then the
//   last door of the hall, which ends the game.
// The checks fail if a door leads to the wrong scene, a scene loads the wrong palette or map, or he lands anywhere but beside his door.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { GALLERY_END, HALL_DOORS, HALL_FINISH, hallLanding } from '../src/levels';
import { HALL_BACK } from '../src/game';
import { VIEWS } from '../src/views';

async function through(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'no link fired'}\n${bot.log.slice(-8).join('\n')}`);
}
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** A person's look at what just happened, in ticks (about two seconds). */
const LOOK = 40;
/** The scene files the bot is in (its palette is the first). */
const files = (bot: StarterBot): string[] => bot.sim.game.scenes[bot.sim.scene].files;

/** Kit must be standing on (world block) `cell`. */
function landed(bot: StarterBot, cell: [number, number], what: string): void {
  const want = { x: (cell[0] - ORIGIN) * 20, y: (cell[1] - ORIGIN) * 20 };
  const p = bot.px;
  if (p.x !== want.x || p.y !== want.y) throw new Error(`${what}: he should land on (${want.x}, ${want.y}), not at ${p.x}, ${p.y}`);
  bot.say(`${what}: landed beside the door`);
}

export async function journey(bot: StarterBot): Promise<void> {
  const maps = new Set<string>();
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  for (let i = 0; i < VIEWS.length; i++) {
    const v = VIEWS[i];
    await through(bot, bot.walk(HALL_DOORS[i], `the door for ${v.name}`, 2000), `door ${i}`);
    if (bot.sim.scene !== v.scene) throw new Error(`door ${i} should lead to scene ${v.scene}, not ${bot.sim.scene}`);
    const [pal, map] = files(bot);
    if (pal !== v.file) throw new Error(`scene ${v.scene} should load ${v.file}, not ${pal}`);
    maps.add(map);
    await must(bot, bot.wait(LOOK), `looking at the ${v.name} room`);
    await must(bot, bot.walk(40, 'along the swatches', 2000), 'swatches');
    await must(bot, bot.wait(LOOK / 2), 'a look at the names');
    await through(bot, bot.walk(GALLERY_END, 'the door back', 3000), 'door back');
    if (bot.sim.scene !== HALL_BACK) throw new Error(`the way back should lead to the hall's copy (${HALL_BACK}), not ${bot.sim.scene}`);
    landed(bot, hallLanding(i), `back from ${v.name}`);
    await must(bot, bot.wait(LOOK / 2), 'a breath in the hall');
  }
  if (maps.size !== 1) throw new Error(`all five doors should open the same map file; they opened ${[...maps].join(' ')}`);
  await through(bot, bot.walk(HALL_FINISH, 'the last door', 2000), 'last door');
}
