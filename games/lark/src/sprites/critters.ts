// lark.mbl and each scene's .MON: the little lives about the place. Pigeons pecking round the
// square and the clock's pendulum are harmless (power 100, no effect when touched). Valentines
// tumbling about the lawn and Gwinn with the valentine box are caught by a touch (power 50: the
// touch pays, and they are gone, or Gwinn sits). The parade's clowns and carts never stop, and
// bumping into one winds Joe down a little. Nothing on the Long Road fights; nothing needs to.
import { Pixels } from '../../../kit/pixels';
import { CLEAR } from '../art/draw';
import { c } from '../art/pal';
import { BlockSet, Bestiary } from '../blocks/sets';
import { heart } from '../blocks/keepsakes';
import { SOLBOT } from '../../../../web/src/formats/blocks';
import { carlPic } from '../../../kit/carlCameo';
import { CTR, VALENTINES } from '../ids';
import { gwinnRun, gwinnSit } from './friends';

function pigeon(frame: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  const peck = frame === 1;
  p.disc(9, 13, 4, c('stone', 3)).disc(9, 12, 3, c('stone', 4));
  p.rect(6, 12, 4, 2, c('stone', 2));
  const hx = peck ? 13 : 12;
  const hy = peck ? 13 : 9;
  p.disc(hx, hy, 2, c('stone', 3)).set(hx + 1, hy - 1, O);
  p.set(hx + 2, hy, c('brass', 3));
  p.set(hx - 1, hy + 2, c('green', 3)).set(hx, hy + 2, c('purple', 3));
  p.rect(8, 17, 1, 2, c('red', 3)).rect(11, 17, 1, 2, c('red', 3));
  return p;
}

function bob(): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.rect(9, 0, 2, 10, c('brass', 1));
  p.disc(10, 13, 6, c('brass', 2)).disc(10, 13, 4.5, c('brass', 3)).disc(8, 11, 1.5, c('brass', 4));
  return p;
}

function rod(): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.rect(9, 0, 2, 20, c('brass', 1)).rect(9, 0, 1, 20, c('brass', 2));
  return p;
}

/** A paper valentine tumbling in the wind: frame 0/1 turns it edge-on. */
function valentine(frame: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  if (frame) {
    p.rect(6, 9, 9, 3, c('paper', 4)).rect(6, 9, 9, 1, c('red', 2));
    return p;
  }
  heart(p, 10, 10, 6, c('paper', 4));
  heart(p, 10, 10, 5, c('red', 2));
  p.set(8, 8, c('paper', 4)).set(9, 8, c('paper', 4));
  return p;
}

/** A Clown Club clown on a unicycle, waving; frame 0/1 turns the wheel. Faces right. */
function unicycle(frame: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  p.ring(10, 16, 3, O)
    .line(10, 13, 10, 19, frame ? c('stone', 3) : CLEAR)
    .line(7, 16, 13, 16, frame ? CLEAR : c('stone', 3));
  p.rect(9, 10, 2, 3, c('stone', 2));
  p.rect(7, 5, 6, 5, c('green', 2)).set(8, 6, c('yellow', 3)).set(11, 8, c('yellow', 3));
  p.disc(10, 3, 2.5, c('paper', 4)).set(11, 3, c('red', 3)).set(9, 2, O);
  p.rect(13, 3, 2, 3, c('green', 2));
  p.disc(7, 1, 1.5, c('red', 2)).disc(13, 1, 1.5, c('red', 2));
  return p;
}

/** A little drum cart the band pulls along, its drum painted with a heart. Faces right. */
function drumCart(frame: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.rect(2, 6, 14, 9, c('blue', 2)).frame(2, 6, 14, 9, c('ink', 0));
  p.disc(9, 10, 3.5, c('paper', 4));
  heart(p, 9, 10, 2, c('red', 3));
  p.line(16, 8, 19, 6, c('wood', 3));
  for (const x of [5, 13]) p.disc(x, 16, 2.5, c('ink', 0)).set(x, 16 - (frame ? 1 : 0), c('stone', 3));
  return p;
}

/** A cart of balloons, bobbing. Faces right. */
function balloonCart(frame: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const bob = frame ? 1 : 0;
  p.rect(4, 13, 12, 4, c('wood', 3)).frame(4, 13, 12, 4, c('ink', 0));
  for (const x of [6, 14]) p.disc(x, 18, 1.5, c('ink', 0));
  for (const [x, y, col] of [
    [6, 4, 'red'],
    [10, 2, 'yellow'],
    [14, 5, 'purple'],
  ] as const) {
    p.line(10, 13, x, y + 3 + bob, c('ink', 1));
    p.disc(x, y + bob, 2.5, c(col, 3)).set(x - 1, y - 1 + bob, c('paper', 4));
  }
  return p;
}

