// A tiny platform game built in memory for the level check's tests: a floor with walls, a pit
// with no way out, a coin sealed in a wall, and an exit link. `cells` paints the map.
import { newBlockSet, serializeBlocks } from '../../formats/blocks';
import { newCharacter, serializeCharacter } from '../../formats/character';
import { ADVTYPE, emptyScene, newGame, serializeGame, type Game } from '../../formats/game';
import { MLEN, newMap, serializeMap } from '../../formats/map';

export const AIR = 0;
export const WALL = 1;
export const COIN = 2;
export const SPIKES = 3;
export const RIGHT = 0x4d;
export const LEFT = 0x4b;

export interface TestGame {
  game: Game;
  files: Map<string, Uint8Array>;
  get(name: string): Uint8Array | undefined;
}

/** rows: '#' wall, '.' air, 'c' coin, '^' spikes, 'S' start, 'E' exit; drawn from (0, 0). */
export function testGame(rows: string[]): TestGame {
  const map = newMap();
  map.blocks.fill(WALL);
  let start = { x: 1, y: 1 };
  let exit = { x: 2, y: 1 };
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      map.blocks[y * MLEN + x] = ch === '#' ? WALL : ch === 'c' ? COIN : ch === '^' ? SPIKES : AIR;
      if (ch === 'S') start = { x, y };
      if (ch === 'E') exit = { x, y };
    }),
  );
  const bbl = newBlockSet('bbl');
  bbl[AIR].grav = 4;
  bbl[WALL].solid = 15;
  bbl[WALL].pixels.fill(7);
  Object.assign(bbl[COIN], { grav: 4, scorePts: 10, touchBl: AIR });
  bbl[COIN].pixels.fill(14);
  Object.assign(bbl[SPIKES], { grav: 4, chHitPt: -5 });
  for (let i = 300; i < 400; i++) bbl[SPIKES].pixels[i] = 12;
  const chr = newCharacter();
  const walk = (seq: number, key: number, dx: number) => {
    const s = chr.sequences[seq];
    s.key = key << 8;
    for (let i = 0; i < 4; i++) s.frames[i] = { x: dx, y: 0, orient: 0, pic1: 0, pic2: 1, pause: 1, extra: new Uint8Array(5) };
  };
  walk(5, RIGHT, 4);
  walk(6, LEFT, -4);
  const cbl = newBlockSet('cbl');
  cbl[0].pixels.fill(3);
  cbl[1].pixels.fill(3);
  const game = newGame('Test');
  const scene = emptyScene(ADVTYPE);
  scene.desc = 'Level';
  scene.files = ['', 'test.map', 'test.bbl', '', '', 'test.chr', 'test.cbl', ...new Array(13).fill('')];
  scene.links[0] = { toScene: 1, from: exit, to: { x: 0, y: 0 } };
  game.scenes.push(scene);
  game.scenes[0].links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: start };
  const files = new Map<string, Uint8Array>([
    ['test.gam', serializeGame(game)],
    ['test.map', serializeMap(map)],
    ['test.bbl', serializeBlocks(bbl)],
    ['test.chr', serializeCharacter(chr)],
    ['test.cbl', serializeBlocks(cbl)],
  ]);
  return { game, files, get: (n) => files.get(n.toLowerCase()) };
}
