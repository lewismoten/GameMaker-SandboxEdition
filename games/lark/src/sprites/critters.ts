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
import { CTR, ROCKS, TOOL_MON, VALENTINES } from '../ids';
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
  // Lewie's street: the plow, and snow sliding off a roof (its shadow first)
  for (const f of [0, 1]) {
    s.add(`plow${f}`, plow(f), { hp: -BUMP });
    s.add(`plowOk${f}`, plow(f));
  }
  s.add('snowShadow', snowfall('shadow'));
  s.add('snowFall0', snowfall(0), { hp: -1 });
  s.add('snowFall1', snowfall(1), { hp: -1 });
  s.add('snowHeap', snowfall('heap'));
  // Will's pages, blowing about
  s.add('page0', page(0), { effect: CTR.task, eamt: 1, score: 50 });
  s.add('page1', page(1), { effect: CTR.task, eamt: 1, score: 50 });
  // the painted rocks, their circles, and a rock home waiting for a pat
  for (let k = 0; k < ROCKS; k++) {
    s.add(`rock${k}`, paintedRock(k, false));
    s.add(`rockPat${k}`, paintedRock(k, true), { effect: CTR.task, eamt: 1, score: 100 });
    s.add(`spot${k}`, spot(k));
  }
  // the fair: carousel horses (stand on the saddle), and Reggie floating off on a bunch of balloons
  s.add('horse', horse(0), { solid: SOLBOT });
  s.add('horse2', horse(1), { solid: SOLBOT });
  s.add('reggieFly0', reggieFly(0), { effect: CTR.task, eamt: 1, score: 200 });
  s.add('reggieFly1', reggieFly(1), { effect: CTR.task, eamt: 1, score: 200 });
  // the Smart Home's grumpy gadgets (cheered up, they smile), and the Big Grumble in its stages
  for (const f of [0, 1]) {
    s.add(`toaster${f}`, toaster(f, false), { hp: -BUMP });
    s.add(`toasterGlad${f}`, toaster(f, true));
    s.add(`vacuum${f}`, vacuum(f, false), { hp: -BUMP });
    s.add(`vacuumGlad${f}`, vacuum(f, true));
  }
  for (let k = 1; k <= 3; k++) s.add(`grumble${k}`, grumble(k), { hp: -1 });
  s.add('grumbleSteam0', grumbleSteam(0), { hp: -1 });
  s.add('grumbleSteam1', grumbleSteam(1), { hp: -1 });
  s.add('grumbleHappy', grumbleHappy(true), { effect: CTR.task, eamt: 1, score: 1000 });
  s.add('grumbleDone', grumbleHappy(false));
  // what Joe's drumstick throws
  s.add('boom0', boom(0));
  s.add('boom1', boom(1));
  return s;
}

/** Snow sliding off a roof onto a walk: first the shadow of it, then the snow coming down (two frames), then a little heap that melts away. */
function snowfall(state: 'shadow' | 0 | 1 | 'heap'): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  if (state === 'shadow') {
    p.disc(10, 12, 7, c('snow', 0));
    for (const [x, y] of [
      [5, 3],
      [12, 1],
      [9, 6],
    ])
      p.set(x, y, c('tin', 6));
    return p;
  }
  if (state === 'heap') {
    p.disc(7, 14, 3, c('snow', 3)).disc(12, 15, 3, c('snow', 4));
    return p;
  }
  const off = state ? 3 : 0;
  for (const [x, y] of [
    [5, 2],
    [12, 4],
    [8, 9],
    [14, 11],
    [6, 14],
  ])
    p.disc(x, y + off, 3, c('snow', 4)).set(x - 1, y + off - 1, c('tin', 6));
  return p;
}

/** The town's snowplow, from above, going east: an orange cab, a yellow light going round, the blade out front. */
function plow(frame: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  p.rect(1, 4, 12, 12, c('brass', 3)).frame(1, 4, 12, 12, O);
  p.rect(6, 6, 6, 8, c('blue', 2)).frame(6, 6, 6, 8, O);
  p.disc(9, 10, 1.5, frame ? c('yellow', 3) : c('brass', 2));
  // the blade, angled, snow curling off it
  p.line(15, 2, 18, 17, c('stone', 4)).line(14, 2, 17, 17, c('stone', 3));
  p.disc(18, frame ? 4 : 15, 1.5, c('snow', 4));
  for (const y of [3, 15]) p.rect(2, y, 4, 2, O).rect(9, y, 3, 2, O);
  return p;
}

