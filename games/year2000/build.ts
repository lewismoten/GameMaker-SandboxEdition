// IN THE YEAR 2000! — builds every file of the game into games/year2000/disk/.
//   cd web && npx vite-node ../games/year2000/build.ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Link } from '../../web/src/formats/game';
import { serializeSlideList } from '../../web/src/formats/graphicScripts';
import { serializeMap } from '../../web/src/formats/map';
import { serializeMonsters } from '../../web/src/formats/monster';
import { serializePalette } from '../../web/src/formats/palette';
import { serializeSoundSet } from '../../web/src/formats/sound';
import { serializeGame } from '../../web/src/formats/game';
import { Disk } from '../kit/disk';
import { clipLists } from '../kit/fliClips';
import { SANDLOGO, sandLogoFli } from '../kit/sandlogo';
import { buildCharacter } from './src/characters/character';
import { demoRecording } from './src/demo';
import { LEVELS, SETS } from './src/levels/levels';
import { walkPaths } from './src/walkPaths';
import { writeWalkPaths } from '../kit/walkPaths';
import { DIALS } from './src/levels/level4';
import type { LevelMap } from './src/levels/mapkit';
import { buildMonsters } from './src/characters/monsters';
import { lostSong, menuSong, storySong, titleSong, wonSong } from './src/sound/music';
import { PAL } from './src/art/pal';
import { renderMap } from './src/art/render';
import * as S from './src/screens/screens';
import { buildSounds } from './src/sound/sounds';
import { buildCharBlocks, buildMonsterBlocks } from './src/sprites/sprites';
import { CREDITS, INSTRUCTIONS, POSTCARD, readme } from './src/screens/text';
import { eggPic } from './src/blocks/egg';
import { ITEM_PICS } from './src/blocks/items';
import { PAGES_NEEDED } from './src/ids';
import { licenseText } from '../kit/license';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));
const lst = (name: string, entries: [string, number?][]) => disk.put(name, serializeSlideList(entries.map(([n, pause]) => ({ name: n, pause }))));

