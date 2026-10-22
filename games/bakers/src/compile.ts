// Everything the game is made of, compiled in memory: the four block sets, the monster
// blocks, Doc Leo, every room and the scene graph. build.ts writes it to disk; the tools
// play it.
import { buildLeo } from './characters/leo';
import { buildGame } from './game';
import { buildTileSet, type Style, type TileSet } from './blocks/tiles';
import { ROOM_SPECS } from './levels';
import { buildRoom } from './levels/room';
import { buildLeoBlocks } from './sprites/leo';
import { buildMonsterBlocks } from './sprites/monsters';

export function compileAll() {
  const cb = buildLeoBlocks();
  const chr = buildLeo(cb);
  const mb = buildMonsterBlocks();
  const sets = Object.fromEntries((['kitchen', 'cellar', 'parlor', 'works'] as Style[]).map((s) => [s, buildTileSet(s)])) as Record<Style, TileSet>;
  const rooms = ROOM_SPECS.map((spec) => buildRoom(spec, sets[spec.style], mb));
  const game = buildGame(rooms);
  return { cb, chr, mb, sets, rooms, game };
}

export type Compiled = ReturnType<typeof compileAll>;
