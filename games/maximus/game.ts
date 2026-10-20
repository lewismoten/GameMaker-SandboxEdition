// Assembles the hundred scenes of Maximus: block sets, monster files, characters, every
// map and palette, and the .GAM scene graph that links them.
import { serializeBlocks, type Block } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { serializeMap } from '../../web/src/formats/map';
import { serializeMonsters } from '../../web/src/formats/monster';
import { serializePalette } from '../../web/src/formats/palette';
import { ADVTYPE, NOSCENE, emptyScene, newGame, serializeGame, type Game, type Link, type Scene } from '../../web/src/formats/game';
import { monsterSet, type MonsterSet } from './bestiary';
import type { SetBuilder } from './blockset';
import { courier, vehicle, type CharSet } from './chars';
import { heartMap, maelstromMap } from './core';
import { harder, landFauna, mechFauna, seaFauna, spaceFauna } from './fauna';
import { Grid, W, reachable } from './mapkit';
import { oceanSet } from './ocean';
import { buildPalette } from './palette';
import { checkPlanet, surfacePlanet, type PlanetResult } from './planet';
import { populate, type Spots } from './populate';
import { ROLES, themeFor, type Biome } from './roles';
import { oceanPlanet } from './seaplanet';
import { spaceSet } from './space';
import { galaxyMap, sectorMap } from './spacemaps';
import { stationSet } from './station';
import { stationPlanet } from './stationmap';
import { surfaceSet } from './surface';
import { SCENE, SECTORS, allWorlds, type WorldKind } from './universe';

export interface SceneInfo {
  scene: number;
  name: string;
  file: string;
  kind: WorldKind | 'space' | 'core' | 'home' | 'boss';
  biome: Biome;
  monsters: number;
  sector?: number;
  shard?: number;
  module?: number;
  arrive: { x: number; y: number };
  map: Grid;
  bbl: string;
  chr: string;
  palette: Uint8Array;
}

export interface Built {
  files: Map<string, Uint8Array>;
  game: Game;
  scenes: SceneInfo[];
  sets: Record<string, SetBuilder>;
  monsters: Record<string, MonsterSet>;
  chars: Record<string, CharSet>;
  problems: string[];
}

const link = (toScene: number, from: { x: number; y: number }, to: { x: number; y: number }): Link => ({ toScene, from: { ...from }, to: { ...to } });

