// CERTIFIED RAT TICKLER (The Bard of Bizarre, 1995): builds every file of the game into
// games/tickle/disk/.
//   cd web && npx vite-node ../games/tickle/build.ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { MAXSCENELINKS, newGame, emptyScene, serializeGame, ADVTYPE, NOSCENE } from '../../web/src/formats/game';
import { serializeMap } from '../../web/src/formats/map';
import { serializeMonsters } from '../../web/src/formats/monster';
import { serializePalette } from '../../web/src/formats/palette';
import { serializeSlideList } from '../../web/src/formats/graphicScripts';
import { serializeSoundSet } from '../../web/src/formats/sound';
import { Disk } from '../kit/disk';
import { buildPalette } from './src/art/pal';
import { buildBlocks } from './src/blocks/blocks';
import { buildLeo, buildMonsters } from './src/characters';
import { LEVELS } from './src/levels/levels';
import { allSongs } from './src/sound/song';
import { buildSoundSet, buildVocs } from './src/sound/sounds';
import { buildCharBlocks, buildMonsterBlocks, spriteRules } from './src/sprites/sprites';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

/** The registration fee the 1995 README asks (Game-Maker's 1994 license: shareware asks at least $5). */
export const PRICE = '$5';

const base = buildPalette('plain');
const book = buildBlocks(base);
const bbl = book.finish();
const mb = buildMonsterBlocks(base);
spriteRules(mb);
const cb = buildCharBlocks(base);
disk.put('tickle.bbl', serializeBlocks(bbl));
disk.put('tickle.mbl', serializeBlocks(mb.blocks));
disk.put('tickle.cbl', serializeBlocks(cb.blocks));
disk.put('leo.chr', serializeCharacter(buildLeo(cb)));
disk.put('tickle.snd', serializeSoundSet(buildSoundSet()));
for (const [name, voc] of Object.entries(buildVocs())) disk.put(`${name}.voc`, voc);
const songs = allSongs();

// Scenes: 0 title/menu, 1 game won/lost, then the levels in order.
const game = newGame('RAT TICKLER');
const built = LEVELS.map((l) => ({ l, ...l.build(book) }));
built.forEach(({ l, m }, i) => {
  const pal = buildPalette(l.light);
  const map = m.build();
  disk.put(`${l.file}.pal`, serializePalette(pal.pal));
  disk.put(`${l.file}.map`, serializeMap(map));
  disk.put(`${l.file}.mon`, serializeMonsters(buildMonsters(mb, l.mons)));
  disk.put(`${l.file}.cmf`, songs[l.song]);
  disk.put(`lvl${i + 1}.lst`, serializeSlideList([{ name: `card${i + 1}.fli`, pause: 3 }]));
  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc;
  scene.pos = { x: 60 + i * 60, y: 110 };
  scene.files = [`${l.file}.pal`, `${l.file}.map`, 'tickle.bbl', `${l.file}.mon`, 'tickle.mbl', 'leo.chr', 'tickle.cbl', 'tickle.snd', `${l.file}.cmf`, `lvl${i + 1}.lst`, '', ...new Array(9).fill('')];
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
start.files = ['title.lst', 'title.cmf', 'menu.gif', 'menu.cmf', 'story.lst', 'story.cmf', 'howto.lst', 'credits.lst', 'hiscore.gif', 'loadgame.gif', 'savegame.gif', 'demo.rec', ...new Array(8).fill('')];
start.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: built[0].start[0], y: built[0].start[1] } };
const end = game.scenes[1];
end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];
disk.put('tickle.gam', serializeGame(game));
disk.write();
console.log(`${book.index.size} background blocks, ${mb.index.size} monster blocks, ${cb.index.size} character blocks; rats ${built.map((b) => b.rats).join(' + ')}`);
