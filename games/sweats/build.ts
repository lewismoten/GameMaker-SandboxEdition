// SHAKESPEARE IN SWEATPANTS (The Bard of Bizarre, 1995): builds every file of the game into
// games/sweats/disk/.
//   cd web && npx vite-node ../games/sweats/build.ts
//
// An open-mic night at The Hive, the castle-front coffee house in Oakland: the poet performs
// seventeen monologues about overly dramatic boring events, in four sets, and each monologue is
// a scene of its own, played out as the epic he makes of it. Between the sets the intermissions
// are scenes on The Hive's own map: buy a coffee at the counter with the night's tips, and the
// curtain up on the stage lets him through with it.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { MAXSCENELINKS, newGame, emptyScene, serializeGame, ADVTYPE, NOSCENE, type Scene } from '../../web/src/formats/game';
import { serializeMap, type GameMap } from '../../web/src/formats/map';
import { newMonsterSet, serializeMonsters, type Monster } from '../../web/src/formats/monster';
import { serializePalette } from '../../web/src/formats/palette';
import { serializeSlideList } from '../../web/src/formats/graphicScripts';
import { serializeSoundSet } from '../../web/src/formats/sound';
import { Disk } from '../kit/disk';
import { licenseText } from '../kit/license';
import { buildPalette, type Lighting, type Pal } from './src/art/pal';
import { BlockBook } from './src/common/blocks';
import { buildPoet, commonMonsters } from './src/common/characters';
import { MapBuilder, type LinkSpec } from './src/levels/maps';
import { buildCharBlocks, commonSprites, makeBook, type SpriteBook } from './src/common/sprites';
import { demoRecording } from './src/demo';
import { GROUPS, HIVE_GROUP, SCENES, type SceneDef } from './src/scenes';
import { buildArt, type CardView } from './src/screens/art';
import { SONG_CREDIT } from './src/screens/text';
import { buildSongs } from './src/sound/song';
import { buildSoundSet, buildVocs } from './src/sound/sounds';
import type { Group } from './src/groups/types';
import { renderRegion } from '../snowbound/src/art/render';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

/** The registration fee the 1995 README asks (Game-Maker's 1994 license: shareware asks at least $5). */
export const PRICE = '$5';

/** A group's blocks and sprites, drawn in a palette. */
function blockSets(g: Group, pal: Pal) {
  const book = new BlockBook();
  g.blocks(book, pal);
  const mb: SpriteBook = makeBook('mbl');
  commonSprites(mb, pal);
  g.sprites(mb, pal);
  if (mb.index.size > 100) throw new Error(`${g.id}.mbl: ${mb.index.size} monster blocks (100 at most)`);
  return { book, bbl: book.finish(), mb };
}

const sets = new Map(GROUPS.map((g) => [g.id, blockSets(g, buildPalette(g.ramps))]));
for (const g of GROUPS) {
  const s = sets.get(g.id)!;
  disk.put(`${g.id}.bbl`, serializeBlocks(s.bbl));
  disk.put(`${g.id}.mbl`, serializeBlocks(s.mb.blocks));
}
const cb = buildCharBlocks(buildPalette(HIVE_GROUP.ramps));
disk.put('poet.cbl', serializeBlocks(cb.blocks));
disk.put('poet.chr', serializeCharacter(buildPoet(cb)));
for (const [name, voc] of Object.entries(buildVocs())) disk.put(`${name}.voc`, voc);
const songs = buildSongs();

function monsters(def: SceneDef, mb: SpriteBook): Monster[] {
  const set = newMonsterSet();
  commonMonsters(set, mb);
  def.monsters(set, mb);
  return set;
}

