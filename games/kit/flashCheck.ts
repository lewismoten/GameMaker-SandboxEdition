// Flashing, measured: replays each game's walkthrough on the real engine and counts, in every
// second of it, the flashes the W3C's WCAG 2.3.1 describes (flashMeter.ts has the measuring and what it
// can't see). A game that flashes more than three times in any one second, or flashes saturated
// red that often, FAILS; it is advice for the author, who may know better (a scroll across a
// striped wall reads as flashing here). Advisory for the other games, a check for the game that teaches it.
//
//   cd web && npx vite-node ../games/kit/flashCheck.ts [<id> ...] [--json]     (no id: every game with a walkthrough)
//
// Exits 1 when a game named on the command line exceeds three a second; with no ids it lists and exits 0.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Walkthrough } from '../../web/src/walkthrough/format';
import { FlashMeter, MAX_FLASHES, type Worst } from './flashMeter';
import { replay } from './walkthrough';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');

export interface FlashReport {
  id: string;
  seconds: number;
  general: Worst;
  red: Worst;
  /** Over three a second, general or red. */
  fails: boolean;
}

/** Replays `id`'s walkthrough and measures every frame. */
export async function flashOfGame(id: string): Promise<FlashReport> {
  const walk = JSON.parse(readFileSync(join(gamesDir, id, 'walkthrough.json'), 'utf8')) as Walkthrough;
  const meter = new FlashMeter(walk.timeline.fps);
  let scene = -1;
  const r = await replay(id, walk, {
    onFrame: (screen, n) => {
      // each scene starts from a fade; measuring begins again so the fade between scenes is not a flash
      if (n !== scene) {
        scene = n;
        meter.reset();
      }
      meter.push(screen.pixels, screen.palette);
    },
  });
  if (r.error) throw r.error;
  return {
    id,
    seconds: Math.round(r.frames / walk.timeline.fps),
    general: meter.general.worst,
    red: meter.red.worst,
    fails: meter.general.worst.flashes > MAX_FLASHES || meter.red.worst.flashes > MAX_FLASHES,
  };
}

const line = (r: FlashReport) =>
  `${r.id.padEnd(22)} ${String(r.seconds).padStart(5)}s  general ${String(r.general.flashes).padStart(2)} a second (biggest change ${(r.general.area * 100).toFixed(0)}% of the screen${r.general.flashes ? `, at ${r.general.at.toFixed(1)}s` : ''})  red ${String(r.red.flashes).padStart(2)}${r.fails ? '  OVER 3' : ''}`;

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('flashCheck.ts')) {
  const named = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const ids = named.length
    ? named
    : readdirSync(gamesDir).filter((n) => existsSync(join(gamesDir, n, 'walkthrough.json')) && existsSync(join(gamesDir, n, 'disk')));
  const out: FlashReport[] = [];
  for (const id of ids) {
    try {
      const r = await flashOfGame(id);
      out.push(r);
      if (!process.argv.includes('--json')) console.log(line(r));
    } catch (e) {
      console.error(`${id}: ${(e as Error).message}`);
    }
  }
  if (process.argv.includes('--json')) console.log(JSON.stringify(out));
  else console.log(`\n${out.length} games, ${out.filter((r) => r.fails).length} over ${MAX_FLASHES} a second`);
  process.exit(named.length && out.some((r) => r.fails) ? 1 : 0);
}
