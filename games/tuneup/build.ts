// TUNE-UP (Sandbox Software, 1994): builds every file of the game into games/tuneup/disk/.
//   cd web && npx vite-node ../games/tuneup/build.ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { MAXSCENELINKS, newGame, emptyScene, serializeGame, ADVTYPE, NOSCENE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { serializeSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { serializeSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { clipEntries, clipEveryList, fliClips } from '@lewismoten/gamemaker-sandbox-tools/kit/fliClips';
import { Disk } from '../kit/disk';
import { licenseText } from '../kit/license';
import { SANDLOGO, sandLogoFli } from '../kit/sandlogo';
import { buildPalette } from './src/art/pal';
import { buildMonsters, buildRailTeddy, buildTeddy } from './src/characters';
import { LEVELS } from './src/levels/levels';
import { buildScreens } from './src/screens/screens';
import { CREDITS, INSTRUCTIONS, STORY, readme } from './src/screens/text';
import { lostSong, menuSong, wonSong } from './src/sound/song';
import { buildSoundSet, buildVocs } from './src/sound/sounds';
import { buildCharBlocks, buildMonsterBlocks } from './src/sprites/sprites';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const cb = buildCharBlocks();
disk.put('teddy.cbl', serializeBlocks(cb.blocks));
disk.put('teddy.chr', serializeCharacter(buildTeddy(cb)));
disk.put('rail.chr', serializeCharacter(buildRailTeddy(cb)));
const mb = buildMonsterBlocks();
disk.put('things.mbl', serializeBlocks(mb.blocks));
for (const place of new Set(LEVELS.map((l) => l.snd))) disk.put(`${place}.snd`, serializeSoundSet(buildSoundSet(place)));
for (const [name, voc] of Object.entries(buildVocs())) disk.put(`${name}.voc`, voc);

// Scenes: 0 title/menu, 1 the ending (won or lost), then the levels in order.
const game = newGame('TUNE-UP');
const built = LEVELS.map((l) => {
  const pal = buildPalette(l.light);
  const kit = l.blocks(pal);
  const level = l.build(kit.book);
  return { l, pal, kit, bbl: kit.book.finish(), ...level };
});
built.forEach(({ l, m, pal, bbl }, i) => {
  disk.put(`${l.file}.pal`, serializePalette(pal.pal));
  disk.put(`${l.file}.map`, serializeMap(m.build()));
  disk.put(`${l.file}.bbl`, serializeBlocks(bbl));
  disk.put(`${l.file}.mon`, serializeMonsters(buildMonsters(mb, l.mons)));
  disk.put(`${l.file}.cmf`, l.song());
  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc;
  scene.pos = { x: 60 + i * 60, y: 110 };
  // a one-screen level never scrolls; a wide one scrolls side to side only
  const side = l.wide ? 0xff : 0;
  scene.scroll = { up: 0, down: 0, left: side, right: side, style: 0, xtra: new Uint8Array(11) };
  scene.files = [
    `${l.file}.pal`,
    `${l.file}.map`,
    `${l.file}.bbl`,
    `${l.file}.mon`,
    'things.mbl',
    `${l.chr}.chr`,
    'teddy.cbl',
    `${l.snd}.snd`,
    `${l.file}.cmf`,
    '',
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
  'menu.cmf',
  'menu.gif',
  'menu.cmf',
  'story.lst',
  'menu.cmf',
  'howto.lst',
  'credits.lst',
  'hiscore.gif',
  'loadgame.gif',
  'savegame.gif',
  '',
  ...new Array(8).fill(''),
];
start.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: built[0].start[0], y: built[0].start[1] } };
const end = game.scenes[1];
end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];
disk.put('tuneup.gam', serializeGame(game));

// the pictures and words
for (const [name, bytes] of Object.entries(buildScreens())) disk.put(name, bytes);
const logo = fliClips(SANDLOGO, sandLogoFli());
for (const [n, b] of Object.entries(logo)) disk.put(n, b);
disk.put('title.lst', serializeSlideList([...clipEntries(logo, 0), { name: 'title.gif', pause: 10 }]));
disk.put('story.lst', serializeSlideList([{ name: 'storybg.gif', pause: 0 }, { name: 'story.txt' }]));
disk.put('howto.lst', serializeSlideList([{ name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]));
disk.put('credits.lst', serializeSlideList([{ name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]));
disk.put('won.lst', serializeSlideList([{ name: 'won.gif', pause: 10 }]));
disk.put('lost.lst', serializeSlideList([{ name: 'lost.gif', pause: 6 }]));
disk.put('story.txt', STORY);
disk.put('howto.txt', INSTRUCTIONS);
disk.put('credits.txt', CREDITS);
disk.put('menu.cmf', menuSong());
disk.put('won.cmf', wonSong());
disk.put('lost.cmf', lostSong());
disk.put('readme.txt', readme());
disk.put('license.txt', licenseText('Tune-Up'));
clipEveryList(disk.files);
disk.write();
console.log(built.map(({ l, kit }) => `${l.file}: ${kit.book.index.size} blocks`).join(', ') + `; ${mb.index.size} monster blocks`);
