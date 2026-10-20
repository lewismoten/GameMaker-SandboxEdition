// Builds every file of Maximus: The Hundred Worlds into games/maximus/disk/.
//   cd web && npx vite-node ../games/maximus/build.ts
import { Disk } from '../kit/disk';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { serializeMap } from '../../web/src/formats/map';
import { serializePalette } from '../../web/src/formats/palette';
import { newGame, serializeGame, emptyScene, ADVTYPE, type Link } from '../../web/src/formats/game';
import { buildPalette } from './palette';
import { ROLES, themeFor } from './roles';
import { surfaceSet } from './surface';
import { surfacePlanet } from './planet';
import { courier } from './chars';

const disk = new Disk(new URL('./disk', import.meta.url).pathname);

const surf = surfaceSet();
const bbl = surf.resolve();
disk.put('surface.bbl', serializeBlocks(bbl));
const max = courier();
disk.put('courier.chr', serializeCharacter(max.chr));
disk.put('courier.cbl', serializeBlocks(max.cbl));

const p = surfacePlanet({ seed: 1, level: 1, shard: 0 }, surf);
disk.put('p01.map', serializeMap(p.grid.toMap()));
disk.put('p01.pal', serializePalette(buildPalette(ROLES, themeFor('verdant', 1)).pal));

const game = newGame('Maximus');
const s0 = game.scenes[0];
const planet = emptyScene(ADVTYPE);
planet.desc = 'Verdance';
planet.files[0] = 'p01.pal';
planet.files[1] = 'p01.map';
planet.files[2] = 'surface.bbl';
planet.files[5] = 'courier.chr';
planet.files[6] = 'courier.cbl';
const link = (to: number, from: { x: number; y: number }, at: { x: number; y: number }): Link => ({ toScene: to, from, to: at });
s0.links[0] = link(2, { x: 0, y: 0 }, p.arrive);
planet.links[0] = link(1, p.uplink, { x: 0, y: 0 });
game.scenes.push(planet);
disk.put('maximus.gam', serializeGame(game));
disk.write();
