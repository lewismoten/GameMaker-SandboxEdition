// What the player ever sees of each map: the bounding box of every screen the engine shows while
// the level check's explorer plays each scene from every way in. The printed Level Maps crop to it
// (levelMapLayout.ts), so sky and ground no one reaches stay off the page. levelViews/*.json is
// written by web/scripts/levelViews.ts for the games levelSecrets/*.json lists; a map that isn't in
// it keeps the part of the map in use. A map the hero walks off the edge of (maps wrap) also has
// its unrolled box (editor/check/unroll.ts): the map laid out as the player goes through it. A
// course through the wrap (editor/check/course.ts) also has the walkthrough's path along it.
import { hasLoader, VIEW_FILES } from './levelMetadataLazy';
import type { Unrolled } from '../../editor/check/unroll';
import type { CoursePath } from '../../editor/check/course';

/** A box of map cells: x, y, width, height. */
export type SeenRect = [number, number, number, number];

/** The rows the hero stood on in each column he stood in: x, first row, last row. */
export type StoodColumns = [number, number, number][];

/** A map the hero walks off the edge of, as the player goes through it, and where he stood on it (when scanned since that was kept). */
export type UnrolledMap = Unrolled & { stood?: StoodColumns };

/** Per game: the hash of the disk it was scanned from, and the seen box of each "map|bbl". */
export type LevelViews = Record<
  string,
  { hash: string; maps: Record<string, SeenRect>; unrolled?: Record<string, UnrolledMap>; courses?: Record<string, CoursePath> }
>;

/** A game's scan: its seen boxes by "map|bbl" (lower case), the unrolled maps the hero walks off an edge of, and its courses through the wrap. Undefined when it wasn't scanned. */
export const loadViews = async (id: string): Promise<LevelViews[string] | undefined> =>
  hasLoader(VIEW_FILES, id) ? ((await VIEW_FILES[id]()) as LevelViews[string]) : undefined;