// Scenes: 0 title/menu, 1 game won/lost, then SCENES in order from 2.
const game = newGame('SWEATPANTS');
interface Built {
  def: SceneDef;
  map: GameMap;
  links: LinkSpec[];
  start: [number, number];
}
const built: Built[] = SCENES.map((def) => {
  const g = def.group;
  const s = sets.get(g.id)!;
  const m = new MapBuilder(s.book, def.filler, def.legend);
  const { start } = def.build(m);
  return { def, map: m.build(), links: m.links, start: [start[0] + 2, start[1] + 2] };
});
const sceneNo = (name: string) => {
  const i = SCENES.findIndex((d) => d.file === name || d.name === name);
  if (i < 0) throw new Error(`No scene ${name}`);
  return i + 2;
};
const cards: CardView[] = [];
const palettesDone = new Set<string>();
built.forEach(({ def, map, links }) => {
  const g = def.group;
  const s = sets.get(g.id)!;
  const pal = buildPalette(g.ramps, def.light as Lighting);
  if (!palettesDone.has(def.pal)) {
    palettesDone.add(def.pal);
    disk.put(`${def.pal}.pal`, serializePalette(pal.pal));
  }
  const mons = monsters(def, s.mb);
  if (!palettesDone.has(`map:${def.mapFile}`)) {
    palettesDone.add(`map:${def.mapFile}`);
    disk.put(`${def.mapFile}.map`, serializeMap(map));
    disk.put(`${def.mapFile}.mon`, serializeMonsters(mons));
  }
  disk.put(`${def.snd}.snd`, serializeSoundSet(buildSoundSet(def.sounds)));
  if (!songs[def.song]) throw new Error(`No song ${def.song}`);
  disk.put(`${def.song}.cmf`, songs[def.song]);
  if (def.card !== undefined) {
    const lit = blockSets(g, pal);
    const [vx, vy] = def.view;
    cards.push({ index: def.card, def, pal, map: renderRegion(map, lit.bbl, lit.mb.blocks, mons, vx + 2, vy + 2, 16, 6, []) });
  }
  const scene: Scene = emptyScene(ADVTYPE);
  scene.desc = def.desc.slice(0, 19);
  scene.pos = { x: def.pos[0], y: def.pos[1] };
  scene.files = [
    `${def.pal}.pal`,
    `${def.mapFile}.map`,
    `${g.id}.bbl`,
    `${def.mapFile}.mon`,
    `${g.id}.mbl`,
    'poet.chr',
    'poet.cbl',
    `${def.snd}.snd`,
    `${def.song}.cmf`,
    def.intro ?? '',
    def.exit ?? '',
    ...new Array(9).fill(''),
  ];
  if (links.length > MAXSCENELINKS) throw new Error(`${def.file}: too many links`);
  scene.links = Array.from({ length: MAXSCENELINKS }, (_, k) => {
    const spec = links[k];
    if (!spec) return { toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    const from = { x: spec.from[0], y: spec.from[1] };
    const target = spec.to === 'next' ? (def.next ?? 'won') : spec.to;
    if (target === 'won') return { toScene: 1, from, to: { x: 0, y: 0 } };
    const n = sceneNo(target);
    const there = built[n - 2];
    const to = spec.at ?? there.start;
    return { toScene: n, from, to: { x: to[0], y: to[1] } };
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
disk.put('sweats.gam', serializeGame(game));

// the pictures, cartoons, text pages and slide lists
for (const [name, bytes] of Object.entries(buildArt({ cards, poet: cb.pics, mons: sets.get(HIVE_GROUP.id)!.mb.pics }))) disk.put(name, bytes);
for (const name of ['title', 'menu', 'story', 'won', 'lost']) disk.put(`${name}.cmf`, songs[name]);
disk.put('demo.rec', demoRecording());
// the voice clips cut from the free-plan Riffusion recordings: personal, non-commercial only (kit/license.ts)
const RECORDED_VOCS = [
  'ants_l',
  'ants_o',
  'ants_p',
  'ants_w',
  'bird_l',
  'bird_o',
  'bird_p',
  'bird_w',
  'blnkt_l',
  'blnkt_o',
  'blnkt_p',
  'blnkt_w',
  'cart_l',
  'cart_o',
  'cart_p',
  'cart_w',
  'chair_l',
  'chair_o',
  'chair_p',
  'chair_w',
  'ficus_l',
  'ficus_o',
  'ficus_p',
  'ficus_w',
  'goat_l',
  'goat_o',
  'goat_p',
  'goat_w',
  'itch_l',
  'itch_o',
  'itch_p',
  'itch_w',
  'kale_l',
  'kale_o',
  'kale_p',
  'kale_w',
  'like_l',
  'like_o',
  'like_p',
  'like_w',
  'lily_l',
  'lily_o',
  'lily_p',
  'lily_w',
  'out_l',
  'out_o',
  'out_p',
  'out_w',
  'pen_l',
  'pen_o',
  'pen_p',
  'pen_w',
  'pizza_l',
  'pizza_o',
  'pizza_p',
  'pizza_w',
  'plate_l',
  'plate_o',
  'plate_p',
  'plate_w',
  'socks_l',
  'socks_o',
  'socks_p',
  'socks_w',
  'umbr_l',
  'umbr_o',
  'umbr_p',
  'umbr_w',
];
disk.put(
  'license.txt',
  licenseText(
    'Shakespeare in Sweatpants',
    `The Bard of Bizarre's 1995 shareware notice, its fee and its address are part of the story: there is nothing to pay. The monologues are The Bard of Bizarre's (Lewis Moten's): ${SONG_CREDIT}.`,
    RECORDED_VOCS,
  ),
);
disk.write();
for (const g of GROUPS) {
  const s = sets.get(g.id)!;
  console.log(`${g.id}: ${s.book.index.size} background blocks, ${s.mb.index.size} monster blocks`);
}
console.log(`${cb.index.size} character blocks, ${game.scenes.length} scenes`);
void serializeSlideList;
