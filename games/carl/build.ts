// CARL: A FLY NAMED CARL (The Bard of Bizarre, 1995): builds every file of the game into
// games/carl/disk/.
//   cd web && npx vite-node ../games/carl/build.ts
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
import { buildHouse } from './src/blocks/house';
import { buildYard } from './src/blocks/yard';
import { buildCarl, buildMonsters } from './src/characters';
import { LEVELS } from './src/levels/levels';
import { ORIGIN } from './src/levels/maps';
import { demoRecording } from './src/demo';
import { cardFli, coverFli, howtoFli, lostFli, storyFli, wonFlis, type Cast, type CardView } from './src/screens/cartoons';
import { buildScreens } from './src/screens/screens';
import { CREDITS, INSTRUCTIONS, SONG_CREDIT, STORY, readme } from './src/screens/text';
import { allSongs } from './src/sound/song';
import { buildSoundSet, buildVocs, type Place } from './src/sound/sounds';
import { buildCharBlocks, buildMonsterBlocks } from './src/sprites/sprites';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

/** The registration fee the 1995 README asks (Game-Maker's 1994 license: shareware asks at least $5). */
export const PRICE = '$5';

const base = buildPalette('plain');
const SETS = { house: buildHouse, yard: buildYard };
const books = { house: buildHouse(base), yard: buildYard(base) };
for (const [name, book] of Object.entries(books)) disk.put(`${name}.bbl`, serializeBlocks(book.finish()));
const mb = buildMonsterBlocks(base);
const cb = buildCharBlocks(base);
disk.put('carl.mbl', serializeBlocks(mb.blocks));
disk.put('carl.cbl', serializeBlocks(cb.blocks));
disk.put('carl.chr', serializeCharacter(buildCarl(cb)));
for (const place of ['house', 'kitchen', 'bed', 'yard', 'wild', 'aux'] as Place[]) disk.put(`${place}.snd`, serializeSoundSet(buildSoundSet(place)));
for (const [name, voc] of Object.entries(buildVocs())) disk.put(`${name}.voc`, voc);
const songs = allSongs();

// Scenes: 0 title/menu, 1 game won/lost, then the levels in order.
const game = newGame('CARL');
const built = LEVELS.map((l) => ({ l, ...l.build(books[l.set]) }));
const cards: CardView[] = [];
built.forEach(({ l, m }, i) => {
  const pal = buildPalette(l.light);
  const map = m.build();
  disk.put(`${l.file}.pal`, serializePalette(pal.pal));
  disk.put(`${l.file}.map`, serializeMap(map));
  disk.put(`${l.file}.mon`, serializeMonsters(buildMonsters(mb, l.mons)));
  disk.put(`${l.file}.cmf`, songs[l.song]);
  disk.put(`lvl${i + 1}.lst`, serializeSlideList([{ name: `card${i + 1}.fli`, pause: 3 }]));
  const [vx, vy] = l.view;
  const lit = SETS[l.set](pal).finish();
  cards.push({ map: renderRegion(map, lit, buildMonsterBlocks(pal).blocks, buildMonsters(mb, l.mons), vx + ORIGIN, vy + ORIGIN, 16, 6, []), pal });
  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc;
  scene.pos = { x: 60 + i * 60, y: 110 };
  scene.files = [
    `${l.file}.pal`,
    `${l.file}.map`,
    `${l.set}.bbl`,
    `${l.file}.mon`,
    'carl.mbl',
    'carl.chr',
    'carl.cbl',
    `${l.snd}.snd`,
    `${l.file}.cmf`,
    `lvl${i + 1}.lst`,
    '',
    ...new Array(9).fill(''),
  ];
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
start.files = [
  'title.lst',
  'title.cmf',
  'menu.gif',
  'menu.cmf',
  'story.lst',
  'story.cmf',
  'howto.lst',
  'credits.lst',
  'hiscore.gif',
  'loadgame.gif',
  'savegame.gif',
  'demo.rec',
  ...new Array(8).fill(''),
];
start.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: built[0].start[0], y: built[0].start[1] } };
const end = game.scenes[1];
end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];
disk.put('carl.gam', serializeGame(game));

// the pictures, cartoons and words
for (const [name, bytes] of Object.entries(buildScreens({ carl: cb.pics }))) disk.put(name, bytes);
const house = books.house.blocks;
const cast: Cast = {
  carl: cb.pics,
  mons: mb.pics,
  block: (name) => {
    const p = new Pixels(20, 20);
    p.px.set(house[books.house.n(name)].pixels);
    return p;
  },
};
const cover = coverFli();
disk.put(BARDLOGO, bardIntroFli());
disk.put('cover.fli', cover.fli);
disk.put('title.gif', gif(cover.title as Pixels, cover.pal));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: BARDLOGO, pause: 0 },
    { name: 'cover.fli', pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('story.fli', storyFli(cast));
disk.put('story.lst', serializeSlideList([{ name: 'story.fli', pause: 1 }, { name: 'storybg.gif', pause: 0 }, { name: 'story.txt' }]));
disk.put('howto.fli', howtoFli(cast));
disk.put('howto.lst', serializeSlideList([{ name: 'howto.fli', pause: 2 }, { name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]));
disk.put('credits.lst', serializeSlideList([{ name: 'bardpic.gif', pause: 8 }, { name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]));
cards.forEach((card, i) => disk.put(`card${i + 1}.fli`, cardFli(i, card, cast)));
for (const [name, bytes] of Object.entries(wonFlis(cast))) disk.put(name, bytes);
disk.put(
  'won.lst',
  serializeSlideList([
    { name: 'won1.fli', pause: 4 },
    { name: 'won2.fli', pause: 6 },
    { name: 'won3.fli', pause: 8 },
  ]),
);
disk.put('lost.fli', lostFli(cast));
disk.put('lost.lst', serializeSlideList([{ name: 'lost.fli', pause: 6 }]));
disk.put('story.txt', STORY);
disk.put('howto.txt', INSTRUCTIONS);
disk.put('credits.txt', CREDITS);
disk.put('title.cmf', songs.title);
// the menu plays the whole song, all the way through
disk.put('menu.cmf', songs.menu);
disk.put('story.cmf', songs.story);
disk.put('won.cmf', songs.won);
disk.put('lost.cmf', songs.lost);
disk.put('demo.rec', demoRecording());
disk.put('readme.txt', readme(PRICE));
disk.put(
  'license.txt',
  licenseText(
    'A Fly Named Carl',
    `The Bard of Bizarre's 1995 shareware notice, its fee and its address are part of the story: there is nothing to pay. The song is The Bard of Bizarre's (Lewis Moten's): ${SONG_CREDIT}.`,
  ),
);
disk.write();
console.log(
  `house ${books.house.index.size}, yard ${books.yard.index.size} background blocks, ${mb.index.size} monster blocks, ${cb.index.size} character blocks`,
);
