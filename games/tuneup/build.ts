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
import { clipEntries, clipEveryList, fliClips, type ClipOptions } from '@lewismoten/gamemaker-sandbox-tools/kit/fliClips';
import { Disk } from '../kit/disk';
import { licenseText } from '../kit/license';
import { SANDLOGO, sandLogoFli } from '../kit/sandlogo';
import { buildPalette } from './src/art/palette';
import { bblOf, shareSets } from './src/blocks/shared';
import { buildLeo, buildMonsters, buildOilLeo, buildPianoLeo, buildPumpLeo } from './src/characters';
import { TEDDY_BLOCKS, buildNobody, buildTeddy, nobodyBlocks } from './src/heroes';
import { CHEZ_BLOCKS, buildChez } from './src/sprites/chezHero';
import { LEVELS, firstOfLevel } from './src/levels/levels';
import { mapOf, rowOffset, stackMaps } from './src/levels/stacks';
import { buildScreens, cardEntries } from './src/screens/screens';
import { OUTRO } from './src/screens/banter';
import { endingReel, openingReel, SPEED, stingReel, unshrinkReel } from './src/screens/reels';
import type { Tool } from './src/screens/art';
import { CREDITS, INSTRUCTIONS, STORY, readme } from './src/screens/text';
import { lostSong, menuSong, wonSong } from './src/sound/themeSongs';
import { buildSoundSet, buildVocs } from './src/sound/sounds';
import { buildCharBlocks, buildMonsterBlocks } from './src/sprites/cast';
import { demoRecording } from './src/demo';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const cb = buildCharBlocks();
disk.put('leo.cbl', serializeBlocks(cb.blocks));
disk.put('leo.chr', serializeCharacter(buildLeo(cb)));
disk.put('piano.chr', serializeCharacter(buildPianoLeo(cb)));
disk.put('oil.chr', serializeCharacter(buildOilLeo(cb)));
disk.put('pump.chr', serializeCharacter(buildPumpLeo(cb)));
disk.put('teddy.cbl', serializeBlocks(TEDDY_BLOCKS.build()));
disk.put('teddy.chr', serializeCharacter(buildTeddy()));
disk.put('nobody.cbl', serializeBlocks(nobodyBlocks().blocks));
disk.put('nobody.chr', serializeCharacter(buildNobody()));
disk.put('chez.cbl', serializeBlocks(CHEZ_BLOCKS.blocks));
disk.put('chez.chr', serializeCharacter(buildChez()));
/** Each hero's character blocks. */
const CBL: Record<string, string> = { teddy: 'teddy.cbl', nobody: 'nobody.cbl', chez: 'chez.cbl' };
const mb = buildMonsterBlocks();
disk.put('cast.mbl', serializeBlocks(mb.blocks));
for (const place of new Set(LEVELS.map((l) => l.snd))) disk.put(`${place}.snd`, serializeSoundSet(buildSoundSet(place)));
for (const [name, voc] of Object.entries(buildVocs())) disk.put(`${name}.voc`, voc);

/** The tool each level's Hat Sting pulls out. */
const TOOLS: Record<number, Tool> = {
  1: 'cables',
  2: 'plug',
  3: 'roll',
  4: 'oilcan',
  5: 'kazoo',
  6: 'bone',
  7: 'hubcap',
  8: 'pump',
  9: 'tape',
  10: 'wiper',
  11: 'horn',
  12: 'gear',
  13: 'radio',
  14: 'key',
  15: 'baton',
};
// Cartoons go without the ring frame nothing plays, and cut where the picture changes anyway.
// Clips run up to 6 s (Esc answers a little slower) so each Hat Sting cuts at its scene change.
const CLIPS: ClipOptions = { noLoopFrame: true, cheapCuts: true };
const CLIP_SECONDS = 6;
/** A cartoon cut into clips (Esc skips within a few seconds), its files on the disk, its entries for a list. */
const reel = (name: string, fli: Uint8Array) => {
  const clips = fliClips(name, fli, CLIP_SECONDS, CLIPS);
  for (const [n, b] of Object.entries(clips)) disk.put(n, b);
  return clipEntries(clips, 0);
};
// One monster set serves every scene whose options agree with it: Oil's Well's timings (no
// other scene places a Squeak or a drop) and the cups' first shuffle. Later rounds keep their own.
const CAST_MONS = { ...LEVELS.find((l) => l.file === 'oil')!.mons, ...LEVELS.find((l) => l.file === 'cups1')!.mons };
const fitsCast = (l: (typeof LEVELS)[number]) =>
  Object.entries(l.mons).every(([k, v]) => JSON.stringify(v) === JSON.stringify(CAST_MONS[k as keyof typeof CAST_MONS]));
const monOf = (l: (typeof LEVELS)[number]) => (fitsCast(l) ? 'cast.mon' : `${l.file}.mon`);
disk.put('cast.mon', serializeMonsters(buildMonsters(mb, CAST_MONS)));
const opening = reel('opening.fli', openingReel().fli(SPEED));
const unshrink = reel('unshrnk.fli', unshrinkReel().fli(SPEED));

