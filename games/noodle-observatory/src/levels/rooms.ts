// The fifteen rooms you play on foot, three to a chapter, each a PLAN (place.ts): what Nell meets from left to
// right. The parts, lenses, pads and place settings each go to a socket that takes only that shape; nothing can be
// skipped (each socket is in a full-height wall), and nothing hurts (a slip lands on the floor or a soft mat).
//   1 Cupboard Astronomy   hinges (three brackets; shelves that wobble and tip), drawers (a knob, a foot, a tube),
//                          scope (six parts, six sockets: the telescope)
//   3 Carry the Sky        softstep (lenses over gaps), lensrise (lenses up high), rimwalk (over padded pillars)
//   4 Shutter Constellation slitone (circle pads), slittwo (squares), slitend (triangles)
//   5 The Colander Has Other Plans   rattle, garden, roofrim (rattle tags, the colander rolling on ahead)
//   6 Supper Under the Window        setwest (plates), seteast (cups), moonmeal (mats)
import type { Pal } from '../../../kit/starter/palette';
import type { Icon, Place as PlaceName } from '../art';
import { dressRoom } from '../dress';
import { addSigns, startBook, type Level, type MonFile, type SignDefs } from '../level';
import { ROOF } from '../monsters';
import { CHANNELS } from '../nell';
import type { LookName } from '../palette';
import { paintRoom, type Decor, type Part, type Step } from '../place';
import type { SongName } from '../song';

interface RoomSpec {
  file: string;
  title: string;
  hint: string;
  look: LookName;
  place: PlaceName;
  song: SongName;
  mon?: MonFile;
  width: number;
  signs: SignDefs;
  plan: Step[];
  decor: Decor;
  tilt?: boolean;
  /** Which colander run (monsters.ts COLANDER_RUNS) rolls along the rail (row 4) at row 3. */
  colander?: number;
}

/** The column the colander starts from on its rail. */
export const COLANDER_FROM = 5;

const [C0, C1, C2, C3, C4, C5] = CHANNELS;
const P = (icon: Icon, ch: number, pad = false): Part => ({ icon, ch, ...(pad ? { pad } : {}) });
const at = (p: Part, x: number) => ({ ...p, x });

/** Every icon a plan uses, with its counter (sockets, parts and pads). */
function iconsOf(plan: Step[]): { parts: [Icon, number][]; pads: [Icon, number][] } {
  const parts = new Map<Icon, number>();
  const pads = new Map<Icon, number>();
  const note = (p?: Part) => {
    if (!p) return;
    (p.pad ? pads : parts).set(p.icon, p.ch);
  };
  for (const s of plan) {
    if (s.t === 'gate') parts.set(s.part.icon, s.part.ch);
    if (s.t === 'take' || s.t === 'pad') note(s.part);
    if (s.t === 'pocket') {
      note(s.part);
      note(s.up?.part);
    }
  }
  return { parts: [...parts], pads: [...pads] };
}

export function buildRoom(pal: Pal, r: RoomSpec): Level {
  const { parts, pads } = iconsOf(r.plan);
  const { book, timed } = startBook(pal, r.place, { parts, pads, tilt: r.tilt });
  const signs = addSigns(book, pal, r.signs);
  const map = paintRoom(book, r.width, r.plan, r.decor, r.place === 'roof', signs);
  dressRoom(map, r.place, r.width);
  if (r.colander !== undefined) map.mon(ROOF.colander[r.colander], COLANDER_FROM, 3);
  return { file: r.file, title: r.title, hint: r.hint, look: r.look, map, book, timed, mon: r.mon ?? 'kitchen', song: r.song, hero: 'nell', plan: r.plan };
}

const bracket = P('bracket', C0);
const knob = P('knob', C0);
const foot = P('foot', C1);
const tube = P('tube', C2);
const [sTube, sEye, sFinder, sCap, sLegs, sLens] = (['tube', 'eyepiece', 'finder', 'cap', 'legs', 'lens'] as Icon[]).map((ic, i) => P(ic, CHANNELS[i]));
const lens = P('lens', C0);
const circle = P('circle', C0, true);
const square = P('square', C0, true);
const triangle = P('triangle', C0, true);
const rattle = P('rattle', C0);
const plate = P('plate', C0);
const cup = P('cup', C0);
const mat = P('mat', C0);
void [C3, C4, C5];

