// The overworld's files: WORLD.BBL, WORLD.MAP, WORLD.MON, WORLD.PAL, and the world scene.
import { serializeBlocks } from '../../../../web/src/formats/blocks';
import { newMap, serializeMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import { serializeMonsters } from '../../../../web/src/formats/monster';
import { serializePalette } from '../../../../web/src/formats/palette';
import { BlockBook } from '../blocks/book';
import { worldTerrain } from '../blocks/world';
import { worldFeatures } from '../blocks/worldFeatures';
import { paintBridge, grass } from '../art/terrain';
import { eggBlock } from '../art/egg';
import { bridgeCombos, bridgeName, cellHash, resolveGround } from '../levels/ground';
import { planWorld } from '../levels/world';
import { BLK } from '../ids';
import type { Cast } from './cast';
import type { SceneSpec } from '../game';
import { foeSheet, worldMonsters, placeWorldMonsters } from './foes';

export interface AreaFile {
  name: string;
  bytes: Uint8Array;
}

export function buildWorld(cast: Cast) {
  void cast;
  const plan = planWorld();
  const book = new BlockBook('world', { [BLK.egg]: 'egg' });
  worldTerrain(book);
  for (const [wm, rm] of bridgeCombos(plan.cm)) book.add(bridgeName(wm, rm), paintBridge(wm, rm), {});
  worldFeatures(book);
  book.add('egg', eggBlock((x, y) => grass(x, y)), { obj: 1 });
  const ground = resolveGround(plan.cm, book, {
    layers: ['water', 'rock', 'forest', 'road'],
    fullVariants: { water: 3, forest: 3, rock: 3 },
    base: (x, y) => {
      const h = cellHash(x, y);
      return h < 0.03 ? 'flowers' : h < 0.05 ? 'tufts' : h < 0.065 ? 'stones' : h < 0.3 ? 'grass1' : h < 0.5 ? 'grass2' : h < 0.7 ? 'grass3' : 'grass';
    },
  });
  if (ground.conflicts.filter(([, , l]) => !(l.includes('water') && l.includes('road'))).length)
    console.log('world: layers meet in', ground.conflicts.filter(([, , l]) => !(l.includes('water') && l.includes('road'))).slice(0, 8));
  const map: GameMap = newMap();
  map.blocks.set(ground.blocks);
  for (const s of plan.stamps) for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) map.blocks[(s.y + y) * 100 + s.x + x] = book.n(`${s.name}:${x},${y}`);
  const blocks = book.finish();

  const mb = foeSheet();
  const mons = worldMonsters(mb);
  placeWorldMonsters(map, plan, (x, y) => blocks[map.blocks[y * 100 + x]].solid !== 0);
  reindexMonsters(map);

  const files: AreaFile[] = [
    { name: 'world.bbl', bytes: serializeBlocks(blocks) },
    { name: 'world.pal', bytes: serializePalette(book.pal!.vga) },
    { name: 'world.map', bytes: serializeMap(map) },
    { name: 'world.mon', bytes: serializeMonsters(mons) },
    { name: 'foe.mbl', bytes: serializeBlocks(mb.blocks) },
  ];
  const scene: SceneSpec = {
    id: 'world',
    desc: 'Procrastia',
    files: { pal: 'world.pal', map: 'world.map', bbl: 'world.bbl', mon: 'world.mon', mbl: 'foe.mbl' },
    links: [],
  };
  return { files, scene, plan, map, book, blocks, mb, mons };
}