// Scenes: 0 title/menu, 1 the ending (won or lost), then the levels' scenes in order.
const game = newGame('TUNE-UP');
const built = LEVELS.map((l) => {
  const pal = buildPalette(l.theme);
  const kit = l.blocks(pal);
  const level = l.build(kit.book);
  return { l, pal, kit, bbl: kit.book.finish(), ...level };
});
// scenes drawn in the same roles share one block set (src/blocks/shared.ts)
const shared = shareSets(built.map(({ l, bbl, m }) => ({ file: l.file, blocks: bbl, map: m.build() })));
for (const [name, blocks] of shared.sets) disk.put(name, serializeBlocks(blocks));
// a level's scenes share one map (src/levels/stacks.ts)
for (const [name, map] of stackMaps(shared.maps)) disk.put(name, serializeMap(map));
// a song is written once: scenes that truly share one share its file
const songFiles = new Map<string, string>();
const putSong = (name: string, bytes: Uint8Array) => {
  const key = Buffer.from(bytes).toString('base64');
  const had = songFiles.get(key);
  if (had) return had;
  songFiles.set(key, name);
  disk.put(name, bytes);
  return name;
};
built.forEach(({ l, m, pal }, i) => {
  disk.put(`${l.file}.pal`, serializePalette(pal.pal));
  if (!fitsCast(l)) disk.put(`${l.file}.mon`, serializeMonsters(buildMonsters(mb, l.mons)));
  const song = putSong(`${l.file}.cmf`, l.song());
  const scene = emptyScene(ADVTYPE);
  scene.desc = l.part ? `${l.desc}, ${l.part}` : l.desc;
  scene.pos = { x: 60 + i * 60, y: 110 };
  // a one-screen level never scrolls; a wide one scrolls side to side only
  const side = l.wide ? 0xff : 0;
  scene.scroll = { up: 0, down: 0, left: side, right: side, style: 0, xtra: new Uint8Array(11) };
  // before a level: (the opening,) the Hat Sting with the level's tool, and Doc Leo and the chicken's card
  let intro = '';
  if (firstOfLevel(i)) {
    intro = `lvl${l.level}.lst`;
    // two digits, so level 1's clips (sting012, sting013) aren't level 12's and 13's
    const sting = reel(`sting${String(l.level).padStart(2, '0')}.fli`, stingReel(l.level, TOOLS[l.level], l.desc.toUpperCase()).fli(SPEED));
    const before = (l.before ?? []).flatMap(cardEntries);
    disk.put(
      intro,
      serializeSlideList([...(l.level === 1 ? opening : []), ...(l.level === 14 ? unshrink : []), ...before, ...sting, ...cardEntries(`intro${l.level}`)]),
    );
  }
  // after it (or a verse): their card, is it fixed?
  const exit = OUTRO[l.file] ? `${l.file}out.lst` : '';
  if (exit) disk.put(exit, serializeSlideList(cardEntries(`${l.file}out`)));
  scene.files = [
    `${l.file}.pal`,
    mapOf(l.file),
    bblOf(l.file),
    monOf(l),
    'cast.mbl',
    `${l.chr}.chr`,
    CBL[l.chr] ?? 'leo.cbl',
    `${l.snd}.snd`,
    song,
    intro,
    exit,
    ...new Array(9).fill(''),
  ];
  if (m.links.length > MAXSCENELINKS) throw new Error(`${l.file}: too many links`);
  scene.links = Array.from({ length: MAXSCENELINKS }, (_, k) => {
    const spec = m.links[k];
    if (!spec) return { toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    const from = { x: spec.from[0], y: spec.from[1] + rowOffset(l.file) };
    const next = built[i + 1];
    if (spec.toScene === 'won' || !next) return { toScene: 1, from, to: { x: 0, y: 0 } };
    return { toScene: i + 3, from, to: { x: next.start[0], y: next.start[1] + rowOffset(next.l.file) } };
  });
  game.scenes.push(scene);
});

const menu = putSong('menu.cmf', menuSong());
const won = putSong('won.cmf', wonSong());
const lost = putSong('lost.cmf', lostSong());
const start = game.scenes[0];
start.files = [
  'title.lst',
  menu,
  'menu.gif',
  menu,
  'story.lst',
  menu,
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
end.files = ['won.lst', won, 'lost.lst', lost, ...new Array(16).fill('')];
disk.put('tuneup.gam', serializeGame(game));

// the pictures and words
for (const [name, bytes] of Object.entries(buildScreens())) disk.put(name, bytes);
const logo = fliClips(SANDLOGO, sandLogoFli(), CLIP_SECONDS, CLIPS);
for (const [n, b] of Object.entries(logo)) disk.put(n, b);
disk.put('title.lst', serializeSlideList([...clipEntries(logo, 0), { name: 'title.gif', pause: 10 }]));
disk.put('story.lst', serializeSlideList([{ name: 'storybg.gif', pause: 0 }, { name: 'story.txt' }]));
disk.put('howto.lst', serializeSlideList([{ name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]));
disk.put('credits.lst', serializeSlideList([{ name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]));
disk.put('demo.rec', demoRecording());
disk.put('won.lst', serializeSlideList([...reel('ending.fli', endingReel().fli(SPEED)), { name: 'won.gif', pause: 10 }]));
disk.put('lost.lst', serializeSlideList([{ name: 'lost.gif', pause: 6 }]));
disk.put('story.txt', STORY);
disk.put('howto.txt', INSTRUCTIONS);
disk.put('credits.txt', CREDITS);
disk.put('readme.txt', readme());
disk.put('license.txt', licenseText('Tune-Up'));
clipEveryList(disk.files, CLIP_SECONDS, CLIPS);
disk.write();
const usedIn = (blocks: Iterable<{ pixels: Uint8Array }>) => [...blocks].filter((b) => b.pixels.some(Boolean)).length;
console.log([...shared.sets].map(([name, blocks]) => `${name}: ${usedIn(blocks)} drawn blocks`).join(', ') + `; ${mb.index.size} monster blocks`);
