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
import { serializeSlideList } from '../../web/src/formats/graphicScripts';
import { BARDLOGO, bardIntroFli } from '../kit/bard';
import { Disk } from '../kit/disk';
import { licenseText } from '../kit/license';
import { Pixels } from '../kit/pixels';
import { gif } from '../snowbound/src/screens/scenery';
import { renderRegion } from '../snowbound/src/art/render';
import { buildPalette } from './src/art/pal';
import { buildCamel, buildMonsters } from './src/characters';
import { LEVELS } from './src/levels/levels';
import { ORIGIN } from './src/levels/maps';
import { demoRecording } from './src/demo';
import { cardFli, coverFli, howtoFli, lostFli, storyFli, wonFlis, type Cast, type CardView } from './src/screens/cartoons';
import { buildScreens } from './src/screens/screens';
import { CREDITS, INSTRUCTIONS, SONG_CREDIT, STORY, readme } from './src/screens/text';
import { levelSongs, lostSong, storySong, titleSong, wholeSong, wonSong } from './src/sound/song';
import { buildSoundSet, buildVocs } from './src/sound/sounds';
import { buildCharBlocks, buildMonsterBlocks, FORMS, type Form } from './src/sprites/sprites';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

/** The registration fee the 1995 README asks (Game-Maker's 1994 license: shareware asks at least $5). */
export const PRICE = '$5';

const base = buildPalette('plain');
const mb = buildMonsterBlocks(base);
disk.put('things.mbl', serializeBlocks(mb.blocks));
const cbls = {} as Record<Form, ReturnType<typeof buildCharBlocks>>;
for (const form of Object.keys(FORMS) as Form[]) {
  const cb = (cbls[form] = buildCharBlocks(base, form));
  disk.put(`${form}.cbl`, serializeBlocks(cb.blocks));
  disk.put(`${form}.chr`, serializeCharacter(buildCamel(cb)));
}
/** The camel posed, as one 20x40 picture (his top block over his bottom, if he has one). */
const camelPic = (pose: string, form = 'loaded'): Pixels => {
  const cb = cbls[form as Form];
  const p = new Pixels(20, 40, 255);
  const top = cb.index.get(`${pose}.top`);
  if (top !== undefined) p.px.set(cb.blocks[top].pixels, 0);
  const bottom = cb.index.get(pose);
  if (bottom === undefined) throw new Error(`No camel pose ${pose}`);
  p.px.set(cb.blocks[bottom].pixels, 400);
  return p;
};
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
const cards: CardView[] = [];
built.forEach(({ l, m, pal, bbl }, i) => {
  const map = m.build();
  disk.put(`${l.file}.pal`, serializePalette(pal.pal));
  disk.put(`${l.file}.map`, serializeMap(map));
  disk.put(`${l.file}.bbl`, serializeBlocks(bbl));
  disk.put(`${l.file}.mon`, serializeMonsters(buildMonsters(mb, l.mons)));
  disk.put(`${l.file}.cmf`, songs[i]);
  disk.put(`lvl${i + 1}.lst`, serializeSlideList([{ name: `card${i + 1}.fli`, pause: 3 }]));
  const [vx, vy] = l.view;
  cards.push({ map: renderRegion(map, bbl, mb.blocks, buildMonsters(mb, l.mons), vx + ORIGIN, vy + ORIGIN, 16, 6, []), pal, form: l.form });
  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc;
  scene.pos = { x: 60 + i * 60, y: 110 };
  scene.files = [`${l.file}.pal`, `${l.file}.map`, `${l.file}.bbl`, `${l.file}.mon`, 'things.mbl', `${l.form}.chr`, `${l.form}.cbl`, `${l.snd}.snd`, `${l.file}.cmf`, `lvl${i + 1}.lst`, '', ...new Array(9).fill('')];
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
disk.put('needle.gam', serializeGame(game));

// the pictures, cartoons and words
for (const [name, bytes] of Object.entries(buildScreens({ camel: (pose) => camelPic(pose) }))) disk.put(name, bytes);
const cast: Cast = { camel: camelPic, mons: mb.pics };
const cover = coverFli();
disk.put(BARDLOGO, bardIntroFli());
disk.put('cover.fli', cover.fli);
disk.put('title.gif', gif(cover.title, cover.pal));
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
    'Thread the Needle, Brother Camel',
    `The Bard of Bizarre's 1995 shareware notice, its fee and its address are part of the story: there is nothing to pay. The song is The Bard of Bizarre's (Lewis Moten's): ${SONG_CREDIT}.`,
  ),
);
disk.write();
console.log(built.map(({ l, kit }) => `${l.file}: ${kit.book.index.size} blocks`).join(', ') + `; ${mb.index.size} monster blocks`);
