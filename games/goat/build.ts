// THIRD GOAT FROM THE LEFT (The Bard of Bizarre, 1995): builds every file of the game into
// games/goat/disk/.
//   cd web && npx vite-node ../games/goat/build.ts
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
import { Pixels } from '../kit/pixels';
import { licenseText } from '../kit/license';
import { renderRegion } from '../snowbound/src/art/render';
import { buildPalette, type Light } from './src/art/pal';
import { buildBlocks } from './src/blocks/blocks';
import { buildGoat, buildMonsters, type MonsterOptions } from './src/characters';
import { demoRecording } from './src/demo';
import { caravan, field, stable, town, ORIGIN, type Level } from './src/levels/maps';
import { cardFli, faintFli, storyFli, type Cast, type CardView } from './src/screens/cartoons';
import { buildScreens } from './src/screens/screens';
import { CREDITS, INSTRUCTIONS, STORY, readme } from './src/screens/text';
import { creditsSong, levelSongs, lostSong, storySong, titleSong, wonSong } from './src/sound/song';
import { buildSoundSet, buildVocs, type Place } from './src/sound/sounds';
import { buildCharBlocks, buildMonsterBlocks } from './src/sprites/sprites';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

/** The registration fee the 1995 README asks (Game-Maker's 1994 license: shareware asks at least $5). */
export const PRICE = '$5';

const base = buildPalette('day');
const book = buildBlocks(base);
const bbl = book.finish();
const mb = buildMonsterBlocks(base);
const cb = buildCharBlocks(base);
disk.put('goat.bbl', serializeBlocks(bbl));
disk.put('goat.mbl', serializeBlocks(mb.blocks));
disk.put('goat.cbl', serializeBlocks(cb.blocks));
disk.put('goat.chr', serializeCharacter(buildGoat(cb)));
for (const place of ['outside', 'stable'] as Place[]) disk.put(`${place}.snd`, serializeSoundSet(buildSoundSet(place)));
for (const [name, voc] of Object.entries(buildVocs())) disk.put(`${name}.voc`, voc);

interface LevelDef {
  file: string;
  desc: string;
  light: Light;
  build: (b: typeof book) => Level;
  snd: Place;
  mons: MonsterOptions;
  /** The card's view: its top-left block (level coordinates). */
  view: [number, number];
}

const LEVELS: LevelDef[] = [
  { file: 'field', desc: "The Shepherds' Field", light: 'field', build: field, snd: 'outside', mons: {}, view: [0, 1] },
  { file: 'town', desc: 'Bethlehem', light: 'town', build: town, snd: 'outside', mons: {}, view: [4, 2] },
  { file: 'caravan', desc: 'The Caravan', light: 'camp', build: caravan, snd: 'outside', mons: { camelRun: 14, camelSpeed: 2 }, view: [2, 6] },
  { file: 'stable', desc: 'The Stable', light: 'stable', build: stable, snd: 'stable', mons: {}, view: [4, 1] },
];