/** One of Will's pages, blowing about: written all over, folded (frame 0) or flat and turning (1). */
function page(frame: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  if (frame) {
    p.rect(3, 7, 14, 6, c('paper', 4)).frame(3, 7, 14, 6, c('paper', 2));
    for (let x = 5; x < 15; x += 3) p.rect(x, 9, 2, 1, c('ink', 1));
    return p;
  }
  p.rect(5, 3, 10, 14, c('paper', 4)).frame(5, 3, 10, 14, c('paper', 2));
  for (let y = 5; y < 15; y += 2) p.rect(6, y, 7 - (y % 3), 1, c('ink', 1));
  p.line(11, 3, 14, 6, c('paper', 2));
  return p;
}

/** A painted rock, round and gray, with its picture on top (a sun, a flower, a star, a smile); waiting for a pat, it shines. */
function paintedRock(kind: number, shine: boolean): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const col = ['red', 'blue', 'green', 'purple'][kind];
  p.disc(10, 11, 7, c('ink', 0)).disc(10, 10, 7, c('stone', 2)).disc(9, 9, 6, c('stone', 3));
  const C = c(col, 3);
  if (kind === 0) {
    p.disc(10, 10, 2.5, c('yellow', 3));
    for (const [dx, dy] of [
      [0, -4],
      [0, 4],
      [-4, 0],
      [4, 0],
      [3, 3],
      [-3, -3],
      [3, -3],
      [-3, 3],
    ])
      p.set(10 + dx, 10 + dy, C);
  } else if (kind === 1) {
    for (const [dx, dy] of [
      [0, -2],
      [0, 2],
      [-2, 0],
      [2, 0],
    ])
      p.disc(10 + dx, 10 + dy, 1.5, C);
    p.disc(10, 10, 1, c('yellow', 3));
  } else if (kind === 2) {
    p.line(10, 5, 10, 15, C).line(5, 10, 15, 10, C).line(7, 7, 13, 13, C).line(13, 7, 7, 13, C);
  } else {
    p.set(8, 8, C).set(12, 8, C).line(7, 12, 13, 12, C).set(6, 11, C).set(14, 11, C);
  }
  if (shine) p.set(5, 4, c('paper', 4)).set(4, 5, c('paper', 4)).set(15, 4, c('paper', 4)).set(16, 3, c('yellow', 3));
  return p;
}

/** A rock's painted circle (drawn over the one on the ground, so a rolling rock knows it). */
function spot(kind: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const col = ['red', 'blue', 'green', 'purple'][kind];
  p.ring(10, 10, 8, c(col, 3)).ring(10, 10, 7, c(col, 2));
  return p;
}

/** A carousel horse on its brass pole, from the side, its saddle flat on top (that's where Joe stands). */
function horse(kind: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const coat = kind ? 'paper' : 'brass';
  p.rect(9, 0, 2, 20, c('brass', 3));
  p.rect(0, 0, 20, 3, c('red', 2)).rect(0, 0, 20, 1, c('red', 4));
  p.rect(2, 3, 14, 6, c(coat, 3)).frame(2, 3, 14, 6, c('ink', 0));
  p.rect(15, 0, 4, 6, c(coat, 3)).set(17, 1, c('ink', 0)).rect(15, 0, 1, 4, c('red', 3));
  for (const x of [3, 6, 12, 14]) p.rect(x, 9, 2, 6, c(coat, 2));
  p.rect(1, 4, 2, 5, c('purple', 3));
  return p;
}

/** Sir Reginald Cluckington III, floating off under a bunch of balloons (a heart-shaped one in the middle). */
function reggieFly(frame: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const bob = frame ? 1 : 0;
  for (const [x, col] of [
    [5, 'blue'],
    [15, 'yellow'],
  ] as const)
    p.line(10, 11, x, 4 + bob, c('ink', 1)).disc(x, 3 + bob, 2.5, c(col, 3));
  heart(p, 10, 3 + bob, 3, c('red', 3));
  p.line(10, 6, 10, 11, c('ink', 1));
  const Y = c('yellow', 3);
  p.rect(8, 12, 5, 5, Y).frame(8, 12, 5, 5, c('ink', 0)).rect(10, 10, 3, 3, Y).set(11, 11, c('ink', 0)).rect(13, 11, 2, 1, c('brass', 3));
  p.rect(10, 9, 2, 1, c('red', 3));
  p.rect(9, 17, 1, 2, c('brass', 2)).rect(11, 17, 1, 2, c('brass', 2));
  return p;
}