/** A moving platform: a steel pin-head (the music box) or a brass lift cage floor (the lighthouse), on the top of its block. */
function lift(kind: 'pin' | 'cage'): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const ramp = kind === 'pin' ? 'stone' : 'brass';
  p.rect(0, 0, 20, 6, c(ramp, 4)).rect(0, 0, 20, 1, c(ramp, 5)).rect(0, 5, 20, 1, c(ramp, 1));
  p.rect(8, 6, 4, 14, c(ramp, 2));
  if (kind === 'cage') for (const x of [1, 18]) p.rect(x, 6, 1, 6, c('brass', 2));
  return p;
}

/** Carl the fly, buzzing round the dark cove with his big red eyes: the way to follow. */
function carl(wing: number): Pixels {
  return carlPicture(wing);
}

/** Carl as the cove's lamp shows him (front view, wings up or down). */
export function carlPicture(wing = 0): Pixels {
  return carlPic(
    {
      ink: c('ink', 0),
      fly: [c('window', 0), c('window', 0), c('window', 1), c('window', 1), c('window', 2)],
      eye: [c('red', 2), c('red', 3), c('red', 4), c('yellow', 3)],
      wing: [c('paper', 2), c('paper', 3), c('paper', 4)],
      white: c('paper', 4),
      red: c('red', 3),
    },
    { view: 'front', wing, mood: 'smug' },
  );
}

export function critterBlocks(): BlockSet {
  const s = new BlockSet(100, true);
  s.add('pigeon0', pigeon(0));
  s.add('pigeon1', pigeon(1));
  s.add('bob', bob());
  s.add('rod', rod());
  s.add('valentine0', valentine(0), { effect: CTR.task, eamt: 1, score: 25 });
  s.add('valentine1', valentine(1), { effect: CTR.task, eamt: 1, score: 25 });
  s.add('gwinn0', gwinnRun(0), { effect: CTR.task, eamt: VALENTINES - LAWN_VALENTINES, score: 100 });
  s.add('gwinn1', gwinnRun(1), { effect: CTR.task, eamt: VALENTINES - LAWN_VALENTINES, score: 100 });
  s.add('gwinnSit', gwinnSit());
  // the parade: a bump winds Joe down a little (the first touch only: then it rolls on harmless)
  for (const f of [0, 1]) {
    s.add(`unicycle${f}`, unicycle(f), { hp: -BUMP });
    s.add(`drumCart${f}`, drumCart(f), { hp: -BUMP });
    s.add(`balloonCart${f}`, balloonCart(f), { hp: -BUMP });
    s.add(`unicycleOk${f}`, unicycle(f));
    s.add(`drumCartOk${f}`, drumCart(f));
    s.add(`balloonCartOk${f}`, balloonCart(f));
  }
  // platforms: solid underneath Joe (their bottom side, as PLAYGAME sees a monster), never on top
  s.add('liftPin', lift('pin'), { solid: SOLBOT });
  s.add('liftCage', lift('cage'), { solid: SOLBOT });
  s.add('carl0', carl(0));
  s.add('carl1', carl(1));
  return s;
}

/** Valentines blowing about the park's lawn (the rest are in the box Gwinn ran off with). */
export const LAWN_VALENTINES = 6;

/** The park: valentines tumbling about the lawn, and Gwinn, who runs away from Joe until she is cornered. */
export function parkCritters(mb: BlockSet): Bestiary {
  const b = new Bestiary(mb);
  // each valentine tumbles round a little loop of its own, slower than Joe walks
  b.add('valentine', {
    pics: [
      ['valentine0', 6],
      ['valentine1', 3],
    ],
    power: 50,
    end: 0,
    path: [
      [0, 0, 1],
      [2, 0, 1],
      [2, 1, 1],
      [0, 1, 1],
      [0, 0, 1],
    ],
  });
  b.add('gwinnSit', { pics: [['gwinnSit', 40]], power: 100, end: -2 });
  b.add('gwinn', {
    pics: [
      ['gwinn0', 3],
      ['gwinn1', 3],
    ],
    power: 50,
    towards: -1,
    end: 0,
    thru: true,
    becomes: 'gwinnSit',
  });
  return b;
}

