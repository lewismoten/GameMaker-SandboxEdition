// The two things a "How do I…?" question does (howDoIIndex.ts): Play this level, which plays
// the game from the question's scene in the read-only look-inside editor (…?play=, as Play
// Level does), and See how it's made, which opens that scene's map there, scrolled to the
// question's spot (…?x=&y=), with the "How this level is made" page one tap away (lessonButton.ts).
// Both read the game's .gam first, so they are async; neither writes anything.
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { fetchGameFile, type CatalogEntry } from '../../project/files';
import type { Question } from '../../project/howDoI';
import { formatHash } from '../../urlState';
import { lookId } from './lookId';

/** The file's name as the game lists it (the catalog keeps them lowercase). */
const listed = (e: Pick<CatalogEntry, 'files'>, name: string): string => e.files?.find((f) => f.toLowerCase() === name.toLowerCase()) ?? name;

async function gameOf(e: CatalogEntry) {
  const bytes = e.gam ? await fetchGameFile(e, e.gam) : undefined;
  return bytes && e.gam ? parseGame(bytes) : undefined;
}

/** The address that plays the question's level, or undefined when the game can't be read or no link leads there. */
export async function playHref(e: CatalogEntry, q: Question): Promise<string | undefined> {
  const game = await gameOf(e);
  if (!game || !e.gam) return undefined;
  const { waysIn } = await import('../editors/integrator/linkSpots');
  const { pickParam } = await import('./playLevel');
  const way = waysIn(game).find((w) => w.to === q.scene);
  return way && formatHash(['p', lookId(e.id), listed(e, e.gam)], { play: pickParam(way) });
}

/** The address that opens the question's map at its spot, with the lesson one tap away, or undefined when the scene has no map. */
export async function seeHref(e: CatalogEntry, q: Question): Promise<string | undefined> {
  const game = await gameOf(e);
  const map = game?.scenes[q.scene]?.files[1];
  return map ? formatHash(['p', lookId(e.id), listed(e, map)], { x: q.x, y: q.y, lesson: q.level }) : undefined;
}