export const ROOMS: Record<string, RoomSpec> = {
  hinges: {
    file: 'hinges',
    title: 'Wobbly Shelves',
    hint: 'Three brackets for the scope.',
    look: 'dusk',
    place: 'cupboard',
    song: 'theme',
    width: 52,
    tilt: true,
    signs: {
      brackets: ['THREE BRACKETS ARE UP ON THE SHELVES.', 4, 3],
      wobble: ['SHELVES WOBBLE, THEN TIP. WAIT TILL LEVEL.', 4, 3],
    },
    plan: [
      { t: 'sign', x: 3, key: 'brackets' },
      { t: 'pocket', ladder: 9, row: 6, to: 15, tilt: [11, 14], part: at(bracket, 15), washer: 12, back: 'ladder' },
      { t: 'sign', x: 17, key: 'wobble' },
      { t: 'pocket', ladder: 23, row: 5, to: 29, tilt: [25, 28], part: at(bracket, 29), washer: 26, back: 'drop' },
      { t: 'pocket', ladder: 33, row: 6, to: 38, up: { ladder: 37, row: 3, to: 41, part: at(bracket, 41), washer: 39 }, back: 'drop' },
      { t: 'gate', x: 43, part: bracket },
      { t: 'gate', x: 45, part: bracket },
      { t: 'gate', x: 47, part: bracket },
    ],
    decor: { lamps: [[13, 2]], windows: [[5, 2, true]] },
  },
  drawers: {
    file: 'drawers',
    title: 'Three Shapes',
    hint: 'A knob, a foot, a tube.',
    look: 'dusk',
    place: 'cupboard',
    song: 'theme',
    width: 50,
    signs: {
      shapes: ['A KNOB, A FOOT AND A TUBE. MATCH EACH SHAPE.', 4, 3],
      round: ['A ROUND MOON. AS ROUND AS A WINDOW.', 4, 3],
    },
    plan: [
      { t: 'sign', x: 3, key: 'shapes' },
      { t: 'pocket', ladder: 9, row: 3, to: 13, part: at(knob, 13), washer: 11, back: 'ladder' },
      { t: 'pocket', ladder: 17, row: 5, to: 22, part: at(foot, 22), back: 'ladder' },
      { t: 'pocket', ladder: 26, row: 4, to: 31, part: at(tube, 31), washer: 28, back: 'ladder' },
      { t: 'washer', x: 33 },
      { t: 'sign', x: 35, key: 'round' },
      { t: 'gate', x: 40, part: knob },
      { t: 'gate', x: 42, part: foot },
      { t: 'gate', x: 44, part: tube },
    ],
    decor: { lamps: [[23, 2]], windows: [[36, 2, true]] },
  },
  scope: {
    file: 'scope',
    title: 'Six Parts',
    hint: 'Build the telescope.',
    look: 'dusk',
    place: 'cupboard',
    song: 'theme',
    width: 60,
    signs: { six: ['SIX PARTS. SIX SOCKETS. ONE SCOPE.', 4, 3] },
    plan: [
      { t: 'sign', x: 3, key: 'six' },
      { t: 'pocket', ladder: 9, row: 6, to: 15, part: at(sTube, 11), up: { ladder: 14, row: 3, to: 18, part: at(sEye, 18), washer: 16 }, back: 'drop' },
      { t: 'pocket', ladder: 21, row: 5, to: 27, part: at(sFinder, 27), washer: 24, back: 'ladder' },
      { t: 'pocket', ladder: 31, row: 6, to: 37, part: at(sCap, 33), up: { ladder: 36, row: 3, to: 41, part: at(sLegs, 41), washer: 39 }, back: 'drop' },
      { t: 'pocket', ladder: 44, row: 4, to: 48, part: at(sLens, 48), back: 'drop' },
      { t: 'gate', x: 50, part: sTube },
      { t: 'gate', x: 51, part: sEye },
      { t: 'gate', x: 52, part: sFinder },
      { t: 'gate', x: 53, part: sCap },
      { t: 'gate', x: 54, part: sLegs },
      { t: 'gate', x: 55, part: sLens },
    ],
    decor: { lamps: [[25, 2]], windows: [[46, 1, true]] },
  },
  softstep: {
    file: 'softstep',
    title: 'Soft Steps',
    hint: 'One lens at a time.',
    look: 'evening',
    place: 'lens',
    song: 'glass',
    width: 56,
    signs: {
      one: ['ONE LENS AT A TIME. HOP THE GAPS.', 4, 2],
      soft: ['THE MAT IS SOFT. A SLIP ONLY MEANS A HOP.', 4, 3],
    },
    plan: [
      { t: 'sign', x: 3, key: 'one' },
      { t: 'take', x: 8, part: lens },
      { t: 'washer', x: 10 },
      { t: 'pit', x: 12, n: 2 },
      { t: 'pit', x: 16, n: 2 },
      { t: 'gate', x: 20, part: lens },
      { t: 'sign', x: 21, key: 'soft' },
      { t: 'take', x: 23, part: lens },
      { t: 'pit', x: 26, n: 2 },
      { t: 'washer', x: 30 },
      { t: 'pit', x: 31, n: 2 },
      { t: 'gate', x: 35, part: lens },
      { t: 'take', x: 38, part: lens },
      { t: 'pit', x: 40, n: 2 },
      { t: 'pit', x: 44, n: 2 },
      { t: 'washer', x: 48 },
      { t: 'gate', x: 50, part: lens },
    ],
    decor: {
      lamps: [
        [14, 2],
        [29, 2],
        [44, 2],
      ],
      windows: [[7, 2, true]],
    },
  },
  lensrise: {
    file: 'lensrise',
    title: 'Up High',
    hint: 'Climb, carry, climb.',
    look: 'evening',
    place: 'lens',
    song: 'glass',
    width: 53,
    signs: {
      high: ['THE LENSES ARE UP HIGH.', 4, 2],
      edge: ['THAT CRATER HAS A VERY STRAIGHT EDGE.', 4, 3],
    },
    plan: [
      { t: 'sign', x: 3, key: 'high' },
      { t: 'pocket', ladder: 8, row: 6, to: 13, part: at(lens, 13), washer: 10, back: 'drop' },
      { t: 'gate', x: 17, part: lens },
      { t: 'pocket', ladder: 20, row: 4, to: 25, part: at(lens, 25), washer: 22, back: 'drop' },
      { t: 'gate', x: 29, part: lens },
      { t: 'sign', x: 31, key: 'edge' },
      { t: 'pocket', ladder: 36, row: 6, to: 40, up: { ladder: 39, row: 3, to: 44, part: at(lens, 44), washer: 42 }, back: 'drop' },
      { t: 'gate', x: 47, part: lens },
    ],
    decor: {
      lamps: [
        [15, 2],
        [33, 2],
      ],
      windows: [[49, 2, true]],
    },
  },
  rimwalk: {
    file: 'rimwalk',
    title: 'Round the Pillars',
    hint: 'Over the padded pillars.',
    look: 'evening',
    place: 'lens',
    song: 'glass',
    width: 55,
    signs: { over: ['OVER THE PILLARS, ONE LENS AT A TIME.', 4, 3] },
    plan: [
      { t: 'sign', x: 3, key: 'over' },
      { t: 'take', x: 8, part: lens },
      { t: 'pocket', ladder: 11, row: 6, to: 15, pillar: [12, 14], washer: 13, back: 'drop' },
      { t: 'gate', x: 19, part: lens },
      { t: 'take', x: 22, part: lens },
      { t: 'pit', x: 24, n: 2 },
      { t: 'washer', x: 28 },
      { t: 'pocket', ladder: 29, row: 6, to: 33, pillar: [30, 32], back: 'drop' },
      { t: 'gate', x: 36, part: lens },
      { t: 'take', x: 39, part: lens },
      { t: 'pocket', ladder: 41, row: 6, to: 45, pillar: [42, 44], up: { ladder: 44, row: 3, to: 47, washer: 47 }, back: 'drop' },
      { t: 'gate', x: 49, part: lens },
    ],
    decor: {
      lamps: [
        [20, 2],
        [37, 2],
      ],
      windows: [[7, 2, true]],
    },
  },
  slitone: {
    file: 'slitone',
    title: 'Circle Pads',
    hint: 'Set the shutters.',
    look: 'dark',
    place: 'loft',
    song: 'glass',
    width: 50,
    signs: { circles: ['STEP ON THE CIRCLE PADS TO SET THE SHUTTERS.', 4, 3] },
    plan: [
      { t: 'sign', x: 3, key: 'circles' },
      { t: 'pocket', ladder: 9, row: 7, to: 14, part: at(circle, 14), washer: 11, back: 'drop' },
      { t: 'pocket', ladder: 19, row: 5, to: 25, part: at(circle, 25), back: 'ladder' },
      { t: 'washer', x: 28 },
      { t: 'pocket', ladder: 31, row: 4, to: 36, part: at(circle, 36), washer: 33, back: 'drop' },
      { t: 'gate', x: 40, part: P('circle', C0) },
      { t: 'gate', x: 42, part: P('circle', C0) },
      { t: 'gate', x: 44, part: P('circle', C0) },
    ],
    decor: {
      shafts: [
        [17, 1, 9, 1],
        [29, 1, 9, 0],
        [38, 1, 9, 2],
      ],
    },
  },
  slittwo: {
    file: 'slittwo',
    title: 'Square Pads',
    hint: 'Spoons of light?',
    look: 'dark',
    place: 'loft',
    song: 'glass',
    width: 52,
    signs: {
      squares: ['NOW THE SQUARE PADS.', 4, 2],
      spoons: ['THOSE SPOTS OF LIGHT LOOK LIKE SPOONS.', 4, 3],
    },
    plan: [
      { t: 'sign', x: 3, key: 'squares' },
      { t: 'take', x: 8, part: square },
      { t: 'washer', x: 10 },
      { t: 'pocket', ladder: 14, row: 3, to: 20, part: at(square, 20), washer: 17, back: 'ladder' },
      { t: 'sign', x: 23, key: 'spoons' },
      { t: 'pocket', ladder: 29, row: 7, to: 35, part: at(square, 35), washer: 32, back: 'drop' },
      { t: 'gate', x: 39, part: P('square', C0) },
      { t: 'gate', x: 41, part: P('square', C0) },
      { t: 'gate', x: 43, part: P('square', C0) },
    ],
    decor: {
      shafts: [
        [12, 1, 9, 2],
        [27, 1, 9, 1],
        [37, 1, 9, 0],
      ],
    },
  },
  slitend: {
    file: 'slitend',
    title: 'Triangle Pads',
    hint: 'The ninth shutter.',
    look: 'dark',
    place: 'loft',
    song: 'glass',
    width: 54,
    signs: {
      tri: ['LAST, THE PADS WITH THREE SIDES.', 4, 2],
      ninth: ['THE NINTH SHUTTER. LOOK UP!', 4, 2],
    },
    plan: [
      { t: 'sign', x: 3, key: 'tri' },
      { t: 'pocket', ladder: 8, row: 7, to: 12, up: { ladder: 11, row: 4, to: 15, part: at(triangle, 15), washer: 13 }, back: 'drop' },
      { t: 'washer', x: 18 },
      { t: 'pocket', ladder: 21, row: 4, to: 26, part: at(triangle, 26), back: 'drop' },
      { t: 'pocket', ladder: 31, row: 7, to: 36, part: at(triangle, 34), up: { ladder: 35, row: 4, to: 39, washer: 39 }, back: 'drop' },
      { t: 'gate', x: 42, part: P('triangle', C0) },
      { t: 'gate', x: 44, part: P('triangle', C0) },
      { t: 'gate', x: 46, part: P('triangle', C0) },
      { t: 'sign', x: 47, key: 'ninth' },
    ],
    decor: {
      shafts: [
        [17, 1, 9, 0],
        [29, 1, 9, 2],
        [40, 1, 9, 1],
      ],
    },
  },
  rattle: {
    file: 'rattle',
    colander: 0,
    title: 'Rattle Tags',
    hint: 'Follow that colander.',
    look: 'night',
    place: 'roof',
    song: 'orbit',
    mon: 'roof',
    width: 58,
    signs: {
      rolled: ['THE COLANDER ROLLED OUT ONTO THE ROOF!', 4, 3],
      tags: ['RATTLE TAGS OPEN THE GARDEN ARCHES.', 4, 3],
    },
    plan: [
      { t: 'sign', x: 3, key: 'rolled' },
      { t: 'take', x: 8, part: rattle },
      { t: 'washer', x: 10 },
      { t: 'planter', x: 12 },
      { t: 'washer', x: 15 },
      { t: 'pocket', ladder: 17, row: 6, to: 22, part: at(rattle, 22), washer: 19, back: 'drop' },
      { t: 'washer', x: 25 },
      { t: 'planter', x: 27 },
      { t: 'pocket', ladder: 30, row: 5, to: 36, part: at(rattle, 36), washer: 33, back: 'ladder' },
      { t: 'washer', x: 39 },
      { t: 'sign', x: 40, key: 'tags' },
      { t: 'gate', x: 45, part: rattle },
      { t: 'gate', x: 47, part: rattle },
      { t: 'gate', x: 49, part: rattle },
    ],
    decor: { rails: [[4, 4, 54]], moon: [26, 3] },
  },
  garden: {
    file: 'garden',
    colander: 1,
    title: 'The Roof Garden',
    hint: 'Low, high, low.',
    look: 'night',
    place: 'roof',
    song: 'orbit',
    mon: 'roof',
    width: 58,
    signs: {
      follow: ['FOLLOW THE RATTLE.', 4, 2],
      frame: ['THE MOON HAS A STRAIGHT FRAME?', 4, 2],
    },
    plan: [
      { t: 'sign', x: 3, key: 'follow' },
      { t: 'take', x: 8, part: rattle },
      { t: 'washer', x: 10 },
      { t: 'pocket', ladder: 13, row: 5, to: 20, part: at(rattle, 20), washer: 16, back: 'drop' },
      { t: 'washer', x: 23 },
      { t: 'planter', x: 25 },
      { t: 'washer', x: 28 },
      { t: 'pocket', ladder: 30, row: 6, to: 34, washer: 32, up: { ladder: 33, row: 3, to: 37, washer: 37 }, back: 'drop' },
      { t: 'take', x: 40, part: rattle },
      { t: 'sign', x: 42, key: 'frame' },
      { t: 'gate', x: 47, part: rattle },
      { t: 'gate', x: 49, part: rattle },
      { t: 'gate', x: 51, part: rattle },
    ],
    decor: { rails: [[4, 4, 54]], moon: [24, 3] },
  },
  roofrim: {
    file: 'roofrim',
    colander: 2,
    title: 'Three Terraces',
    hint: 'Where is it going?',
    look: 'night',
    place: 'roof',
    song: 'orbit',
    mon: 'roof',
    width: 58,
    signs: {
      three: ['THREE TERRACES. THREE TAGS.', 4, 2],
      cart: ['IT STOPPED BY THE SUPPER CART.', 4, 3],
    },
    plan: [
      { t: 'sign', x: 3, key: 'three' },
      { t: 'pocket', ladder: 8, row: 7, to: 13, part: at(rattle, 13), washer: 10, back: 'drop' },
      { t: 'washer', x: 16 },
      { t: 'planter', x: 18 },
      { t: 'pocket', ladder: 21, row: 6, to: 26, part: at(rattle, 26), washer: 23, back: 'drop' },
      { t: 'washer', x: 29 },
      { t: 'pocket', ladder: 32, row: 5, to: 38, part: at(rattle, 38), washer: 35, back: 'ladder' },
      { t: 'washer', x: 41 },
      { t: 'gate', x: 44, part: rattle },
      { t: 'gate', x: 46, part: rattle },
      { t: 'gate', x: 48, part: rattle },
      { t: 'sign', x: 49, key: 'cart' },
    ],
    decor: { rails: [[4, 4, 54]], moon: [29, 3] },
  },
  setwest: {
    file: 'setwest',
    title: 'Plates',
    hint: 'One plate at a time.',
    look: 'night',
    place: 'roof',
    song: 'supper',
    mon: 'roof',
    width: 52,
    signs: {
      supper: ['SUPPER ON THE ROOF. ONE PLATE AT A TIME.', 4, 3],
      view: ['WHAT A VIEW OF THE MOON.', 4, 2],
    },
    plan: [
      { t: 'sign', x: 3, key: 'supper' },
      { t: 'pocket', ladder: 8, row: 6, to: 13, part: at(plate, 13), washer: 10, back: 'drop' },
      { t: 'gate', x: 17, part: plate },
      { t: 'pocket', ladder: 20, row: 5, to: 25, part: at(plate, 25), back: 'ladder' },
      { t: 'washer', x: 27 },
      { t: 'gate', x: 30, part: plate },
      { t: 'planter', x: 33 },
      { t: 'take', x: 36, part: plate },
      { t: 'washer', x: 38 },
      { t: 'gate', x: 41, part: plate },
      { t: 'sign', x: 43, key: 'view' },
    ],
    decor: { moon: [31, 3] },
  },
  seteast: {
    file: 'seteast',
    title: 'Cups',
    hint: 'Now the cups.',
    look: 'night',
    place: 'roof',
    song: 'supper',
    mon: 'roof',
    width: 52,
    signs: {
      cups: ['NOW THE CUPS.', 4, 2],
      sill: ["THE MOON'S RIM LOOKS LIKE A SILL.", 4, 3],
    },
    plan: [
      { t: 'sign', x: 3, key: 'cups' },
      { t: 'pocket', ladder: 8, row: 7, to: 13, part: at(cup, 12), back: 'drop' },
      { t: 'gate', x: 17, part: cup },
      { t: 'pocket', ladder: 20, row: 4, to: 26, part: at(cup, 26), washer: 23, back: 'drop' },
      { t: 'gate', x: 30, part: cup },
      { t: 'washer', x: 32 },
      { t: 'pocket', ladder: 34, row: 6, to: 39, part: at(cup, 39), washer: 36, back: 'ladder' },
      { t: 'gate', x: 43, part: cup },
      { t: 'sign', x: 44, key: 'sill' },
    ],
    decor: { moon: [40, 3] },
  },
  moonmeal: {
    file: 'moonmeal',
    title: 'Mats',
    hint: 'Last, the mats.',
    look: 'night',
    place: 'roof',
    song: 'supper',
    mon: 'roof',
    width: 54,
    signs: {
      mats: ['LAST, THE MATS.', 4, 2],
      spot: ['SUPPER IS SET. NOW TO THE VIEWING SPOT.', 4, 3],
    },
    plan: [
      { t: 'sign', x: 3, key: 'mats' },
      { t: 'take', x: 8, part: mat },
      { t: 'washer', x: 10 },
      { t: 'gate', x: 13, part: mat },
      { t: 'pocket', ladder: 16, row: 6, to: 21, part: at(mat, 21), washer: 18, back: 'drop' },
      { t: 'gate', x: 25, part: mat },
      { t: 'pocket', ladder: 28, row: 5, to: 34, part: at(mat, 34), washer: 31, back: 'ladder' },
      { t: 'gate', x: 38, part: mat },
      { t: 'sign', x: 40, key: 'spot' },
    ],
    decor: { moon: [44, 3] },
  },
};