/** A toaster gone haywire in the storm, hopping along with a grumpy face and sparks (or cheered up, smiling, toast popping). */
function toaster(frame: number, glad: boolean): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  const y = frame ? 1 : 0;
  p.rect(3, 7 + y, 14, 11, c('stone', 4))
    .frame(3, 7 + y, 14, 11, O)
    .rect(4, 8 + y, 12, 2, c('stone', 5));
  p.rect(6, 5 + y, 3, 3, glad ? c('wood', 4) : c('ink', 1)).rect(11, 5 + y, 3, 3, glad ? c('wood', 4) : c('ink', 1));
  p.set(7, 12 + y, O).set(12, 12 + y, O);
  if (glad)
    p.rect(8, 15 + y, 4, 1, O)
      .set(7, 14 + y, O)
      .set(12, 14 + y, O);
  else {
    p.rect(8, 14 + y, 4, 1, O)
      .set(7, 15 + y, O)
      .set(12, 15 + y, O);
    p.line(6, 10 + y, 8, 11 + y, O).line(13, 10 + y, 11, 11 + y, O);
    p.set(1, 4 + frame * 3, c('yellow', 3))
      .set(18, 7 - frame * 3, c('yellow', 3))
      .set(2, 6, c('yellow', 2));
  }
  p.rect(17, 11 + y, 2, 2, c('stone', 3));
  return p;
}

/** A robot vacuum, low and round, in a grump (or purring along, pleased). */
function vacuum(frame: number, glad: boolean): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  p.rect(1, 12, 18, 7, c('stone', 2)).frame(1, 12, 18, 7, O).rect(2, 12, 16, 2, c('stone', 3));
  p.disc(10, 15, 2, glad ? c('green', 3) : c('red', 3));
  p.set(5, 15, O).set(15, 15, O);
  if (!glad) p.line(4, 13, 6, 14, O).line(16, 13, 14, 14, O);
  p.rect(frame ? 2 : 14, 19, 4, 1, c('ink', 1));
  return p;
}

/** The house's Big Grumble: the thermostat, its face a scowl that softens stage by stage (1, 2, 3). */
function grumble(stage: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  p.disc(10, 10, 9, O).disc(10, 10, 8, c('stone', 3)).disc(10, 10, 6, c('stone', 4));
  const red = c('red', 3);
  // brows: angry, cross, then only puzzled
  const tilt = 3 - stage;
  p.line(5, 6, 8, 6 + tilt, O).line(15, 6, 12, 6 + tilt, O);
  p.disc(7, 9, 1.2, red).disc(13, 9, 1.2, red);
  // the mouth: a deep frown that flattens
  const sag = 3 - stage;
  p.line(6, 14, 10, 14 - sag, O).line(14, 14, 10, 14 - sag, O);
  p.rect(9, 1, 2, 2, c('brass', 3));
  return p;
}

/** The Big Grumble letting off steam between stages: no getting through to it then. */
function grumbleSteam(frame: number): Pixels {
  const p = grumble(1);
  const f = frame ? 2 : 0;
  for (const [x, y] of [
    [3, 3],
    [16, 2],
    [2, 15],
    [17, 16],
  ])
    p.disc(x, y + f, 3, c('paper', 4)).disc(x + 1, y + f - 1, 1.5, c('paper', 3));
  return p;
}

/** The Big Grumble cheered right up: a big smile (pat it), and after, content. */
function grumbleHappy(shine: boolean): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  p.disc(10, 10, 9, O).disc(10, 10, 8, c('stone', 3)).disc(10, 10, 6, c('stone', 4));
  p.disc(7, 8, 1.2, c('green', 3)).disc(13, 8, 1.2, c('green', 3));
  p.line(6, 12, 10, 15, O).line(14, 12, 10, 15, O);
  if (shine) p.set(2, 2, c('yellow', 3)).set(17, 3, c('yellow', 3)).set(3, 17, c('yellow', 3));
  return p;
}

/** HELLO: the drum's boom, rings of sound with a little heart in the middle. */
function boom(frame: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.ring(10, 10, frame ? 8 : 6, c('yellow', 2)).ring(10, 10, frame ? 5 : 3, c('yellow', 3));
  heart(p, 10, 10, 2, c('red', 3));
  return p;
}

