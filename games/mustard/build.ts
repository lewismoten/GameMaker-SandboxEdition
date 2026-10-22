// MUSTARD SEED HUSTLE (The Bard of Bizarre, 1995): builds every file of the game into
// games/mustard/disk/.
//   cd web && npx vite-node ../games/mustard/build.ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { MAXSCENELINKS, newGame, emptyScene, serializeGame, ADVTYPE, NOSCENE } from '../../web/src/formats/game';
import { serializeMap } from '../../web/src/formats/map';
import { serializeMonsters } from '../../web/src/formats/monster';
import { serializePalette } from '../../web/src/formats/palette';
import { serializeSoundSet } from '../../web/src/formats/sound';
import { Disk } from '../kit/disk';
import { buildPalette } from './src/art/pal';
import { buildBlocks } from './src/blocks/blocks';
import { buildMonsters, buildSeed, type Form } from './src/characters';
import { LEVELS } from './src/levels/levels';
import { levelSongs } from './src/sound/song';
import { buildSoundSet, buildVocs, type Place } from './src/sound/sounds';
import { buildCharBlocks, buildMonsterBlocks } from './src/sprites/sprites';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

/** The registration fee the 1995 README asks (Game-Maker's 1994 license: shareware asks at least $5). */
export const PRICE = '$5';

const base = buildPalette('plain');
const book = buildBlocks(base);
const bbl = book.finish();
const mb = buildMonsterBlocks(base);
const cb = buildCharBlocks(base);
disk.put('mustard.bbl', serializeBlocks(bbl));
disk.put('mustard.mbl', serializeBlocks(mb.blocks));
disk.put('mustard.cbl', serializeBlocks(cb.blocks));
for (const form of ['seed', 'sprout', 'plant'] as Form[]) disk.put(`${form}.chr`, serializeCharacter(buildSeed(cb, form)));
for (const place of ['garden', 'dust', 'mountain', 'sky'] as Place[]) disk.put(`${place}.snd`, serializeSoundSet(buildSoundSet(place)));
for (const [name, voc] of Object.entries(buildVocs())) disk.put(`${name}.voc`, voc);

// Scenes: 0 title/menu, 1 game won/lost, then the levels in order.
const game = newGame('MUSTARD SEED');
const built = LEVELS.map((l) => ({ l, ...l.build(book) }));
const songs = levelSongs();
built.forEach(({ l, m }, i) => {
  const pal = buildPalette(l.light);
  const map = m.build();
  disk.put(`${l.file}.pal`, serializePalette(pal.pal));
  disk.put(`${l.file}.map`, serializeMap(map));
  disk.put(`${l.file}.mon`, serializeMonsters(buildMonsters(mb, l.mons)));
  disk.put(`${l.file}.cmf`, songs[i]);
  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc;
  scene.pos = { x: 60 + i * 60, y: 110 };
  scene.files = [`${l.file}.pal`, `${l.file}.map`, 'mustard.bbl', `${l.file}.mon`, 'mustard.mbl', `${l.form}.chr`, 'mustard.cbl', `${l.snd}.snd`, `${l.file}.cmf`, '', '', ...new Array(9).fill('')];
  if (m.links.length > MAXSCENELINKS) throw new Error(`${l.file}: too many links`);
  scene.links = Array.from({ length: MAXSCENELINKS }, (_, k) => {
    const spec = m.links[k];
    if (!spec) return { toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    const from = { x: spec.from[0], y: spec.from[1] };
    const next = built[i + 1];
    if (spec.toScene === 'won' || !next) return { toScene: 1, from, to: { x: 0, y: 0 } };
    return { toScene: i + 3, from, to: { x: next.start[0], y: next.start[1] } };
  });
  game.scenes.push(scene);
});

const start = game.scenes[0];
start.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: built[0].start[0], y: built[0].start[1] } };
disk.put('mustard.gam', serializeGame(game));
disk.write();
console.log(`${book.index.size} background blocks, ${mb.index.size} monster blocks, ${cb.index.size} character blocks`);
