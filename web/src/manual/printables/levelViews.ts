// What the player ever sees of each map: the bounding box of every screen the engine shows while
// the level check's explorer plays each scene from every way in. The printed Level Maps crop to it
// (levelMapLayout.ts), so sky and ground no one reaches stay off the page. levelViews.json is
// written by web/scripts/levelViews.ts for the games levelSecrets.json lists; a map that isn't in
// it keeps the part of the map in use.
import VIEWS from './levelViews.json';

/** A box of map cells: x, y, width, height. */
export type SeenRect = [number, number, number, number];

/** Per game: the hash of the disk it was scanned from, and the seen box of each "map|bbl". */
export type LevelViews = Record<string, { hash: string; maps: Record<string, SeenRect> }>;

const LISTED = VIEWS as LevelViews;

/** A game's seen boxes by "map|bbl" (lower case), or undefined when it wasn't scanned. */
export const listedViews = (id: string): Record<string, SeenRect> | undefined => LISTED[id]?.maps;