/** The park's monster numbers, as parkCritters adds them (the bot looks them up). */
export const parkMonsters = { valentine: 0, gwinnSit: 1, gwinn: 2 } as const;

/** Each lane of the parade: its monster in street.mon, how often one comes out, and its pace (pixels a tick). */
export const FLOAT_LANES = [
  { mon: 0, every: 64, speed: 1, pic: 'unicycle' },
  { mon: 1, every: 46, speed: 2, pic: 'drumCart' },
  { mon: 2, every: 80, speed: 1, pic: 'balloonCart' },
  { mon: 3, every: 52, speed: 2, pic: 'unicycle' },
] as const;

/** How much wind a bump from the parade costs Joe. */
const BUMP = 2;

/** How far (blocks) each float travels before it turns off the street. */
export const FLOAT_RUN = 20;

/**
 * Main Street: the parade, lane by lane, each float born at the lane's west end. A float that
 * bumps Joe (power 90: the touch counts once) becomes its harmless copy, which rolls on east.
 */
export function streetCritters(mb: BlockSet): Bestiary {
  const b = new Bestiary(mb);
  const path = (speed: number): [number, number, number][] => [
    [0, 0, speed],
    [FLOAT_RUN, 0, speed],
  ];
  FLOAT_LANES.forEach((lane, k) =>
    b.add(
      `float${k}`,
      {
        pics: [
          [`${lane.pic}0`, 4],
          [`${lane.pic}1`, 4],
        ],
        power: 90,
        end: -1,
        path: path(lane.speed),
        becomes: `floatOk${k}`,
      },
      lane.mon,
    ),
  );
  FLOAT_LANES.forEach((lane, k) =>
    b.add(`floatOk${k}`, {
      pics: [
        [`${lane.pic}Ok0`, 4],
        [`${lane.pic}Ok1`, 4],
      ],
      power: 100,
      end: -1,
      path: path(lane.speed),
    }),
  );
  return b;
}
/** The square's pigeons: they wander, peck, and pay Joe no mind. */
export function squareCritters(mb: BlockSet): Bestiary {
  const b = new Bestiary(mb);
  b.add('pigeon', {
    pics: [
      ['pigeon0', 14],
      ['pigeon1', 4],
      ['pigeon0', 9],
      ['pigeon1', 3],
    ],
    power: 100,
    towards: 64,
    end: -2,
    thru: true,
  });
  return b;
}

/** The tower's pendulum: rod and bob, swinging slow across the middle of the shaft. */
export function towerCritters(mb: BlockSet): Bestiary {
  const b = new Bestiary(mb);
  const swing: [number, number, number, number?][] = [
    [0, 0, 1],
    [3, 0, 1],
    [0, 0, 1],
    [-3, 0, 1],
    [0, 0, 1],
  ];
  b.add('bob', { pics: [['bob', 50]], power: 100, end: -2, path: swing });
  b.add('rod', { pics: [['rod', 50]], power: 100, end: -2, path: swing });
  return b;
}

/** A lift that rises `rows` blocks from where it is placed and comes back down, for ever. */
function liftDef(pic: string, rows: number) {
  return {
    pics: [[pic, 50]] as [string, number][],
    power: 100,
    end: -2,
    path: [
      [0, 0, 2],
      [0, -rows, 2],
      [0, 0, 2],
    ] as [number, number, number][],
  };
}

/** How far the music box's pin lift rises (blocks). */
export const BOX_LIFT = 6;
/** How far the lighthouse's lift rises (blocks). */
export const LIGHTHOUSE_LIFT = 7;

/** Inside the music box: the pin lift. */
export function boxCritters(mb: BlockSet): Bestiary {
  const b = new Bestiary(mb);
  b.add('lift', liftDef('liftPin', BOX_LIFT));
  return b;
}

/** The lighthouse: its lift. */
export function lighthouseCritters(mb: BlockSet): Bestiary {
  const b = new Bestiary(mb);
  b.add('lift', liftDef('liftCage', LIGHTHOUSE_LIFT));
  return b;
}

/** The cove: Carl, buzzing a loop round the rocks (harmless; follow his eyes). */
export function coveCritters(mb: BlockSet, loop: [number, number][]): Bestiary {
  const b = new Bestiary(mb);
  b.add('carl', {
    pics: [
      ['carl0', 2],
      ['carl1', 2],
    ],
    power: 100,
    end: -2,
    path: [...loop.map(([x, y]) => [x, y, 2] as [number, number, number]), [0, 0, 2]],
  });
  return b;
}
