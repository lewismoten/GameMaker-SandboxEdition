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
import { worldMons, scatter } from './foes';
import { peopleSheet } from './people';

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

  const mb = peopleSheet();
  const book2 = worldMons(mb);
  const solid = (x: number, y: number) => blocks[map.blocks[y * 100 + x]].solid !== 0;
  const slime = book2.n('slime');
  const bat = book2.n('bat');
  scatter(map, solid, 77, [
    [slime, 24, 54, 34, 72, 4],
    [slime, 14, 36, 28, 44, 3],
    [bat, 34, 26, 44, 34, 3],
    [slime, 70, 40, 78, 56, 4],
    [bat, 72, 62, 80, 72, 4],
  ]);
  const mons = book2.finish();
  reindexMonsters(map);

  const files: AreaFile[] = [
    { name: 'world.bbl', bytes: serializeBlocks(blocks) },
    { name: 'world.pal', bytes: serializePalette(book.pal!.vga) },
    { name: 'world.map', bytes: serializeMap(map) },
    { name: 'world.mon', bytes: serializeMonsters(mons) },
    { name: 'people.mbl', bytes: serializeBlocks(mb.blocks) },
  ];
  const scene: SceneSpec = {
    id: 'world',
    desc: 'Procrastia',
    files: { pal: 'world.pal', map: 'world.map', bbl: 'world.bbl', mon: 'world.mon', mbl: 'people.mbl' },
    links: [],
  };
  return { files, scene, plan, map, book, blocks, mb, mons };
}
