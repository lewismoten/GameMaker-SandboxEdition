// The way through the game, as orders for the bot: each level's lenses, the focus rings it
// pulls on the way, the RGB gate and the vanishing point. It keeps to the normal route: the
// Hall of Mirrors' two-way mirror (and what lies behind it) is left alone.
import { Bot } from './bot';
import { LEVELS, type Level } from '../src/levels/levels';
import { buildLevel } from '../src/levels/map';
import { TileBook } from '../src/tiles/book';
import { rulesFor } from '../src/tiles/rules';
import { farScene, nearScene } from '../src/game';

type Step = [number, number, string] | ['pickup'] | ['wait', number] | ['face', 'up' | 'down' | 'left' | 'right'];

/** The level's offset in the 100x100 world. */
function offset(level: Level): [number, number] {
  const b = buildLevel(new TileBook(level.theme, rulesFor({ level: level.n })), level);
  return [b.ox, b.oy];
}

/**
 * Plays a stretch where monsters can catch Ray out: if it costs a life or more than
 * `maxLoss` light, it is taken back and played again after a wait, so he rolls out at a
 * better moment.
 */
export async function carefully(bot: Bot, label: string, maxLoss: number, stretch: () => Promise<void>): Promise<void> {
  const start = bot.snapshot();
  const hp = bot.sim.ci.hitpts;
  const deaths = bot.sim.deaths;
  let why = '';
  for (let wait = 0; wait <= 240; wait += 6) {
    bot.restore(start);
    try {
      if (wait && (await bot.wait(wait))) throw new Error('a scene change while waiting');
      await stretch();
    } catch (e) {
      why = String(e);
      continue;
    }
    const loss = hp - bot.sim.ci.hitpts;
    if (bot.sim.deaths === deaths && loss <= maxLoss) {
      if (wait) bot.say(`${label}: waited ${wait} ticks, lost ${loss}`);
      return;
    }
    why = `lost ${loss} light, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

/** Follows steps; a step onto a ring or the vanishing point must change the scene. */
async function follow(bot: Bot, level: Level, steps: Step[]): Promise<void> {
  const [ox, oy] = offset(level);
  for (const s of steps) {
    if (s[0] === 'pickup') {
      await bot.pickup();
      continue;
    }
    if (s[0] === 'wait') {
      await bot.wait(s[1] as number);
      continue;
    }
    if (s[0] === 'face') {
      await bot.face(s[1] as 'up');
      continue;
    }
    const [x, y, label] = s as [number, number, string];
    const changes = /^(ring|exit)/.test(label);
    await carefully(bot, `${level.name}: ${label}`, 30, async () => {
      const r = await bot.goto(ox + x, oy + y, label);
      if (changes && r !== 'link' && r !== 'end') throw new Error(`${label}: no scene change (${r})`);
      if (!changes && r) throw new Error(`${label}: ${r}`);
    });
  }
}

const expectScene = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

export const ROUTES: Step[][] = [
  // 1. The Checkerboard
  [
    [8, 1, 'photons'],
    [15, 5, 'ring 1 to far'],
    [23, 3, 'red lens'],
    [23, 9, 'green lens'],
    [23, 6, 'ring 2 to near'],
    [30, 3, 'chasm edge'],
    [36, 3, 'ring 3 to far'],
    [41, 2, 'blue lens'],
    [41, 10, 'exit'],
  ],
];

/** Plays the first steps of a level's route, from its card scene. */
export async function playSteps(bot: Bot, i: number, steps: Step[]): Promise<void> {
  const level = LEVELS[i];
  // the card scene links straight on
  for (let t = 0; t < 5 && bot.sim.scene !== nearScene(i); t++) await bot.wait(1);
  expectScene(bot, nearScene(i), `${level.name} (near)`);
  await follow(bot, level, steps);
}

export async function playLevel(bot: Bot, i: number): Promise<void> {
  await playSteps(bot, i, ROUTES[i]);
  bot.say(`${LEVELS[i].name} done`);
  void farScene;
}
