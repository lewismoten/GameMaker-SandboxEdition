// New games that are ready to play: a title scene linked to a first level that has a
// palette, blocks, monsters, a hero and sounds (borrowed from the CD library's SAMPLE),
// on a fresh map with open ground inside a wall, so nothing starts out black and empty.
import { Project } from '../core/project';
import { libraryGame } from '../core/library';
import { loadCatalog } from '../../project/files';
import { ADVTYPE, NOSCENE, emptyScene, newGame, serializeGame } from '../../formats/game';
import { beginFirstSteps } from './firstSteps';
import { closeGaps } from '../editors/integrator/integratorLayout';
import { BACKBL, parseBlocks } from '../../formats/blocks';
import { parseSoundSet } from '../../formats/sound';
import { MLEN, MWID, newMap, parseMap, reindexMonsters, serializeMap } from '../../formats/map';

const KINDS = ['pal', 'map', 'bbl', 'mon', 'mbl', 'chr', 'cbl', 'snd'] as const;

/** A game with a playable first level, made from the library game `from` (default SAMPLE). */
export async function starterProject(title: string, from = 'sample'): Promise<Project> {
  const p = Project.create(title);
  const g = (await loadCatalog()).find((c) => c.id === from);
  if (!g) return p;
  const lib = await libraryGame(g);
  const libGame = Project.fromFiles(lib, g.title, `lib-${g.id}`).game();
  const level = libGame.scenes.find((s) => s.gametype === ADVTYPE && KINDS.every((_, i) => i === 1 || lib.has(s.files[i])));
  if (!level) return p;
  const stem = p.gam.replace(/\.gam$/, '');
  const names = KINDS.map((k) => `${stem}.${k}`);
  // Everything but the map is copied; the map is made fresh from the level's own blocks.
  KINDS.forEach((k, i) => {
    if (k !== 'map') p.files.set(names[i], lib.get(level.files[i])!.slice());
  });
  // and the Sound Blaster samples its sound set plays
  for (const v of parseSoundSet(lib.get(level.files[7])!).digital) {
    const voc = `${v.trim().toLowerCase()}.voc`;
    if (v.trim() && lib.has(voc)) p.files.set(voc, lib.get(voc)!.slice());
  }
  const blocks = parseBlocks(lib.get(level.files[2])!, BACKBL);
  const usedBlocks = lib.has(level.files[1]) ? parseMap(lib.get(level.files[1])!).blocks : new Uint8Array(0);
  const count = new Map<number, number>();
  for (const b of usedBlocks) count.set(b, (count.get(b) ?? 0) + 1);
  const byUse = [...count.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b);
  const floor = byUse.find((b) => !blocks[b]?.solid && !blocks[b]?.grav && !blocks[b]?.obj) ?? 0;
  const wall = byUse.find((b) => blocks[b]?.solid === 15) ?? blocks.findIndex((b) => b.solid === 15);
  const map = newMap();
  const W = 30;
  const H = 20;
  const x0 = 35;
  const y0 = 40;
  for (let y = 0; y < MWID; y++)
    for (let x = 0; x < MLEN; x++) {
      const inside = x >= x0 && x < x0 + W && y >= y0 && y < y0 + H;
      const edge = inside && (x === x0 || y === y0 || x === x0 + W - 1 || y === y0 + H - 1);
      map.blocks[y * MLEN + x] = edge && wall >= 0 ? wall : floor;
    }
  // A few of the level's own monsters to meet: the ones it uses most, away from the start.
  const libMap = lib.has(level.files[1]) ? parseMap(lib.get(level.files[1])!) : undefined;
  const monUse = new Map<number, number>();
  for (const m of libMap?.monsters ?? []) if (m.monnum < 64) monUse.set(m.monnum, (monUse.get(m.monnum) ?? 0) + 1);
  const favorites = [...monUse.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([n]) => n)
    .slice(0, 3);
  const spots = [
    [x0 + 4, y0 + 4],
    [x0 + W - 5, y0 + 5],
    [x0 + 6, y0 + H - 5],
    [x0 + W - 6, y0 + H - 4],
  ];
  spots.forEach(([x, y], i) => {
    if (!favorites.length) return;
    Object.assign(map.monsters[i], { monnum: favorites[i % favorites.length], curx: x, cury: y });
  });
  reindexMonsters(map);
  p.files.set(names[1], serializeMap(map));

  const game = newGame(title);
  const scene = emptyScene(ADVTYPE);
  scene.desc = 'Level 1';
  scene.pos = { x: 157, y: 110 };
  scene.files = [...names, '', '', '', '', '', '', '', '', '', '', '', ''].slice(0, scene.files.length);
  // The level starts in the middle of the walled area.
  game.scenes.push(scene);
  game.scenes[0].links[0] = { toScene: game.scenes.length - 1, from: { x: 0, y: 0 }, to: { x: x0 + W / 2, y: y0 + H / 2 } };
  // Scene 1 is "game won": nothing links there yet.
  if (game.scenes[1].links[0]) game.scenes[1].links[0].toScene = NOSCENE;
  // the scenes snug together, so the scene board opens at a readable size
  for (const [i, pos] of closeGaps(game)) game.scenes[i].pos = pos;
  p.files.set(p.gam, serializeGame(game));
  // the First steps checklist ticks as these files change
  beginFirstSteps(p);
  return p;
}