// Scenes: 0 title/menu, 1 game won/lost, then the levels in order.
const game = newGame('THIRD GOAT');
const built = LEVELS.map((l) => ({ l, ...l.build(book) }));
const songs = levelSongs();
const cards: CardView[] = [];
let line: Parameters<typeof buildScreens>[0]['line'] | undefined;
built.forEach(({ l, m, start }, i) => {
  const pal = buildPalette(l.light);
  const map = m.build();
  const mons = buildMonsters(mb, l.mons);
  disk.put(`${l.file}.pal`, serializePalette(pal.pal));
  disk.put(`${l.file}.map`, serializeMap(map));
  disk.put(`${l.file}.mon`, serializeMonsters(mons));
  disk.put(`${l.file}.cmf`, songs[i]);
  disk.put(`lvl${i + 1}.lst`, serializeSlideList([{ name: `card${i + 1}.fli`, pause: 3 }]));
  const [vx, vy] = l.view;
  const view = renderRegion(map, bbl, mb.blocks, mons, vx + ORIGIN, vy + ORIGIN, 16, 6, []);
  const [sx, sy] = [start[0] - vx, start[1] - vy];
  cards.push({ map: view, pal, start: sx >= 0 && sy >= 0 && sx < 16 && sy < 6 ? [sx * 20, 54 + sy * 20] : undefined });
  if (l.file === 'stable') {
    // the ending's picture: the line at the manger, with the goat in her place
    const done = { ...map, blocks: map.blocks.slice() };
    done.blocks[(4 + ORIGIN) * 100 + 12 + ORIGIN] = book.n('straw');
    const at = m.links.find((k) => k.toScene === 'won')!.from;
    line = { map: renderRegion(done, bbl, mb.blocks, mons, 8 + ORIGIN, 2 + ORIGIN, 8, 3, [{ pixels: cb.blocks[cb.n('up0')].pixels, x: at[0], y: at[1] }]), pal };
  }

  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc;
  scene.pos = { x: 60 + i * 60, y: 110 };
  scene.files = [`${l.file}.pal`, `${l.file}.map`, 'goat.bbl', `${l.file}.mon`, 'goat.mbl', 'goat.chr', 'goat.cbl', `${l.snd}.snd`, `${l.file}.cmf`, `lvl${i + 1}.lst`, '', ...new Array(9).fill('')];
  if (m.links.length > MAXSCENELINKS) throw new Error(`${l.file}: too many links`);
  scene.links = Array.from({ length: MAXSCENELINKS }, (_, k) => {
    const spec = m.links[k];
    if (!spec) return { toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    const from = { x: spec.from[0], y: spec.from[1] };
    if (spec.toScene === 'won') return { toScene: 1, from, to: { x: 0, y: 0 } };
    const next = built[i + 1];
    return { toScene: i + 3, from, to: { x: next.start[0], y: next.start[1] } };
  });
  game.scenes.push(scene);
});

const start = game.scenes[0];
start.files = ['title.lst', 'title.cmf', 'menu.gif', 'menu.cmf', 'story.lst', 'story.cmf', 'howto.lst', 'credits.lst', 'hiscore.gif', 'loadgame.gif', 'savegame.gif', 'demo.rec', ...new Array(8).fill('')];
start.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: built[0].start[0], y: built[0].start[1] } };
const end = game.scenes[1];
end.files = ['won.lst', 'won.cmf', 'lost.gif', 'lost.cmf', ...new Array(16).fill('')];
disk.put('goat.gam', serializeGame(game));

const goatPics = cb.pics;
const screens = buildScreens({ goat: goatPics, line: line! });
for (const [name, bytes] of Object.entries(screens)) disk.put(name, bytes);
disk.put(BARDLOGO, bardIntroFli());
disk.put('title.lst', serializeSlideList([{ name: BARDLOGO, pause: 0 }, { name: 'title.gif', pause: 12 }]));
const cast: Cast = {
  goat: cb.pics,
  mons: mb.pics,
  block: (name) => {
    const p = new Pixels(20, 20);
    p.px.set(bbl[book.n(name)].pixels);
    return p;
  },
};
disk.put('story.fli', storyFli(cast));
cards.forEach((card, i) => disk.put(`card${i + 1}.fli`, cardFli(i, card, cast)));
disk.put('story.lst', serializeSlideList([{ name: 'story.fli', pause: 1 }, { name: 'storybg.gif', pause: 0 }, { name: 'story.txt' }]));
disk.put('faint.fli', faintFli(cast));
disk.put('howto.lst', serializeSlideList([{ name: 'faint.fli', pause: 2 }, { name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]));
disk.put('credits.lst', serializeSlideList([{ name: 'bardpic.gif', pause: 8 }, { name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]));
disk.put('won.lst', serializeSlideList([{ name: 'won1.gif', pause: 10 }, { name: 'won2.gif', pause: 12 }, { name: 'won3.gif', pause: 10 }]));
disk.put('story.txt', STORY);
disk.put('howto.txt', INSTRUCTIONS);
disk.put('credits.txt', CREDITS);
disk.put('title.cmf', titleSong());
// the menu plays the whole song, all the way through
disk.put('menu.cmf', creditsSong());
disk.put('story.cmf', storySong());
disk.put('won.cmf', wonSong());
disk.put('lost.cmf', lostSong());
disk.put('demo.rec', demoRecording());
disk.put('readme.txt', readme(PRICE));
disk.put(
  'license.txt',
  licenseText(
    'Third Goat from the Left',
    "The Bard of Bizarre's 1995 shareware notice, its fee and its address are part of the story: there is nothing to pay. The song is Lewis Moten's (as The Bard of Bizarre), recorded with Riffusion, an AI music tool.",
  ),
);
disk.write();
console.log(`${book.index.size} background blocks, ${mb.index.size} monster blocks, ${cb.index.size} character blocks`);
