// VENI, VIDI, RISI! (Veni, Vidi, Risi!, 1995): builds every file of the game into games/risi/disk/.
//   cd web && npx vite-node ../games/risi/build.ts
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
import { clipEntries, clipEveryList, fliClips } from '../kit/fliClips';
import { Disk } from '../kit/disk';
import { licenseText } from '../kit/license';
import { gif } from '../snowbound/src/screens/scenery';
import { renderRegion } from '../snowbound/src/art/render';
import { buildPalette } from './src/art/pal';
import { buildBlocks, SETS } from './src/blocks/blocks';
import { buildHero, buildMonsters } from './src/characters';
import { LEVELS } from './src/levels/levels';
import { ORIGIN } from './src/levels/maps';
import { demoRecording } from './src/demo';
import { cardFli, coverFli, howtoFli, lostFli, storyFli, wonFlis, type Cast, type CardView } from './src/screens/cartoons';
import { buildScreens } from './src/screens/screens';
import { ART_CREDIT, CREDITS, INSTRUCTIONS, SONG_CREDIT, STORY, readme } from './src/screens/text';
import { allSongs, songFile } from './src/sound/song';
import { buildSoundSet, buildVocs } from './src/sound/sounds';
import { buildFelixBlocks, buildMarcusBlocks, buildMonsterBlocks } from './src/sprites/sprites';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

/** The registration fee the 1995 README asks (Game-Maker's 1994 license: shareware asks at least $5). */
const PRICE = '$5';

const base = buildPalette('plain');
const books = Object.fromEntries(SETS.map((s) => [s, buildBlocks(s, base)])) as Record<(typeof SETS)[number], ReturnType<typeof buildBlocks>>;
for (const s of SETS) disk.put(`${s}.bbl`, serializeBlocks(books[s].finish()));
const mb = buildMonsterBlocks(base);
const heroes = { marcus: buildMarcusBlocks(base), felix: buildFelixBlocks(base) };
disk.put('risi.mbl', serializeBlocks(mb.blocks));
for (const [who, cb] of Object.entries(heroes)) {
  disk.put(`${who}.cbl`, serializeBlocks(cb.blocks));
  disk.put(`${who}.chr`, serializeCharacter(buildHero(cb, who as keyof typeof heroes)));
}
for (const l of LEVELS) disk.put(`${l.snd}.snd`, serializeSoundSet(buildSoundSet(l.snd)));
for (const [name, voc] of Object.entries(buildVocs())) disk.put(`${name}.voc`, voc);
const songs = allSongs();

// Scenes: 0 title/menu, 1 game won/lost, then the levels in order.
const game = newGame('RISI');
const built = LEVELS.map((l) => ({ l, ...l.build(books[l.set]) }));
const cards: CardView[] = [];
built.forEach(({ l, m }, i) => {
  const pal = buildPalette(l.light);
  const map = m.build();
  const song = songFile(l.song);
  disk.put(`${l.file}.pal`, serializePalette(pal.pal));
  disk.put(`${l.file}.map`, serializeMap(map));
  disk.put(`${l.file}.mon`, serializeMonsters(buildMonsters(mb, l.mons)));
  disk.put(`${song}.cmf`, songs[song]);
  disk.put(`act${i + 1}.lst`, serializeSlideList([{ name: `card${i + 1}.fli`, pause: 3 }]));
  const [vx, vy] = l.view;
  const lit = buildBlocks(l.set, pal).finish();
  cards.push({ map: renderRegion(map, lit, buildMonsterBlocks(pal).blocks, buildMonsters(mb, l.mons), vx + ORIGIN, vy + ORIGIN, 16, 6, []), pal });
  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc;
  scene.pos = { x: 40 + i * 44, y: 110 };
  scene.files = [
    `${l.file}.pal`,
    `${l.file}.map`,
    `${l.set}.bbl`,
    `${l.file}.mon`,
    'risi.mbl',
    `${l.who}.chr`,
    `${l.who}.cbl`,
    `${l.snd}.snd`,
    `${song}.cmf`,
    `act${i + 1}.lst`,
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
disk.put('risi.gam', serializeGame(game));

// the pictures, cartoons and words
for (const [name, bytes] of Object.entries(buildScreens({ man: heroes.marcus.pics, mons: mb.pics }))) disk.put(name, bytes);
const cast: Cast = { man: heroes.marcus.pics, cat: heroes.felix.pics, mons: mb.pics };
const cover = coverFli();
// the long cartoons in clips of about 4 seconds, so Esc can skip them between clips
const putClips = (name: string, fli: Uint8Array) => {
  const clips = fliClips(name, fli);
  for (const [n, b] of Object.entries(clips)) disk.put(n, b);
  return clips;
};
const bardLogo = putClips(BARDLOGO, bardIntroFli({ tagline: 'presents Veni, Vidi, Risi!' }));
const coverClips = putClips('cover.fli', cover.fli);
disk.put('title.gif', gif(cover.title, cover.pal));
disk.put('title.lst', serializeSlideList([...clipEntries(bardLogo, 0), ...clipEntries(coverClips, 0), { name: 'title.gif', pause: 12 }]));
const story = putClips('story.fli', storyFli(cast));
disk.put('story.lst', serializeSlideList([...clipEntries(story, 1), { name: 'storybg.gif', pause: 0 }, { name: 'story.txt' }]));
const howto = putClips('howto.fli', howtoFli(cast));
disk.put('howto.lst', serializeSlideList([...clipEntries(howto, 2), { name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]));
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
// the menu plays a medley of every song's refrain
disk.put('menu.cmf', songs.menu);
disk.put('story.cmf', songs.story);
disk.put('won.cmf', songs.won);
disk.put('lost.cmf', songs.lost);
disk.put('demo.rec', demoRecording());
disk.put('readme.txt', readme(PRICE));
// the voice clips cut from the free-plan Riffusion recordings: personal, non-commercial only (kit/license.ts)
const RECORDED_VOCS = [
  'canis',
  'cantemus',
  'cheddar',
  'corona',
  'currimus',
  'dii',
  'felis',
  'flatus',
  'nemo',
  'piscis',
  'quis',
  'ridetis',
  'summa',
  'tecta',
  'ter',
  'titus',
  'victoria',
];
disk.put(
  'license.txt',
  licenseText(
    'Veni, Vidi, Risi!',
    `The 1995 shareware notice of Veni, Vidi, Risi!, its fee and its address are part of the story: there is nothing to pay. The songs are Veni, Vidi, Risi!'s (Lewis Moten's group): ${SONG_CREDIT}; ${ART_CREDIT}.`,
    RECORDED_VOCS,
  ),
);
clipEveryList(disk.files);
disk.write();
console.log(
  `${SETS.map((s) => `${s} ${books[s].index.size}`).join(', ')} background blocks, ${mb.index.size} monster blocks, ${heroes.marcus.index.size}/${heroes.felix.index.size} character blocks`,
);
