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
import { BARDLOGO, bardIntroFli } from '../kit/bard';
import { clipEntries, fliClips } from '../kit/fliClips';
import { Disk } from '../kit/disk';
import { licenseText } from '../kit/license';
import type { Pixels } from '../kit/pixels';
import { gif } from '../snowbound/src/screens/scenery';
import { renderRegion } from '../snowbound/src/art/render';
import { buildPalette } from './src/art/pal';
import { buildBlocks } from './src/blocks/blocks';
import { buildLeo, buildMonsters } from './src/characters';
import { LEVELS } from './src/levels/levels';
import { ORIGIN } from './src/levels/maps';
import { demoRecording } from './src/demo';
import { cardFli, certFli, coverFli, howtoFli, lostFli, storyFli, wonFlis, type Cast, type CardView } from './src/screens/cartoons';
import { buildScreens } from './src/screens/screens';
import { CREDITS, INSTRUCTIONS, SONG_CREDIT, STORY, readme } from './src/screens/text';
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
  const lit = buildBlocks(pal).finish();
  cards.push({ map: renderRegion(map, lit, buildMonsterBlocks(pal).blocks, buildMonsters(mb, l.mons), vx + ORIGIN, vy + ORIGIN, 16, 6, []), pal });
  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc;
  scene.pos = { x: 60 + i * 60, y: 110 };
  scene.files = [
    `${l.file}.pal`,
    `${l.file}.map`,
    'tickle.bbl',
    `${l.file}.mon`,
    'tickle.mbl',
    'leo.chr',
    'tickle.cbl',
    'tickle.snd',
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
disk.put('tickle.gam', serializeGame(game));

// the pictures, cartoons and words
const leo = (pose: string): Pixels => {
  const p = cb.pics.get(`pose.${pose}`);
  if (!p) throw new Error(`No pose ${pose}`);
  return p;
};
for (const [name, bytes] of Object.entries(buildScreens({ leo, mons: mb.pics }))) disk.put(name, bytes);
const cast: Cast = { leo, mons: mb.pics, pal: base.pal };
const cover = coverFli(cast);
// the long cartoons in clips of about 4 seconds, so Esc can skip them between clips
const putClips = (name: string, fli: Uint8Array) => {
  const clips = fliClips(name, fli);
  for (const [n, b] of Object.entries(clips)) disk.put(n, b);
  return clips;
};
const bardLogo = putClips(BARDLOGO, bardIntroFli());
const coverClips = putClips('cover.fli', cover.fli);
disk.put('title.gif', gif(cover.title, cover.pal));
disk.put('title.lst', serializeSlideList([...clipEntries(bardLogo, 0), ...clipEntries(coverClips, 0), { name: 'title.gif', pause: 12 }]));
const story = putClips('story.fli', storyFli(cast));
const cert = putClips('cert.fli', certFli(cast));
disk.put('story.lst', serializeSlideList([...clipEntries(story, 1), ...clipEntries(cert, 3), { name: 'storybg.gif', pause: 0 }, { name: 'story.txt' }]));
const howto = putClips('howto.fli', howtoFli(cast));
disk.put('howto.lst', serializeSlideList([...clipEntries(howto, 2), { name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]));
disk.put('credits.lst', serializeSlideList([{ name: 'bardpic.gif', pause: 8 }, { name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]));
cards.forEach((card, i) => disk.put(`card${i + 1}.fli`, cardFli(i, card, cast)));
for (const [name, bytes] of Object.entries(wonFlis(cast))) disk.put(name, bytes);
disk.put(
  'won.lst',
  serializeSlideList([{ name: 'won1.fli', pause: 4 }, { name: 'won2.fli', pause: 4 }, ...clipEntries(cert, 4), { name: 'won3.fli', pause: 8 }]),
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
    'Certified Rat Tickler',
    `The Bard of Bizarre's 1995 shareware notice, its fee and its address are part of the story: there is nothing to pay. The certificate in the game is a parody made up for it. The song is The Bard of Bizarre's (Lewis Moten's): ${SONG_CREDIT}.`,
  ),
);
disk.write();
console.log(
  `${book.index.size} background blocks, ${mb.index.size} monster blocks, ${cb.index.size} character blocks; rats ${built.map((b) => b.rats).join(' + ')}`,
);
