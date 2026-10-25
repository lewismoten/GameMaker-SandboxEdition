// The roads and walks of each top-down block set, by block name: what games/lark/walkPaths.json
// lists (games/kit/walkPaths.ts) so the walkthrough's bot walks along them. The Long Road's
// path, the park's path and Main Street's sidewalks (the parade's road is left off), the snow's
// trodden road, front walks, eaves and sidewalks (the plowed street left off), and the rock
// garden's gravel. Rooms and lots paved wall to wall (the square, the shop, the lot, the Hive)
// have none: every way across them is as good.
import type { BlockSet } from './blocks/sets';

const WAYS: Record<string, string[]> = {
  town: ['path', 'path2'],
  park: ['path', 'paver', 'paver2'],
  snow: ['trodden', 'trodden2', 'walk', 'sidewalk', 'eaveA', 'eaveB', 'doormat', 'doormatSwept'],
  garden: ['gravel', 'gravel2'],
};

/** Block numbers of the ways, by .bbl name. */
export function walkPaths(sets: Record<string, BlockSet>): Record<string, number[]> {
  return Object.fromEntries(Object.entries(WAYS).map(([set, names]) => [`${set}.bbl`, names.map((n) => sets[set].id(n))]));
}
