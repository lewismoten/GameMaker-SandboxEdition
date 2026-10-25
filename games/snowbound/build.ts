// SNOWBOUND: The $89 Shovel — builds every file of the game into games/snowbound/disk/.
//   cd web && npx vite-node ../games/snowbound/build.ts
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
import { clipLists } from '../kit/fliClips';
import { SANDLOGO, sandLogoFli } from '../kit/sandlogo';
import { buildBlocks } from './src/blocks/blocks';
import { MON } from './src/ids';
import { bowdenDrive, galeStreet, jamieHill, lavaleMall, type MapBuilder } from './src/levels/maps';
import { hillSong, lostSong, mainSong, mallSong, menuSong, pineSong, storySong, titleSong, wonSong } from './src/sound/music';
import { buildPalette, type TimeOfDay } from './src/art/pal';
import { renderRegion } from './src/art/render';
import { buildScreens } from './src/screens/screens';
import { buildSounds } from './src/sound/sounds';
import { buildCharBlocks } from './src/sprites/charBlocks';
import { buildMonsterBlocks } from './src/sprites/monsterBlocks';
import { buildMonsters, type MonsterOptions } from './src/characters/monsters';
import { buildKid, buildSledder } from './src/characters/kid';
import { CREDITS, INSTRUCTIONS, WOODS, readme } from './src/screens/text';
import { demoRecording } from './src/demo';
import { licenseText } from '../kit/license';
import { writeWalkPaths } from '../kit/walkPaths';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const noon = buildPalette('noon');
const book = buildBlocks(noon);
const bbl = book.finish();
const mb = buildMonsterBlocks(noon);
const cb = buildCharBlocks(noon);
disk.put('snow.bbl', serializeBlocks(bbl));
disk.put('snow.mbl', serializeBlocks(mb.blocks));
disk.put('kid.cbl', serializeBlocks(cb.blocks));
disk.put('kid.chr', serializeCharacter(buildKid(cb, MON.myBall)));
disk.put('sled.chr', serializeCharacter(buildSledder(cb)));
const sounds = buildSounds();
disk.put('snow.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);

interface Level {
  file: string;
  desc: string;
  time: TimeOfDay;
  build: (b: typeof book) => { m: MapBuilder; start: [number, number] };
  chr: string;
  song: [string, () => Uint8Array];
  mons: MonsterOptions;
  card: { title: string; time: string; lines: string[]; view: [number, number] };
}

const LEVELS: Level[] = [
  {
    file: 'gale',
    desc: 'Gale Street',
    time: 'morning',
    build: galeStreet,
    chr: 'kid.chr',
    song: ['gale.cmf', pineSong],
    mons: { plowRun: 50, plowSpeed: 3 },
    card: {
      title: '1. GALE STREET',
      time: 'Friday, 7:00 AM.  18 inches!',
      lines: ['Papers first! Grab the bundle', 'by the porch, one paper per', 'door mat. Then shovel. East!'],
      view: [9, 13],
    },
  },
  {
    file: 'jamie',
    desc: 'Jamie Street',
    time: 'noon',
    build: jamieHill,
    chr: 'sled.chr',
    song: ['jamie.cmf', hillSong],
    mons: {},
    card: {
      title: '2. JAMIE STREET',
      time: 'Noon. Closed for sledding!',
      lines: ['Steer LEFT/RIGHT (A/D), UP (W)', 'brakes, DOWN (S) pushes. Grab', 'the dollars on the way down.'],
      view: [30, 4],
    },
  },
  {
    file: 'bowden',
    desc: 'Bowden Drive',
    time: 'dusk',
    build: bowdenDrive,
    chr: 'kid.chr',
    song: ['bowden.cmf', mainSong],
    mons: { plowRun: 36, plow2Run: 30, carRun: 50, plowSpeed: 4, carSpeed: 5 },
    card: {
      title: '3. BOWDEN DRIVE',
      time: '4:30 PM. Everybody is home.',
      lines: ['Two customers up here, two', 'across the creek footbridge.', 'Big Pete? SPACE throws snow!'],
      view: [6, 23],
    },
  },
  {
    file: 'lavale',
    desc: 'LaVale Mall',
    time: 'night',
    build: lavaleMall,
    chr: 'kid.chr',
    song: ['lavale.cmf', mallSong],
    mons: { plowRun: 56, plow2Run: 52, plowSpeed: 4 },
    card: {
      title: '4. LAVALE MALL',
      time: '8:00 PM. One hour to closing.',
      lines: ['Short of $89? Dig the lot:', 'it keeps snowing over. F2', 'counts the can. Then shop!'],
      view: [24, 10],
    },
  },
];

// Scenes: 0 title/menu, 1 game won/lost, 2.. the levels in order, then the pines.
const WOODS_SCENE = 2 + LEVELS.length;
const game = newGame('SNOWBOUND');
const built = LEVELS.map((l) => ({ l, ...l.build(book) }));
const cards: Parameters<typeof buildScreens>[1]['cards'] = [];
let shot = undefined as unknown as ReturnType<typeof renderRegion>;
let shotPal = noon;
let totalMoney = 0;
built.forEach(({ l, m, start }, i) => {
  const pal = buildPalette(l.time);
  const map = m.build();
  totalMoney += m.money;
  const mons = buildMonsters(mb, l.mons);
  disk.put(`${l.time}.pal`, serializePalette(pal.pal));
  disk.put(`${l.file}.map`, serializeMap(map));
  disk.put(`${l.file}.mon`, serializeMonsters(mons));
  disk.put(l.song[0], l.song[1]());
  disk.put(`lvl${i + 1}.lst`, serializeSlideList([{ name: `card${i + 1}.gif`, pause: 8 }]));
  const view = renderRegion(map, bbl, mb.blocks, mons, l.card.view[0], l.card.view[1], 16, 6, [
    { pixels: cb.blocks[cb.n(l.chr === 'sled.chr' ? 'sled' : 'down0')].pixels, x: start[0], y: start[1] },
  ]);
  cards.push({ name: `card${i + 1}`, map: view, pal, ...l.card });
  if (i === 0) {
    shot = renderRegion(map, bbl, mb.blocks, mons, 12, 12, 8, 4);
    shotPal = pal;
  }

  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc;
  scene.pos = { x: 60 + i * 60, y: 110 };
  scene.files = [
    `${l.time}.pal`,
    `${l.file}.map`,
    'snow.bbl',
    `${l.file}.mon`,
    'snow.mbl',
    l.chr,
    'kid.cbl',
    'snow.snd',
    l.song[0],
    `lvl${i + 1}.lst`,
    '',
    ...new Array(9).fill(''),
  ];
  if (m.links.length > MAXSCENELINKS) throw new Error(`${l.file}: too many links`);
  scene.links = Array.from({ length: MAXSCENELINKS }, (_, k) => {
    const spec = m.links[k];
    if (!spec) return { toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    const from = { x: spec.from[0], y: spec.from[1] };
    if (spec.toScene === 'woods') return { toScene: WOODS_SCENE, from, to: { x: spec.to[0], y: spec.to[1] } };
    const next = built[i + 1];
    const to = spec.toScene === 'won' ? { x: 0, y: 0 } : { x: next.start[0], y: next.start[1] };
    return { toScene: spec.toScene === 'won' ? 1 : i + 3, from, to };
  });
  game.scenes.push(scene);
  console.log(`${l.desc}: $${m.money} to shovel and pick up`);
});
console.log(`Total: $${totalMoney} before the mall lot snows over`);

// The pines behind the Gale Street park: the toboggan's link comes here. The scene loads
// Gale Street again (no monsters, no song) only for its intro, the page about what lay in
// the hollow, and starts the kid on a link down to the top of Jamie Street, so it is gone
// on the first tick and a crash on the sled run replays Jamie Street, not this page.
// PLAYGAME still fades its map in and out around that tick, so it loads dark.pal (all
// black) and Gale Street never flashes up between the page and Jamie Street.
{
  disk.put('dark.pal', serializePalette(new Uint8Array(768)));
  const pines = emptyScene(ADVTYPE);
  pines.desc = 'The Pines';
  pines.pos = { x: 90, y: 170 };
  pines.files = ['dark.pal', 'gale.map', 'snow.bbl', '', '', 'kid.chr', 'kid.cbl', 'snow.snd', '', 'woods.lst', ...new Array(10).fill('')];
  const gale = game.scenes[2].links.find((l) => l.toScene === WOODS_SCENE)!;
  const jamie = built[1].start;
  pines.links = Array.from({ length: MAXSCENELINKS }, (_, k) =>
    k === 0 ? { toScene: 3, from: { ...gale.to }, to: { x: jamie[0], y: jamie[1] } } : { toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } },
  );
  if (game.scenes.length !== WOODS_SCENE) throw new Error('The pines must follow the levels');
  game.scenes.push(pines);
}
void shotPal;

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
end.files = ['won.lst', 'won.cmf', 'lost.gif', 'lost.cmf', ...new Array(16).fill('')];
disk.put('snowbnd.gam', serializeGame(game));

// Pictures, slide shows and text pages.
const sprites = new Map([...cb.pics, ...mb.pics]);
const screens = buildScreens(sprites, { cards, shot, shotPal });
for (const [name, bytes] of Object.entries(screens)) disk.put(name, bytes);
// the Sandbox Software logo first, then the game's own intro
disk.put(SANDLOGO, sandLogoFli());
disk.put(
  'title.lst',
  serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'intro.fli', pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('story.lst', serializeSlideList([{ name: 'news1.gif' }, { name: 'news2.gif' }, { name: 'news3.gif' }, { name: 'route.gif' }]));
disk.put('howto.lst', serializeSlideList([{ name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]));
disk.put('credits.lst', serializeSlideList([{ name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]));
disk.put('won.lst', serializeSlideList([{ name: 'won1.gif' }, { name: 'arcade.gif' }, { name: 'won2.gif' }, { name: 'won3.gif' }]));
disk.put('woods.lst', serializeSlideList([{ name: 'woods.gif', pause: 0 }, { name: 'woods.txt' }]));
disk.put('woods.txt', WOODS);
disk.put('howto.txt', INSTRUCTIONS);
disk.put('credits.txt', CREDITS);
disk.put('title.cmf', titleSong());
disk.put('menu.cmf', menuSong());
disk.put('story.cmf', storySong());
disk.put('won.cmf', wonSong());
disk.put('lost.cmf', lostSong());
disk.put('demo.rec', demoRecording());
disk.put('readme.txt', readme('$12'));
disk.put('license.txt', licenseText('Snowbound: The $89 Shovel'));
// the long cartoons the title and the menu play, in clips of about 4 seconds (Esc skips between clips)
clipLists(disk.files, ['title.lst', 'story.lst', 'howto.lst', 'credits.lst']);
disk.write();
// the sidewalks, front walks and driveways (and the side streets, plowed down to the same
// asphalt) the walkthrough's bot keeps to; not the main road, which it keeps off anyway (not on the disk)
writeWalkPaths('snowbound', { 'snow.bbl': ['walk', 'deepWalk', 'stoop', 'stoopPaper', 'asphalt', 'deep', 'tip', 'rootBeer'].map((n) => book.n(n)) });
console.log(
  `${book.index.size} background blocks, ${mb.index.size} monster blocks, ${cb.index.size} character blocks, ${sounds.set.digital.filter(Boolean).length} sounds`,
);
