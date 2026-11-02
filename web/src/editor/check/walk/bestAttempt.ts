// The bot's best try at a scene it didn't get through, with no DOM: the place it reached
// nearest a way on (not one the hero is doomed in), and the keys that get there. The
// walkthrough keeps it as a segment marked incomplete (format.ts) so the person can watch how
// far the bot got in a scene, even when it got through none.
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Entry, Exploration } from '../explore';
import type { FileSource } from '../sim';
import type { WalkSegment } from '../../../walkthrough/format';
import { encodeKeys, keysAt } from '../../../walkthrough/format';
import { pathTo, replayPath } from './replayPath';

type Place = Exploration['places'][number];

/** The place nearest any goal cell (Manhattan, on a map `width` cells wide); ties go to the one reached sooner. */
export function furthestPlace(places: Place[], goal: number[], width: number): Place | undefined {
  const dist = (cell: number) =>
    goal.length ? Math.min(...goal.map((g) => Math.abs((g % width) - (cell % width)) + Math.abs(Math.floor(g / width) - Math.floor(cell / width)))) : 0;
  let best: Place | undefined;
  for (const p of places) {
    if (p.doomed) continue;
    if (!best || dist(p.cell) < dist(best.cell) || (dist(p.cell) === dist(best.cell) && p.tick < best.tick)) best = p;
  }
  return best;
}

/** The segment of the bot's furthest try in `scene`, marked incomplete with `why`; none when it can't be played again. */
export async function bestAttempt(
  game: Game,
  files: FileSource,
  scene: number,
  entry: Entry,
  ex: Exploration | undefined,
  goal: number[],
  width: number,
  why: string,
  seed: number,
): Promise<WalkSegment | undefined> {
  const place = ex && furthestPlace(ex.places, goal, width);
  if (!ex || !place) return undefined;
  if (!place.via) return { scene, keys: '', incomplete: why };
  const r = await replayPath(game, files, scene, entry, ex.moves, pathTo(ex, place.via), seed);
  return r ? { scene, keys: encodeKeys(keysAt(r.events)), incomplete: why } : undefined;
}