/**
 * Adds what Joe's drumstick throws to a scene's monster list, at the number HELLO fires (ids.ts
 * TOOL_MON), as strong as `power` (a scene can add a gentler one first).
 */
export function withTools(b: Bestiary, power = 150): Bestiary {
  if (b.has('hello')) return b;
  b.add(
    'hello',
    {
      pics: [
        ['boom0', 2],
        ['boom1', 2],
      ],
      power,
      towards: 7,
      end: 14,
      thru: true,
    },
    TOOL_MON.hello,
  );
  return b;
}

/** Valentines blowing about the park's lawn (the rest are in the box Gwinn ran off with). */
const LAWN_VALENTINES = 6;

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
const FLOAT_RUN = 20;

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
const BOX_LIFT = 6;
/** How far the lighthouse's lift rises (blocks). */
const LIGHTHOUSE_LIFT = 7;

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

/** How far (blocks) the plow drives along Lewie's street before it turns off. */
const PLOW_RUN = 38;

/** Lewie's street: the plow, born at the street's west end, and the snow off the roofs (sets/snow.ts SNOW_MON numbers them). */
export function snowCritters(mb: BlockSet): Bestiary {
  const b = new Bestiary(mb);
  b.add('plow', {
    pics: [
      ['plow0', 4],
      ['plow1', 4],
    ],
    power: 90,
    end: -1,
    path: [
      [0, 0, 2],
      [PLOW_RUN, 0, 2],
    ],
    becomes: 'plowOk',
  });
  b.add('plowOk', {
    pics: [
      ['plowOk0', 4],
      ['plowOk1', 4],
    ],
    power: 100,
    end: -1,
    path: [
      [0, 0, 2],
      [PLOW_RUN, 0, 2],
    ],
  });
  // the snow off a roof: its shadow (harmless, and not to be stepped through), then it comes down
  // (a touch costs a little wind, once), then a heap that melts
  b.add('snowfall', { pics: [['snowShadow', 50]], power: 100, end: 14, becomes: 'snowfallHit' });
  b.add('snowfallHit', {
    pics: [
      ['snowFall0', 3],
      ['snowFall1', 3],
    ],
    power: 90,
    end: 10,
    becomes: 'snowfallOk',
  });
  b.add('snowfallOk', { pics: [['snowHeap', 50]], power: 100, end: 12 });
  return b;
}

/** The Hive's floor: Will's pages going round under the ceiling fans, each its own loop (levels/hive.ts PAGE_LOOPS). */
export function hiveCritters(mb: BlockSet, loops: [number, number, number, number][]): Bestiary {
  const b = new Bestiary(mb);
  loops.forEach(([, , w, h], i) =>
    b.add(`page${i}`, {
      pics: [
        ['page0', 5],
        ['page1', 3],
      ],
      power: 50,
      end: 0,
      path: [
        [0, 0, 1],
        [w, 0, 1],
        [w, h, 1],
        [0, h, 1],
        [0, 0, 1],
      ],
    }),
  );
  return b;
}

/** How fast (pixels a tick) a painted rock rolls away from Joe. */
const ROLL = 3;

/**
 * The rock garden: each painted rock rolls away from Joe (stopping at walls), and when it rolls
 * into its circle it stops (the stronger circle beats it, and it becomes the rock at home, which
 * beats the circle in turn), shines (waiting for a pat: a touch counts it) and stays.
 */
export function gardenCritters(mb: BlockSet): Bestiary {
  const b = new Bestiary(mb);
  for (let k = 0; k < ROCKS; k++) {
    b.add(`rock${k}`, { pics: [[`rock${k}`, 50]], power: 100, towards: -ROLL, thru: true, end: 0, becomes: `home${k}` });
    b.add(`spot${k}`, { pics: [[`spot${k}`, 50]], power: 110, end: 0 });
    b.add(`home${k}`, { pics: [[`rock${k}`, 50]], power: 120, end: 3, becomes: `pat${k}` });
    b.add(`pat${k}`, {
      pics: [[`rockPat${k}`, 50]],
      power: 50,
      end: 0,
      becomes: `done${k}`,
    });
    b.add(`done${k}`, { pics: [[`rock${k}`, 50]], power: 100, end: -2 });
  }
  return b;
}

/** The rock garden's monster numbers, as gardenCritters adds them (five a rock). */
export const gardenMonsters = (k: number) => ({ rock: k * 5, spot: k * 5 + 1, home: k * 5 + 2, pat: k * 5 + 3, done: k * 5 + 4 });