// Shared data.
const sets = { suburb: SETS.suburb(), city: SETS.city(), moon: SETS.moon() };
const built = { suburb: sets.suburb.build(), city: sets.city.build(), moon: sets.moon.build() };
for (const k of Object.keys(sets) as (keyof typeof sets)[]) disk.put(`${k}.bbl`, serializeBlocks(built[k]));
const mb = buildMonsterBlocks();
const mbl = mb.build();
const mons = buildMonsters(mb);
const cb = buildCharBlocks();
disk.put('y2k.pal', serializePalette(PAL.pal));
disk.put('y2k.mbl', serializeBlocks(mbl));
disk.put('y2k.mon', serializeMonsters(mons));
disk.put('dex.cbl', serializeBlocks(cb.build()));
disk.put('dex.chr', serializeCharacter(buildCharacter(cb, false)));
disk.put('moon.chr', serializeCharacter(buildCharacter(cb, true)));
const sounds = buildSounds();
disk.put('y2k.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);

// Pictures.
const m = (n: string) => mb.pic(n);
const art: S.Art = {
  dex: cb.pic('down0'),
  dexSide: cb.pic('side0'),
  dexUp: cb.pic('up0'),
  dexMoon: cb.pic('m_down0'),
  sparky: m('sparky0'),
  sparkyMad: m('sparkyMad0'),
  car: m('carR0'),
  carT: m('carT0'),
  truck: m('truck0'),
  alien: m('alien0'),
  alien2: m('alien20'),
  mower: m('mower0'),
  tele: m('tele0'),
  grandma: m('grandma0'),
  meteor: m('meteor0'),
  dino: m('dino0'),
  page: ITEM_PICS.page(),
  quarter: ITEM_PICS.quarter(),
  pill: ITEM_PICS.pill(),
  zapper: ITEM_PICS.zapper(),
  cover: ITEM_PICS.cover(),
  booth: sets.suburb.pic('booth_door'),
  boothTop: sets.suburb.pic('booth_top'),
};
disk.put(SANDLOGO, sandLogoFli());
disk.put('intro.fli', S.introFli(art));
disk.put('tele.fli', S.teleFli(art));
disk.put('launch.fli', S.launchFli(art));
disk.put('won.fli', S.wonFli());
disk.put('title.gif', S.gif(S.titleScreen(art)));
disk.put('menu.gif', S.gif(S.menuScreen(art)));
S.storyScreens(art).forEach((p, i) => disk.put(`story${i + 1}.gif`, S.gif(p)));
disk.put('howto.gif', S.gif(S.paperScreen('HOW TO PLAY', art, 'stars')));
disk.put('credits.gif', S.gif(S.paperScreen('CREDITS', art, 'credits')));
disk.put('won1.gif', S.gif(...S.wonScreen1(art)));
disk.put('won2.gif', S.gif(S.wonScreen2(art)));
disk.put('lost.gif', S.gif(S.lostScreen(art)));
disk.put('hiscore.gif', S.gif(S.hiscoreScreen(art)));
disk.put('load.gif', S.gif(S.filesScreen('LOAD A FUTURE', art)));
disk.put('save.gif', S.gif(S.filesScreen('SAVE THE FUTURE', art)));
// the Sandbox Software logo first, then the game's own intro
lst('title.lst', [
  [SANDLOGO, 0],
  ['intro.fli', 0],
  ['title.gif', 12],
]);
lst('story.lst', [['story1.gif'], ['story2.gif'], ['story3.gif'], ['story4.gif']]);
lst('howto.lst', [['howto.gif', 0], ['howto.txt']]);
lst('credits.lst', [['credits.gif', 0], ['credits.txt']]);
lst('won.lst', [['won.fli', 0], ['won1.gif'], ['won2.gif']]);
disk.put('howto.txt', INSTRUCTIONS);
// The postcard in the launch pad's closet, on the way to the Moon.
disk.put('postcard.gif', S.gif(S.postcardScreen(eggPic())));
disk.put('postcard.txt', POSTCARD);
disk.put('credits.txt', CREDITS);

// Songs.
disk.put('title.cmf', titleSong());
disk.put('menu.cmf', menuSong());
disk.put('story.cmf', storySong());
disk.put('won.cmf', wonSong());
disk.put('lost.cmf', lostSong());

// The levels. Scenes: 0 title, 1 the end, 2.. the levels in order, then the Moon again for
// whoever leaves the exchange by the closet hatch (the postcard comes before the rocket).
const game = newGame('IN THE YEAR 2000');
const maps: LevelMap[] = LEVELS.map((l) => l.build(sets[l.set]));
let pages = 0;
LEVELS.forEach((l, i) => {
  const map = maps[i];
  pages += map.count('page');
  disk.put(`${l.file}.map`, serializeMap(map.done()));
  disk.put(`${l.file}.cmf`, l.song());
  const start = map.marks.has('start') ? map.at('start') : map.at('hall');
  const [vx, vy] = l.card.view;
  const view = renderMap(map.map, built[l.set], vx, vy, 16, 5, mbl, mons);
  const dex = cb.pic(l.chr === 'moon.chr' ? 'm_down0' : 'down0');
  if (start.x >= vx && start.x < vx + 16 && start.y >= vy && start.y < vy + 5) view.blit(dex, (start.x - vx) * 20, (start.y - vy) * 20, 255);
  disk.put(`card${i + 1}.gif`, S.gif(S.levelCard(i + 1, LEVELS.length, l.card.title, l.card.lines, view)));
  lst(`lvl${i + 1}.lst`, [...l.intro.map((f) => [f, 0] as [string, number]), [`card${i + 1}.gif`, 8]]);

  const scene = emptyScene(ADVTYPE);
  scene.desc = l.desc.slice(0, 19);
  scene.pos = { x: 40 + i * 48, y: 110 };
  // The exchange shows only the teleporter when you dial; its card comes as the mall's exit.
  const introFile = l.file === 'exchange' ? 'tele.fli' : `lvl${i + 1}.lst`;
  const exitFile = LEVELS[i + 1]?.file === 'exchange' ? `lvl${i + 2}.lst` : '';
  scene.files = [
    'y2k.pal',
    `${l.file}.map`,
    `${l.set}.bbl`,
    'y2k.mon',
    'y2k.mbl',
    l.chr,
    'dex.cbl',
    'y2k.snd',
    `${l.file}.cmf`,
    introFile,
    exitFile,
    ...new Array(9).fill(''),
  ];
  const links: Link[] = [];
  const self = 2 + i;
  if (l.file === 'exchange') for (const [from, to] of DIALS) links.push({ toScene: self, from: map.at(from), to: map.at(to) });
  const next = maps[i + 1];
  links.push({
    toScene: next ? self + 1 : 1,
    from: map.at('exit'),
    to: next ? (next.marks.has('start') ? next.at('start') : next.at('hall')) : { x: 0, y: 0 },
  });
  if (map.marks.has('tomorrow')) links.push({ toScene: 2 + LEVELS.length, from: map.at('tomorrow'), to: next.at('start') });
  if (links.length > MAXSCENELINKS) throw new Error('Too many links');
  scene.links = Array.from({ length: MAXSCENELINKS }, (_, k) => links[k] ?? { toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } });
  game.scenes.push(scene);
  console.log(`${l.desc}: ${map.count('page')} pages, ${map.count('quarter')} quarters, ${map.monsters} monsters`);
});
console.log(`${pages} pages in all; the judges want ${PAGES_NEEDED}`);
{
  const moon = LEVELS.findIndex((l) => l.file === 'moon');
  const scene = structuredClone(game.scenes[2 + moon]);
  scene.desc = 'Tomorrow';
  scene.pos = { x: 40 + moon * 48, y: 150 };
  scene.files[9] = 'postcard.lst';
  game.scenes.push(scene);
  lst('postcard.lst', [['postcard.gif', 0], ['postcard.txt'], ...LEVELS[moon].intro.map((f) => [f, 0] as [string, number]), [`card${moon + 1}.gif`, 8]]);
}

