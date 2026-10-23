// Every scene after the title and the ending, in the order the evening plays: the first
// intermission (out on the avenue, in through the castle door, a coffee, up to the stage), the
// first set's monologues, the next intermission, and so on; the last intermission's curtain is
// the bow.
import type { Monster } from '../../../web/src/formats/monster';
import type { Lighting, Ramp } from './art/pal';
import type { BlockBook } from './common/blocks';
import type { MapBuilder } from './common/maps';
import type { SpriteBook } from './common/sprites';
import { at } from './common/maps';
import type { Group, Monologue } from './groups/types';
import { HIVE_RAMPS, buildHiveBlocks } from './hive/blocks';
import { HIVE_H, HIVE_STAGE, HIVE_STREET, HIVE_W, buildHive } from './hive/map';
import { buildHiveSprites, hiveMonsters } from './hive/sprites';
import { work } from './groups/work';
import { errands } from './groups/errands';
import { home } from './groups/home';
import { outside } from './groups/outside';

export const HIVE_GROUP: Group = {
  id: 'hive',
  name: 'The Hive',
  ramps: HIVE_RAMPS,
  blocks: (book: BlockBook, pal) => buildHiveBlocks(book, pal),
  sprites: (book: SpriteBook, pal) => buildHiveSprites(book, pal),
  monologues: [],
};

/** The four sets, in the order they are performed. */
export const SETS: Group[] = [work, errands, home, outside];
export const GROUPS: Group[] = [HIVE_GROUP, ...SETS];

/** Which VOC each sound slot of a scene's .SND plays (sound/sounds.ts fills in the rest). */
export type SoundPlan = Partial<Record<'score' | 'spend' | 'line' | 'declaim' | 'hurt' | 'die' | 'kill' | 'gain', string>>;

export interface SceneDef {
  /** The scene's name (links name scenes by it). */
  name: string;
  /** Its own file names: the scene's .map and .mon, .pal, .snd. */
  file: string;
  mapFile: string;
  pal: string;
  snd: string;
  group: Group;
  desc: string;
  /** Its box in the integrator's world view. */
  pos: [number, number];
  light: Lighting | undefined;
  filler: string;
  legend?: Record<string, string>;
  build: (m: MapBuilder) => { start: [number, number]; size?: [number, number] };
  monsters: (set: Monster[], mb: SpriteBook) => void;
  song: string;
  sounds: SoundPlan;
  /** The level intro and exit graphics (slide lists). */
  intro?: string;
  exit?: string;
  /** The scene its 'next' links lead to ('won': the ending). */
  next?: string;
  /** The monologue's number (1..17), for its title card. */
  card?: number;
  view: [number, number];
  monologue?: Monologue;
}

const HIVE_LIGHT: Lighting = { sky: [[10, 8, 24], [70, 60, 110], [36, 30, 60]], mul: [1, 0.96, 0.9], add: [6, 2, 0] };

function intermission(k: number, set?: Group): SceneDef {
  return {
    name: `hive${k}`,
    file: `hive${k}`,
    mapFile: 'hive',
    pal: 'hive',
    snd: 'hive',
    group: HIVE_GROUP,
    desc: k === 1 ? 'The Hive, Oakland' : set ? `Intermission ${k - 1}` : 'The Curtain Call',
    pos: [20 + (k - 1) * 58, 30],
    light: HIVE_LIGHT,
    filler: 'under',
    build: (m) => {
      buildHive(m);
      return { start: k === 1 ? HIVE_STREET : HIVE_STAGE, size: [HIVE_W, HIVE_H] };
    },
    monsters: (set, mb) => hiveMonsters(set, mb),
    song: k === 1 ? 'hive' : k === 5 ? 'finale' : `inter${k - 1}`,
    sounds: { score: 'cheer', spend: 'curtain', line: 'snaps', declaim: 'alas' },
    intro: `inter${k}.lst`,
    view: [0, 0],
  };
}

let n = 0;
function monologue(group: Group, mono: Monologue, setIndex: number, i: number): SceneDef {
  n++;
  return {
    name: mono.file,
    file: mono.file,
    mapFile: mono.file,
    pal: mono.file,
    snd: mono.file,
    group,
    desc: mono.desc,
    pos: [20 + setIndex * 58, 60 + i * 26],
    light: mono.light,
    filler: mono.filler,
    legend: mono.legend,
    build: (m) => mono.build(m),
    monsters: (set, mb) => mono.monsters(set, mb),
    song: mono.song,
    sounds: { score: mono.clips.open, spend: mono.clips.punch, line: mono.clips.line, declaim: mono.clips.word },
    intro: `card${n}.lst`,
    exit: 'bravo.lst',
    card: n,
    view: mono.view,
    monologue: mono,
  };
}

export const SCENES: SceneDef[] = [];
SETS.forEach((g, s) => {
  SCENES.push(intermission(s + 1, g));
  g.monologues.forEach((mono, i) => SCENES.push(monologue(g, mono, s, i)));
});
SCENES.push(intermission(SETS.length + 1));
SCENES.forEach((d, i) => (d.next = SCENES[i + 1]?.name ?? 'won'));

export const MONOLOGUES = SCENES.filter((d) => d.monologue);
export { at, HIVE_W, HIVE_H };
export type { Ramp };