export function buildGame(): Built {
  const files = new Map<string, Uint8Array>();
  const problems: string[] = [];
  const put = (name: string, bytes: Uint8Array) => files.set(name.toLowerCase(), bytes);

  // ---------------------------------------------------------------- block sets
  const sets = { surface: surfaceSet(), ocean: oceanSet(), station: stationSet(), space: spaceSet() };

  // ---------------------------------------------------------------- monsters (two editions per family)
  const fam = {
    land: [landFauna(), harder(landFauna())],
    sea: [seaFauna(), harder(seaFauna())],
    space: [spaceFauna(), harder(spaceFauna())],
    mech: [mechFauna(), harder(mechFauna())],
  } as const;
  const monsters: Record<string, MonsterSet> = {};
  for (const [name, [easy, hard]] of Object.entries(fam)) {
    const a = monsterSet(`${name}1`, easy);
    const b = monsterSet(`${name}2`, hard);
    monsters[`${name}1`] = a;
    monsters[`${name}2`] = b;
    put(`${name}.mbl`, serializeBlocks(a.mbl));
    put(`${name}1.mon`, serializeMonsters(a.mon));
    put(`${name}2.mon`, serializeMonsters(b.mon));
  }
  // nests give birth to their family's young
  const nests: [SetBuilder, MonsterSet, string[], number[]][] = [
    [sets.surface, monsters.land1, ['Digger', 'Hive Bee', 'Hatchling', 'Vent Shot'], [110, 150, 130, 70]],
    [sets.ocean, monsters.sea1, ['Clam Spit', 'Polyp', 'Hatchling', 'Vent Spark'], [80, 90, 140, 70]],
    [sets.station, monsters.mech1, ['Turret Shot', 'Nanite Swarm', 'Bot Hatchling', 'Turret Shot'], [60, 150, 130, 45]],
  ];
  for (const [s, ms, names, times] of nests)
    names.forEach((n, k) => {
      const b = s.blocks[s.id(`nest:${k}`)];
      b.birthMon = ms.index.get(n)!;
      b.birthTime = times[k];
    });
  const bbl: Record<string, Block[]> = {};
  for (const [name, s] of Object.entries(sets)) {
    bbl[name] = s.resolve();
    put(`${name}.bbl`, serializeBlocks(bbl[name]));
  }

  // ---------------------------------------------------------------- characters
  const chars: Record<string, CharSet> = { courier: courier(), pod: vehicle('pod'), diver: vehicle('diver'), rover: vehicle('rover') };
  for (const [name, c] of Object.entries(chars)) {
    put(`${name}.chr`, serializeCharacter(c.chr));
    put(`${name}.cbl`, serializeBlocks(c.cbl));
  }

  // ---------------------------------------------------------------- scenes
  const game = newGame('Maximus');
  game.scenes[0].desc = 'Maximus';
  game.scenes[1].desc = 'The Hundred Worlds';
  const scenes: SceneInfo[] = [];
  const sceneAt = (n: number): Scene => {
    while (game.scenes.length <= n) game.scenes.push(emptyScene(ADVTYPE));
    return game.scenes[n];
  };
  const setup = (n: number, desc: string, f: { pal: string; map: string; bbl: string; mon?: string; mbl?: string; chr: string }) => {
    const sc = sceneAt(n);
    sc.gametype = ADVTYPE;
    sc.desc = desc.slice(0, 19);
    sc.files[0] = f.pal;
    sc.files[1] = f.map;
    sc.files[2] = f.bbl;
    sc.files[3] = f.mon ?? '';
    sc.files[4] = f.mbl ?? '';
    sc.files[5] = `${f.chr}.chr`;
    sc.files[6] = `${f.chr}.cbl`;
    sc.files[7] = 'maximus.snd';
    sc.links = Array.from({ length: 20 }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    return sc;
  };
  const record = (info: Omit<SceneInfo, 'monsters'>) => {
    put(info.file + '.map', serializeMap(info.map.toMap()));
    put(info.file + '.pal', serializePalette(info.palette));
    scenes.push({ ...info, monsters: info.map.monsters.length });
  };
  const famOf = (kind: WorldKind) => (kind === 'ocean' ? 'sea' : kind === 'station' ? 'mech' : 'land');
  const setOf = (kind: WorldKind) => (kind === 'ocean' ? 'ocean' : kind === 'station' ? 'station' : 'surface');
  const chrOf = (kind: WorldKind) => (kind === 'ocean' ? 'diver' : kind === 'rover' ? 'rover' : kind === 'surface' ? 'courier' : 'courier');

  // home: the training deck of Maxima Station
  const home = stationPlanet({ seed: 1995, level: 1 }, sets.station, { home: true });
  populate(home.grid, bbl.station, monsters.mech1, spotsOf(home), { seed: 1, level: 1, count: 40, species: 2 });
  // galaxy
  const galaxy = galaxyMap(sets.space);
  populate(galaxy.grid, bbl.space, monsters.space1, spaceSpots(galaxy.grid, bbl.space, galaxy.arriveHome), { seed: 2, level: 1, count: 70, species: 4 });
  // sectors
  const worlds = allWorlds();
  const sectorMaps = SECTORS.map((sec, k) => {
    const list = worlds.filter((w) => w.sector === k);
    const designs = list.map((w) => designFor(w.world.kind, w.world.biome, w.index));
    const shards = list.map((w, i) => (w.world.shard !== undefined ? i : -1)).filter((i) => i >= 0);
    const m = sectorMap(sets.space, 1000 + k * 77, list.length, designs, shards);
    populate(m.grid, bbl.space, sec.level <= 2 ? monsters.space1 : monsters.space2, spaceSpots(m.grid, bbl.space, m.arrive), {
      seed: 30 + k,
      level: sec.level,
      count: 90 + sec.level * 20,
      species: 5,
    });
    return m;
  });

  // home scene
  {
    const sc = setup(SCENE.home, 'Maxima Station', { pal: 'home.pal', map: 'home.map', bbl: 'station.bbl', mon: 'mech1.mon', mbl: 'mech.mbl', chr: 'courier' });
    sc.links[0] = link(SCENE.galaxy, home.uplink, galaxy.arriveHome);
    sc.pos = { x: 30, y: 60 };
    record({
      scene: SCENE.home,
      name: 'Maxima Station',
      file: 'home',
      kind: 'home',
      biome: 'station',
      arrive: home.arrive,
      map: home.grid,
      bbl: 'station',
      chr: 'courier',
      palette: buildPalette(ROLES, themeFor('station', 1995)).pal,
    });
    game.scenes[0].links[0] = link(SCENE.home, { x: 0, y: 0 }, home.arrive);
  }
  // galaxy scene
  const maelstrom = maelstromMap(sets.space, monsters.space2);
  {
    const sc = setup(SCENE.galaxy, 'The Galaxy', { pal: 'galaxy.pal', map: 'galaxy.map', bbl: 'space.bbl', mon: 'space1.mon', mbl: 'space.mbl', chr: 'pod' });
    sc.links[0] = link(SCENE.home, galaxy.dock, home.arrive);
    galaxy.sectors.forEach((s, k) => (sc.links[1 + k] = link(SCENE.sector(k), s.warp, sectorMaps[k].arrive)));
    sc.links[6] = link(SCENE.maelstrom, { x: galaxy.core.x + 1, y: galaxy.core.y + 1 }, maelstrom.arrive);
    sc.pos = { x: 157, y: 60 };
    record({
      scene: SCENE.galaxy,
      name: 'The Galaxy',
      file: 'galaxy',
      kind: 'space',
      biome: 'space',
      arrive: galaxy.arriveHome,
      map: galaxy.grid,
      bbl: 'space',
      chr: 'pod',
      palette: buildPalette(ROLES, themeFor('space', 7)).pal,
    });
  }
  // sector scenes and their worlds
  SECTORS.forEach((sec, k) => {
    const m = sectorMaps[k];
    const n = SCENE.sector(k);
    const sc = setup(n, sec.name, {
      pal: `sector${k + 1}.pal`,
      map: `sector${k + 1}.map`,
      bbl: 'space.bbl',
      mon: sec.level <= 2 ? 'space1.mon' : 'space2.mon',
      mbl: 'space.mbl',
      chr: 'pod',
    });
    sc.links[0] = link(SCENE.galaxy, m.warp, galaxy.sectors[k].arrive);
    sc.pos = { x: 30 + k * 62, y: 90 };
    record({
      scene: n,
      name: sec.name,
      file: `sector${k + 1}`,
      kind: 'space',
      biome: 'space',
      sector: k,
      arrive: m.arrive,
      map: m.grid,
      bbl: 'space',
      chr: 'pod',
      palette: buildPalette(ROLES, themeFor('space', 100 + k * 13)).pal,
    });
    worlds
      .filter((w) => w.sector === k)
      .forEach((w, i) => {
        const { world } = w;
        const spec = {
          seed: w.scene * 101 + 7,
          level: sec.level,
          shard: world.shard,
          module: world.module,
          features: world.kind === 'rover' ? { rover: true } : undefined,
        };
        let p: PlanetResult;
        if (world.kind === 'ocean') p = oceanPlanet(spec, sets.ocean);
        else if (world.kind === 'station') p = stationPlanet(spec, sets.station);
        else p = surfacePlanet(spec, sets.surface);
        const setName = setOf(world.kind);
        const s = sets[setName];
        const passable = (b: number) =>
          ['door', 'field:on', 'field:off', 'field:on2', 'laser:v', 'laser:v0', 'laser:h', 'laser:h0', 'glass', 'plat:off'].some(
            (nm) => s.has(nm) && s.id(nm) === b,
          );
        const bad = checkPlanet(p, bbl[setName], passable, world.kind === 'surface' || world.kind === 'station');
        if (bad.length) problems.push(`${world.name}: ${bad.join(', ')}`);
        const famName = famOf(world.kind);
        const ms = monsters[`${famName}${sec.level <= 2 ? 1 : 2}`];
        populate(p.grid, bbl[setName], ms, spotsOf(p), {
          seed: w.scene,
          level: sec.level,
          count: Math.min(190, 70 + sec.level * 24 + (world.shard !== undefined ? 20 : 0)),
          species: 2 + Math.min(3, sec.level),
        });
        const file = `w${w.scene}`;
        const wsc = setup(w.scene, world.name, {
          pal: `${file}.pal`,
          map: `${file}.map`,
          bbl: `${setName}.bbl`,
          mon: `${famName}${sec.level <= 2 ? 1 : 2}.mon`,
          mbl: `${famName}.mbl`,
          chr: chrOf(world.kind),
        });
        wsc.links[0] = link(n, p.uplink, m.planets[i].back);
        wsc.pos = { x: 18 + k * 62 + (i % 3) * 14, y: 106 + Math.floor(i / 3) * 12 };
        sc.links[1 + i] = link(w.scene, m.planets[i].at, p.arrive);
        record({
          scene: w.scene,
          name: world.name,
          file,
          kind: world.kind,
          biome: world.biome,
          sector: k,
          shard: world.shard,
          module: world.module,
          arrive: p.arrive,
          map: p.grid,
          bbl: setName,
          chr: chrOf(world.kind),
          palette: buildPalette(ROLES, themeFor(world.biome, w.scene)).pal,
        });
      });
  });
  // the Core: maelstrom, citadel, heart
  const citadel = stationPlanet({ seed: 7777, level: 5 }, sets.station);
  populate(citadel.grid, bbl.station, monsters.mech2, spotsOf(citadel), { seed: 77, level: 5, count: 190, species: 6 });
  // the citadel's vault holds the way to the Heart instead of a prize
  citadel.grid.set(citadel.vault!.x, citadel.vault!.y, sets.station.id('teleport'), true);
  const heart = heartMap(sets.station, monsters.mech2);
  {
    const sc = setup(SCENE.maelstrom, 'The Maelstrom', { pal: 'mael.pal', map: 'mael.map', bbl: 'space.bbl', mon: 'space2.mon', mbl: 'space.mbl', chr: 'pod' });
    sc.links[0] = link(SCENE.galaxy, maelstrom.exitWarp, galaxy.coreArrive);
    sc.links[1] = link(SCENE.citadel, maelstrom.citadel, citadel.arrive);
    sc.pos = { x: 250, y: 60 };
    record({
      scene: SCENE.maelstrom,
      name: 'The Maelstrom',
      file: 'mael',
      kind: 'core',
      biome: 'core',
      arrive: maelstrom.arrive,
      map: maelstrom.grid,
      bbl: 'space',
      chr: 'pod',
      palette: buildPalette(ROLES, themeFor('core', 1)).pal,
    });
  }
  {
    const sc = setup(SCENE.citadel, 'The Citadel', {
      pal: 'citadel.pal',
      map: 'citadel.map',
      bbl: 'station.bbl',
      mon: 'mech2.mon',
      mbl: 'mech.mbl',
      chr: 'courier',
    });
    sc.links[0] = link(SCENE.maelstrom, citadel.uplink, maelstrom.citadelArrive);
    sc.links[1] = link(SCENE.heart, citadel.vault!, heart.arrive);
    sc.pos = { x: 275, y: 60 };
    record({
      scene: SCENE.citadel,
      name: 'The Citadel',
      file: 'citadel',
      kind: 'core',
      biome: 'station',
      arrive: citadel.arrive,
      map: citadel.grid,
      bbl: 'station',
      chr: 'courier',
      palette: buildPalette(ROLES, themeFor('station', 666)).pal,
    });
  }
  {
    const sc = setup(SCENE.heart, 'Heart of Maximus', {
      pal: 'heart.pal',
      map: 'heart.map',
      bbl: 'station.bbl',
      mon: 'mech2.mon',
      mbl: 'mech.mbl',
      chr: 'courier',
    });
    sc.links[0] = link(SCENE.end, heart.exit, { x: 0, y: 0 });
    sc.links[1] = link(SCENE.citadel, heart.back, citadel.arrive);
    sc.pos = { x: 300, y: 60 };
    record({
      scene: SCENE.heart,
      name: 'Heart of Maximus',
      file: 'heart',
      kind: 'boss',
      biome: 'core',
      arrive: heart.arrive,
      map: heart.grid,
      bbl: 'station',
      chr: 'courier',
      palette: buildPalette(ROLES, themeFor('core', 9)).pal,
    });
  }
  if (game.scenes.length !== 100) problems.push(`${game.scenes.length} scenes`);
  put('maximus.gam', serializeGame(game));
  return { files, game, scenes, sets, monsters, chars, problems };
}

/** Which planet picture a world gets on the sector chart. */
function designFor(kind: WorldKind, biome: Biome, i: number): number {
  if (kind === 'ocean') return 2;
  if (kind === 'station') return 8;
  const by: Partial<Record<Biome, number>> = { verdant: 0, autumn: 0, jungle: 7, desert: 1, ash: 4, lava: 6, ice: 2, crystal: 5, toxic: 3, fungal: 7 };
  return by[biome] ?? i % 9;
}

function spotsOf(p: PlanetResult): Spots {
  return {
    ground: p.ground,
    cave: p.caveFloor,
    air: p.sky,
    caveAir: p.caveAir,
    sky: p.sky,
    ceiling: p.ceilings,
    liquid: [],
    vault: p.vault,
    avoid: p.arrive,
  };
}

function spaceSpots(g: Grid, bbl: Block[], avoid: { x: number; y: number }): Spots {
  const seen = reachable(g, bbl, avoid.x, avoid.y, { tall: false });
  const air: { x: number; y: number }[] = [];
  for (let i = 0; i < seen.length; i += 7) if (seen[i]) air.push({ x: i % W, y: Math.floor(i / W) });
  return { ground: [], cave: [], air, caveAir: air, sky: air, ceiling: [], liquid: [], avoid };
}