const title = game.scenes[0];
title.files = [
  'title.lst',
  'title.cmf',
  'menu.gif',
  'menu.cmf',
  'story.lst',
  'story.cmf',
  'howto.lst',
  'credits.lst',
  'hiscore.gif',
  'load.gif',
  'save.gif',
  'demo.rec',
  ...new Array(8).fill(''),
];
const startAt = (process.env.Y2K_START ? Number(process.env.Y2K_START) : 1) - 1;
const first = maps[startAt];
title.links[0] = { toScene: 2 + startAt, from: { x: 0, y: 0 }, to: first.marks.has('start') ? first.at('start') : first.at('hall') };
const end = game.scenes[1];
end.desc = 'The End';
end.files = ['won.lst', 'won.cmf', 'lost.gif', 'lost.cmf', ...new Array(16).fill('')];
disk.put('year2000.gam', serializeGame(game));
disk.put('demo.rec', demoRecording());
disk.put('readme.txt', readme('$12'));
disk.put('license.txt', licenseText('In The Year 2000!'));
// the long cartoons the title and the menu play, in clips of about 4 seconds (Esc skips between clips)
clipLists(disk.files, ['title.lst', 'story.lst', 'howto.lst', 'credits.lst']);
disk.write();
// the sidewalks and walks the walkthrough's bot keeps to (not on the disk)
writeWalkPaths('year2000', walkPaths(sets));
console.log(
  `${Object.entries(sets)
    .map(([k, s]) => `${k} ${s.names.length}`)
    .join(', ')} background blocks; ${mb.names.length} monster blocks; ${cb.names.length} character blocks; ${Object.keys(sounds.vocs).length} sounds`,
);
