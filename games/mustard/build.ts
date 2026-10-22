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
import { serializeSlideList } from '../../web/src/formats/graphicScripts';
import { serializeSoundSet } from '../../web/src/formats/sound';
import { BARDLOGO, bardIntroFli } from '../kit/bard';
import { Disk } from '../kit/disk';
import { licenseText } from '../kit/license';
import { Pixels } from '../kit/pixels';
import { gif } from '../snowbound/src/screens/scenery';
import { renderRegion } from '../snowbound/src/art/render';
import { buildPalette } from './src/art/pal';
import { buildBlocks } from './src/blocks/blocks';
import { buildMonsters, buildSeed, type Form } from './src/characters';
import { LEVELS } from './src/levels/levels';
import { ORIGIN } from './src/levels/maps';
import { demoRecording } from './src/demo';
import { cardFli, coverFli, howtoFli, lostFli, storyFli, wonFlis, type Cast, type CardView } from './src/screens/cartoons';
import { buildScreens } from './src/screens/screens';
import { CREDITS, INSTRUCTIONS, RECORDING_CREDIT, STORY, readme } from './src/screens/text';
import { levelSongs, lostSong, storySong, titleSong, wholeSong, wonSong } from './src/sound/song';
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
const cards: CardView[] = [];
built.forEach(({ l, m }, i) => {
  const pal = buildPalette(l.light);
  const map = m.build();
  disk.put(`${l.file}.pal`, serializePalette(pal.pal));
  disk.put(`${l.file}.map`, serializeMap(map));
  disk.put(`${l.file}.mon`, serializeMonsters(buildMonsters(mb, l.mons)));
  disk.put(`${l.file}.cmf`, songs[i]);
  disk.put(`lvl${i + 1}.lst`, serializeSlideList([{ name: `card${i + 1}.fli`, pause: 3 }]));
  const [vx, vy] = l.view;
  cards.push({ map: renderRegion(map, bbl, mb.blocks, buildMonsters(mb, l.mons), vx + ORIGIN, vy + ORIGIN, 16, 6, []), pal });
  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc;
  scene.pos = { x: 60 + i * 60, y: 110 };
  scene.files = [`${l.file}.pal`, `${l.file}.map`, 'mustard.bbl', `${l.file}.mon`, 'mustard.mbl', `${l.form}.chr`, 'mustard.cbl', `${l.snd}.snd`, `${l.file}.cmf`, `lvl${i + 1}.lst`, '', ...new Array(9).fill('')];
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
disk.put('mustard.gam', serializeGame(game));

// the pictures, cartoons and words
for (const [name, bytes] of Object.entries(buildScreens({ seed: cb.pics }))) disk.put(name, bytes);
const cast: Cast = { seed: cb.pics, mons: mb.pics };
const cover = coverFli();
disk.put(BARDLOGO, bardIntroFli());
disk.put('cover.fli', cover.fli);
disk.put('title.gif', gif(cover.title as Pixels, cover.pal));
disk.put('title.lst', serializeSlideList([{ name: BARDLOGO, pause: 0 }, { name: 'cover.fli', pause: 0 }, { name: 'title.gif', pause: 12 }]));
disk.put('story.fli', storyFli(cast));
disk.put('story.lst', serializeSlideList([{ name: 'story.fli', pause: 1 }, { name: 'storybg.gif', pause: 0 }, { name: 'story.txt' }]));
disk.put('howto.fli', howtoFli(cast));
disk.put('howto.lst', serializeSlideList([{ name: 'howto.fli', pause: 2 }, { name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]));
disk.put('credits.lst', serializeSlideList([{ name: 'bardpic.gif', pause: 8 }, { name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]));
cards.forEach((card, i) => disk.put(`card${i + 1}.fli`, cardFli(i, card, cast)));
for (const [name, bytes] of Object.entries(wonFlis(cast))) disk.put(name, bytes);
disk.put('won.lst', serializeSlideList([{ name: 'won1.fli', pause: 4 }, { name: 'won2.fli', pause: 8 }, { name: 'won3.fli', pause: 8 }]));
disk.put('lost.fli', lostFli(cast));
disk.put('lost.lst', serializeSlideList([{ name: 'lost.fli', pause: 6 }]));
disk.put('story.txt', STORY);
disk.put('howto.txt', INSTRUCTIONS);
disk.put('credits.txt', CREDITS);
disk.put('title.cmf', titleSong());
// the menu plays the whole song, all the way through
disk.put('menu.cmf', wholeSong());
disk.put('story.cmf', storySong());
disk.put('won.cmf', wonSong());
disk.put('lost.cmf', lostSong());
disk.put('demo.rec', demoRecording());
disk.put('readme.txt', readme(PRICE));
disk.put(
  'license.txt',
  licenseText(
    'Mustard Seed Hustle',
    `The Bard of Bizarre's 1995 shareware notice, its fee and its address are part of the story: there is nothing to pay. The song's words are Lewis Moten's (as The Bard of Bizarre). Recording and cover art: ${RECORDING_CREDIT}.`,
  ),
);
disk.write();
console.log(`${book.index.size} background blocks, ${mb.index.size} monster blocks, ${cb.index.size} character blocks`);
