// THREAD THE NEEDLE, BROTHER CAMEL (The Bard of Bizarre, 1995): builds every file of the game
// into games/needle/disk/.
//   cd web && npx vite-node ../games/needle/build.ts
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
import { buildCamel, buildMonsters } from './src/characters';
import { LEVELS } from './src/levels/levels';
import { levelSongs } from './src/sound/song';
import { buildSoundSet, buildVocs } from './src/sound/sounds';
import { buildCharBlocks, buildMonsterBlocks, FORMS, type Form } from './src/sprites/sprites';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

/** The registration fee the 1995 README asks (Game-Maker's 1994 license: shareware asks at least $5). */
export const PRICE = '$5';

const base = buildPalette('plain');
const mb = buildMonsterBlocks(base);
disk.put('things.mbl', serializeBlocks(mb.blocks));
for (const form of Object.keys(FORMS) as Form[]) {
  const cb = buildCharBlocks(base, form);
  disk.put(`${form}.cbl`, serializeBlocks(cb.blocks));
  disk.put(`${form}.chr`, serializeCharacter(buildCamel(cb)));
}
for (const l of LEVELS) disk.put(`${l.snd}.snd`, serializeSoundSet(buildSoundSet(l.snd)));
for (const [name, voc] of Object.entries(buildVocs())) disk.put(`${name}.voc`, voc);

// Scenes: 0 title/menu, 1 game won/lost, then the levels in order.
const game = newGame('BROTHER CAMEL');
const built = LEVELS.map((l) => {
  const pal = buildPalette(l.light);
  const kit = l.blocks(pal);
  const level = l.build(kit.book);
  return { l, pal, kit, bbl: kit.book.finish(), ...level };
});
const songs = levelSongs();
built.forEach(({ l, m, pal, bbl }, i) => {
  const map = m.build();
  disk.put(`${l.file}.pal`, serializePalette(pal.pal));
  disk.put(`${l.file}.map`, serializeMap(map));
  disk.put(`${l.file}.bbl`, serializeBlocks(bbl));
  disk.put(`${l.file}.mon`, serializeMonsters(buildMonsters(mb, l.mons)));
  disk.put(`${l.file}.cmf`, songs[i]);
  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc;
  scene.pos = { x: 60 + i * 60, y: 110 };
  scene.files = [`${l.file}.pal`, `${l.file}.map`, `${l.file}.bbl`, `${l.file}.mon`, 'things.mbl', `${l.form}.chr`, `${l.form}.cbl`, `${l.snd}.snd`, `${l.file}.cmf`, '', '', ...new Array(9).fill('')];
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
start.files = ['', '', '', '', '', '', '', '', '', '', '', '', ...new Array(8).fill('')];
start.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: built[0].start[0], y: built[0].start[1] } };
const end = game.scenes[1];
end.files = ['', '', '', '', ...new Array(16).fill('')];
disk.put('needle.gam', serializeGame(game));
disk.write();
console.log(built.map(({ l, kit }) => `${l.file}: ${kit.book.index.size} blocks`).join(', ') + `; ${mb.index.size} monster blocks`);
