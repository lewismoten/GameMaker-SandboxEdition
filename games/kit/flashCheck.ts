// Flashing, measured: replays each game's walkthrough on the real engine and counts, in every
// second of it, the flashes the W3C's WCAG 2.3.1 describes (flashMeter.ts has the measuring and what it
// can't see). A game that flashes more than three times in any one second, or flashes saturated
// red that often, FAILS; it is advice for the author, who may know better (a scroll across a
// striped wall reads as flashing here). Advisory for the other games, a check for the game that teaches it.
//
// The command line is flashCheckCli.ts.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Walkthrough } from '../../web/src/walkthrough/format';
import { FlashMeter, LocalFlashMeter, MAX_FLASHES, type LocalWorst, type Worst } from './flashMeter';
import { replay } from './walkthrough';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');

export interface FlashReport {
  id: string;
  seconds: number;
  general: Worst;
  red: Worst;
  /** The busiest 20x20 spot (advisory: a small patch blinking, which the area rule lets through). */
  local: LocalWorst;
  /** The busiest spot blinks over three times a second. */
  localOver: boolean;
  /** Over three a second, general or red. */
  fails: boolean;
}

/** Replays `id`'s walkthrough and measures every frame. */
export async function flashOfGame(id: string): Promise<FlashReport> {
  const walk = JSON.parse(readFileSync(join(gamesDir, id, 'walkthrough.json'), 'utf8')) as Walkthrough;
  const meter = new FlashMeter(walk.timeline.fps);
  const local = new LocalFlashMeter(walk.timeline.fps);
  let scene = -1;
  const r = await replay(id, walk, {
    onFrame: (screen, n) => {
      // each scene starts from a fade; measuring begins again so the fade between scenes is not a flash
      if (n !== scene) {
        scene = n;
        meter.reset();
        local.reset();
      }
      meter.push(screen.pixels, screen.palette);
      local.push(screen.pixels, screen.palette);
    },
  });
  if (r.error) throw r.error;
  return {
    id,
    seconds: Math.round(r.frames / walk.timeline.fps),
    general: meter.general.worst,
    red: meter.red.worst,
    local: local.worst,
    localOver: local.worst.flashes > MAX_FLASHES,
    fails: meter.general.worst.flashes > MAX_FLASHES || meter.red.worst.flashes > MAX_FLASHES,
  };
}
