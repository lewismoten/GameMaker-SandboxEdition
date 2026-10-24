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
import { worldMons, scatter, place } from './foes';
import { TALK } from '../levels/script';
import { giftCell, talkFiles, talkScene } from '../levels/talk';
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
  book.add(
    'egg',
    eggBlock((x, y) => grass(x, y)),
    { obj: 1 },
  );
  const keepOut = [...Object.values(plan.spot), ...plan.stamps.map((s) => [s.x, s.y] as [number, number])];
  const clear = (x: number, y: number) => {
    for (let dy = -2; dy <= 3; dy++)
      for (let dx = -2; dx <= 3; dx++) for (const l of ['water', 'road', 'forest', 'rock']) if (plan.cm.in(l, x + dx, y + dy)) return false;
    return keepOut.every(([sx, sy]) => Math.abs(sx - x) > 4 || Math.abs(sy - y) > 4);
  };
  const ground = resolveGround(plan.cm, book, {
    layers: ['water', 'rock', 'forest', 'road'],
    fullVariants: { water: 3, forest: 3, rock: 3 },
    base: (x, y) => {
      const h = cellHash(x, y);
      // lone trees and bushes, never in anybody's way: away from the roads, the doors, the
      // clearings and anything the quests need
      const t = cellHash(x, y, 11);
      if (t < 0.045 && clear(x, y)) return t < 0.02 ? 'tree' : t < 0.032 ? 'pine' : 'bush';
      return h < 0.03 ? 'flowers' : h < 0.05 ? 'tufts' : h < 0.065 ? 'stones' : h < 0.3 ? 'grass1' : h < 0.5 ? 'grass2' : h < 0.7 ? 'grass3' : 'grass';
    },
  });
  if (ground.conflicts.filter(([, , l]) => !(l.includes('water') && l.includes('road'))).length)
    console.log('world: layers meet in', ground.conflicts.filter(([, , l]) => !(l.includes('water') && l.includes('road'))).slice(0, 8));
  const map: GameMap = newMap();
  map.blocks.set(ground.blocks);
  for (const s of plan.stamps)
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) map.blocks[(s.y + y) * 100 + s.x + x] = book.n(`${s.name}:${x},${y}`);
  const blocks = book.finish();

  const mb = peopleSheet();
  const book2 = worldMons(mb);
  const solid = (x: number, y: number) => blocks[map.blocks[y * 100 + x]].solid !== 0;
  const slime = book2.n('slime');
  const bat = book2.n('bat');
  const goblin = book2.n('goblin');
  // (lighter on the Nowish-Laterburg road, which the quest crosses again and again; goblins
  // on the road south to the Keep)
  scatter(map, solid, 77, [
    [slime, 24, 54, 34, 72, 3],
    [slime, 14, 36, 28, 44, 2],
    [bat, 34, 26, 44, 34, 3],
    [slime, 70, 40, 78, 56, 4],
    [bat, 72, 62, 80, 72, 2],
    [goblin, 70, 64, 82, 76, 3],
  ]);
  // the royal hounds and Sir Reginald, each a talk (walk into them) that sends them home
  const world: SceneSpec['links'] = [];
  const talkScenes: SceneSpec[] = [];
  const talkFilesOut: AreaFile[] = [];
  for (const [key, talk] of [
    ['teddy', TALK.teddy],
    ['gwinn', TALK.gwinn],
    ['chick', TALK.chick],
  ] as const) {
    const at = plan.spot[key];
    place(map, book2.n(`npc:${key}`), at[0], at[1]);
    world.push({ from: at, to: talk.id, at: giftCell(talk.gift ?? 'none') });
    talkScenes.push(talkScene(talk, 'world', [at[0], at[1] + 1]));
    talkFilesOut.push(...talkFiles(talk));
  }
  const mons = book2.finish();
  reindexMonsters(map);

  const files: AreaFile[] = [
    ...talkFilesOut,
    { name: 'world.bbl', bytes: serializeBlocks(blocks) },
    { name: 'world.pal', bytes: serializePalette(book.pal!.vga) },
    { name: 'world.map', bytes: serializeMap(map) },
    { name: 'world.mon', bytes: serializeMonsters(mons) },
    { name: 'people.mbl', bytes: serializeBlocks(mb.blocks) },
  ];
  const scene: SceneSpec = {
    id: 'world',
    desc: 'Procrastia',
    files: { pal: 'world.pal', map: 'world.map', bbl: 'world.bbl', mon: 'world.mon', mbl: 'people.mbl', cmf: 'world.cmf' },
    links: world,
  };
  return { files, scene, talkScenes, plan, map, book, blocks, mb, mons };
}