/** How far (blocks) a carousel horse rises and falls. */
export const HORSE_RISE = 3;

/**
 * The fair: carousel horses going up and down on their poles, the A horses rising while the B
 * horses fall (each placed where its stroke starts), and Reggie, floating to and fro above the
 * carousel's canopy; a touch catches him (and the turnstile turns).
 */
export function fairCritters(mb: BlockSet, reggieRun: number): Bestiary {
  const b = new Bestiary(mb);
  const stroke = (dir: number): [number, number, number][] => [
    [0, 0, 1],
    [0, dir * HORSE_RISE, 1],
    [0, 0, 1],
  ];
  b.add('horseA', { pics: [['horse', 50]], power: 100, end: -2, path: stroke(-1) });
  b.add('horseB', { pics: [['horse2', 50]], power: 100, end: -2, path: stroke(1) });
  const reggie = 50;
  b.add('reggie', {
    pics: [
      ['reggieFly0', 6],
      ['reggieFly1', 6],
    ],
    power: reggie,
    end: 0,
    path: [
      [0, 0, 1],
      [reggieRun, 0, 1],
      [0, 0, 1],
    ],
  });
  // a HELLO here is no stronger than Reggie, so it passes through him (one that popped him
  // would leave the turnstile waiting for him for good)
  return withTools(b, reggie);
}

/** The fair's monster numbers. */
export const fairMonsters = { horseA: 0, horseB: 1, reggie: 2 } as const;

/** How long (ticks) the Big Grumble lets off steam after each HELLO: longer every time. */
const STEAM = [30, 50, 70];

/**
 * The Smart Home: grumpy gadgets patrolling (a bump winds Joe down a little and startles one out
 * of its grump; HELLO cheers one up from afar), and the Big Grumble, cheered up a stage at a
 * time: each HELLO that reaches it sets it letting off steam (no HELLO gets through then), and
 * after the steam it comes back a little less cross, until it is all smiles; a pat counts it.
 */
export function homeCritters(mb: BlockSet, runs: { toaster: number; vacuum: number }): Bestiary {
  const b = new Bestiary(mb);
  const pace = (run: number, speed: number): [number, number, number][] => [
    [0, 0, speed],
    [run, 0, speed],
    [0, 0, speed],
  ];
  b.add('toaster', {
    pics: [
      ['toaster0', 4],
      ['toaster1', 4],
    ],
    power: 90,
    end: 0,
    path: pace(runs.toaster, 1),
    becomes: 'toasterGlad',
  });
  b.add('toasterGlad', {
    pics: [
      ['toasterGlad0', 6],
      ['toasterGlad1', 6],
    ],
    power: 100,
    end: -2,
    path: pace(runs.toaster, 1),
  });
  b.add('vacuum', {
    pics: [
      ['vacuum0', 3],
      ['vacuum1', 3],
    ],
    power: 90,
    end: 0,
    path: pace(runs.vacuum, 2),
    becomes: 'vacuumGlad',
  });
  b.add('vacuumGlad', {
    pics: [
      ['vacuumGlad0', 5],
      ['vacuumGlad1', 5],
    ],
    power: 100,
    end: -2,
    path: pace(runs.vacuum, 2),
  });
  for (let k = 1; k <= 3; k++) {
    b.add(`grumble${k}`, { pics: [[`grumble${k}`, 50]], power: 120, end: 0, becomes: `steam${k}` });
    b.add(`steam${k}`, {
      pics: [
        ['grumbleSteam0', 4],
        ['grumbleSteam1', 4],
      ],
      power: 250,
      end: STEAM[k - 1],
      becomes: k < 3 ? `grumble${k + 1}` : 'happy',
    });
  }
  b.add('happy', { pics: [['grumbleHappy', 50]], power: 50, end: 0, becomes: 'content' });
  b.add('content', { pics: [['grumbleDone', 50]], power: 100, end: -2 });
  return b;
}

/** The Smart Home's monster numbers, as homeCritters adds them. */
export const homeMonsters = {
  toaster: 0,
  toasterGlad: 1,
  vacuum: 2,
  vacuumGlad: 3,
  grumble: (k: number) => 4 + (k - 1) * 2,
  steam: (k: number) => 5 + (k - 1) * 2,
  happy: 10,
  content: 11,
} as const;
