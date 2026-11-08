// What the graduations' tools/ folders share: the bot's walk up the aisle, the play loop on a game's built disk
// and the runs behind check.ts, gendemo.ts and walkthrough.ts (each game's own file is a few lines).
import { invisibleWalls } from './invisibleWalls';
import { StarterBot } from './bot';
import { playLevels } from '../levelRun';
import { recordDemo } from '../demoRecord';
import { writeSimWalkthrough } from '../walkthrough';
import type { buildLevels } from './graduationLevel';
import { LECTERN } from './graduationLevel';

type Route = (bot: StarterBot) => Promise<void>;

/** An aisle walk: along the carpet stop by stop, then into the certificate on the lectern at column `lectern`, which is the door out (to the ending). */
export const walkAisle =
  (stops: readonly (readonly [number, string])[], lectern: number): Route =>
  async (bot) => {
    for (const [x, what] of stops) {
      const out = await bot.walk(x, what);
      if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
    }
    // Let the whole audience cheer in view before collecting the certificate (about five seconds).
    const pause = await bot.wait(90);
    if (pause) throw new Error(`the ceremony: ${pause}`);
    const out = await bot.walk(lectern, 'the certificate');
    if (out !== 'link' && out !== 'end') throw new Error(`the certificate: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
  };

/** The first five graduations' aisle. */
export const aisle: Route = walkAisle(
  [
    [8, 'the first sign'],
    [16, 'under the helpers'],
    [28, 'the last sign'],
    [LECTERN - 2, 'the steps of the stage'],
  ],
  LECTERN,
);

export const SEED = 1;

/** The game's play loop: the bot plays `routes` in a row on the sim (a GameSim class for the game's disk). */
export function makePlay<S extends new (files?: undefined, seed?: number) => unknown>(GameSim: S, routes: Route[]) {
  return async function play(seed = SEED, upTo = routes.length): Promise<{ sim: InstanceType<S>; bot: StarterBot }> {
    const sim = new GameSim(undefined, seed) as InstanceType<S>;
    const bot = new StarterBot(sim as never);
    await playLevels(bot, routes, upTo);
    return { sim, bot };
  };
}

type Play = (seed?: number, upTo?: number) => Promise<{ sim: unknown }>;
interface Sim {
  ci: { score: number };
  trail: unknown[];
  segments: { keys: readonly { delta: number; key: number }[] }[];
}

/** check.ts: no invisible walls, then the bot wins without losing a life. */
export async function graduationCheck(id: string, built: ReturnType<typeof buildLevels>, play: Play): Promise<void> {
  for (const l of built.levels) {
    const found = invisibleWalls(l.book, l.book.finish(), built.pal, [{ name: l.file, map: l.map.done() }]);
    if (found.length) throw new Error(`Invisible walls (a solid block drawn as sky). Draw a wall, hedge or fence instead:\n  ${found.join('\n  ')}`);
  }
  const sim = (await play()).sim as Sim;
  console.log(`${id}: the bot walked the aisle; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
}

/** gendemo.ts: the first stretch of the bot's run, written to `demoFile` (the game's src/demo.ts). */
export async function graduationDemo(play: Play, demoFile: URL, length = 420): Promise<void> {
  const sim = (await play(undefined, 1)).sim as Sim;
  recordDemo(sim.segments[0].keys, length, demoFile);
}

/** walkthrough.ts: the bot's whole game recorded as the game's walkthrough.json. */
export async function graduationWalkthrough(id: string, play: Play, titles: Record<number, string>): Promise<void> {
  const { sim } = await play(SEED);
  await writeSimWalkthrough(id, sim as never, SEED, titles);
}
