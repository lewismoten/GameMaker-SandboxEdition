// SNOW.MBL / SNOW.MON and KID.CBL / KID.CHR / SLED.CHR: everything that moves.
import { newBlockSet, type Block } from '../../web/src/formats/blocks';
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../web/src/formats/monster';
import { emptyFrame, newCharacter, type Character, type Frame } from '../../web/src/formats/character';
import { Pixels } from '../kit/pixels';
import { blob, recolor, rotate, sprite } from './draw';
import { MON, SND, THROWSEQ } from './ids';
import type { Pal } from './pal';

const T = 255;

/** Keys for the ASCII sprites. */
function keyFor(pal: Pal, scheme: 'kid' | 'bully' = 'kid'): Record<string, number> {
  const c = pal.c;
  const bully = scheme === 'bully';
  return {
    k: c('ink', 0),
    K: c('ink', 1),
    p: c('snow', 6),
    h: bully ? c('jeans', 2) : c('coat', 3),
    H: bully ? c('jeans', 0) : c('coat', 1),
    s: c('skin', 2),
    S: c('skin', 1),
    e: c('ink', 0),
    r: c('hair', 1),
    g: bully ? c('grey', 3) : c('gold', 3),
    G: bully ? c('grey', 2) : c('gold', 1),
    c: bully ? c('pine', 3) : c('coat', 2),
    C: bully ? c('pine', 1) : c('coat', 1),
    m: bully ? c('grey', 2) : c('gold', 2),
    j: c('jeans', 2),
    J: c('jeans', 0),
    b: c('wood', 0),
    w: c('wood', 3),
    x: c('grey', 4),
    X: c('grey', 2),
    d: c('dog', 2),
    D: c('dog', 0),
    l: c('dog', 3),
    n: c('ink', 0),
    t: c('pink', 3),
    o: c('orange', 2),
    O: c('orange', 1),
    q: c('glow', 3),
    i: c('ice', 3),
    W: c('snow', 6),
  };
}

const HEAD_DOWN = ['........kpk', '.......khhhk', '......khhhhhk', '.....khhhhhhhk', '.....kHHHHHHHk', '.....ksssssssk', '.....ksesssesk', '.....kSsssssSk'];
const HEAD_BLINK = [...HEAD_DOWN.slice(0, 6), '.....ksksssksk', HEAD_DOWN[7]];
const HEAD_UP = [...HEAD_DOWN.slice(0, 5), '.....krrrrrrrk', '.....krrrrrrrk', '.....kSrrrrrSk'];
const BODY_FRONT = ['....kgggggggggk', '....kcGcccccccck', '...kccccccccccck', '...kcCcccccccCck', '...kmCcccccccCmk', '....kccccccccck', '....kCCCCCCCCCk'];
const BODY_BACK = ['....kgggggggggk', '....kcccccgccck', '...kccccccgccccck', '...kcCcccgcccCck', '...kmCcccccccCmk', '....kccccccccck', '....kCCCCCCCCCk'];
const LEGS_STAND = ['.....kjjjjjjjk', '.....kjjjkjjjk', '.....kjjk.kjjk', '.....kbbk.kbbk', '.....kkkk.kkkk'];
const LEGS_A = ['.....kjjjjjjjk', '.....kjjjkjjjk', '.....kbbk.kjjk', '......kk..kbbk', '..........kkkk'];
const LEGS_B = ['.....kjjjjjjjk', '.....kjjjkjjjk', '.....kjjk.kbbk', '.....kbbk..kk', '.....kkkk'];

const HEAD_SIDE = [
  '.........kpk',
  '........khhhk',
  '.......khhhhhk',
  '......khhhhhhhk',
  '......kHHHHHHHk',
  '......krrsssssk',
  '......krrssesssk',
  '......krssssssk',
];
const BODY_SIDE = ['......kgggggggk', '.....gGkcccccck', '......kccccccck', '......kcccccmck', '......kcccccmck', '......kccccccck', '......kCCCCCCCk'];
const LEGS_SIDE_A = ['......kjjjjjjjk', '.....kjjjk.kjjjk', '....kjjjk...kjjjk', '....kbbbk...kbbbbk', '....kkkk....kkkkk'];
const LEGS_SIDE_B = ['......kjjjjjjjk', '.......kjjjjjk', '.......kjjjjjk', '.......kbbbbbbk', '.......kkkkkkkk'];

function kidPic(rows: string[], key: Record<string, number>): Pixels {
  for (const r of rows) if (r.length > 20) throw new Error(`Sprite row too long: ${r}`);
  return sprite(rows, key, 20, 20, 0, 0);
}

/** Adds the shovel the kid always carries. */
function shovel(p: Pixels, pal: Pal, view: 'front' | 'side' | 'back'): Pixels {
  const c = pal.c;
  if (view === 'side') {
    p.line(9, 10, 16, 15, c('wood', 3)).line(9, 11, 16, 16, c('wood', 2));
    p.rect(15, 14, 4, 5, c('grey', 4)).rect(18, 14, 1, 5, c('grey', 2)).rect(15, 18, 4, 1, c('grey', 2));
  } else {
    const x = view === 'front' ? 16 : 3;
    p.rect(x, 4, 1, 12, c('wood', 3)).rect(x - 1, 3, 3, 1, c('wood', 1));
    p.rect(x - 1, 15, 3, 5, c('grey', 4)).rect(x - 1, 19, 3, 1, c('grey', 2));
  }
  return p;
}

export interface Book<T> {
  index: Map<string, number>;
  pics: Map<string, Pixels>;
  blocks: T[];
}

function makeBook(kind: 'mbl' | 'cbl') {
  const blocks: Block[] = newBlockSet(kind);
  const index = new Map<string, number>();
  const pics = new Map<string, Pixels>();
  const add = (name: string, pic: Pixels, attrs: Partial<Pick<Block, 'chHitPt' | 'effect' | 'eamt' | 'scorePts' | 'solid'>> = {}) => {
    const i = index.size;
    index.set(name, i);
    pics.set(name, pic);
    blocks[i].pixels = Uint8Array.from(pic.px);
    Object.assign(blocks[i], attrs);
    return i;
  };
  return { blocks, index, pics, add, n: (name: string) => index.get(name)! };
}

// ---------------------------------------------------------------- character blocks
export function buildCharBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const key = keyFor(pal);
  const front = (head: string[], legs: string[]) => shovel(kidPic([...head, ...BODY_FRONT, ...legs], key), pal, 'front');
  const back = (legs: string[]) => shovel(kidPic([...HEAD_UP, ...BODY_BACK, ...legs], key), pal, 'back');
  const side = (legs: string[]) => shovel(kidPic([...HEAD_SIDE, ...BODY_SIDE, ...legs], key), pal, 'side');
  book.add('down0', front(HEAD_DOWN, LEGS_STAND));
  book.add('down1', front(HEAD_DOWN, LEGS_A));
  book.add('down2', front(HEAD_DOWN, LEGS_B));
  book.add('blink', front(HEAD_BLINK, LEGS_STAND));
  book.add('up0', back(LEGS_STAND));
  book.add('up1', back(LEGS_A));
  book.add('up2', back(LEGS_B));
  book.add('side0', side(LEGS_SIDE_B));
  book.add('side1', side(LEGS_SIDE_A));
  // Throw: the arm comes up over the hat with a snowball.
  const wind = kidPic([...HEAD_DOWN, ...BODY_FRONT, ...LEGS_STAND], key);
  wind.rect(15, 3, 2, 8, pal.c('coat', 2)).rect(14, 3, 1, 8, pal.c('ink', 0)).rect(17, 3, 1, 8, pal.c('ink', 0));
  blob(wind, 16, 1.5, 2.5, 2, pal.r('snow'), 3, 6);
  book.add('windup', wind);
  const thrown = kidPic([...HEAD_DOWN, ...BODY_FRONT, ...LEGS_A], key);
  thrown.rect(15, 8, 4, 2, pal.c('coat', 2)).rect(18, 7, 2, 2, pal.c('gold', 2));
  book.add('throw', thrown);
  // Hurt: flash white and red.
  const down0 = book.pics.get('down0')!;
  const white = pal.c('snow', 6);
  book.add(
    'hurt',
    recolor(down0, (c) => (c === T ? T : c === pal.c('ink', 0) ? pal.c('coat', 1) : white)),
  );
  // Die: flat on your back in a snowdrift.
  const lying = rotate(rotate(rotate(down0)));
  const die0 = new Pixels(20, 20, T).blit(lying, 0, 2, T);
  book.add('die0', die0);
  const die1 = new Pixels(20, 20, T).blit(lying, 0, 4, T);
  blob(die1, 6, 16, 7, 4, pal.r('snow'), 3, 6);
  blob(die1, 15, 17, 6, 3, pal.r('snow'), 3, 6);
  for (const [x, y] of [
    [4, 4],
    [9, 2],
    [15, 5],
    [12, 1],
  ])
    die1.set(x, y, pal.c('gold', 3));
  book.add('die1', die1);

  // The sled: you sit on it facing down the hill.
  const sledBase = (lean: number, brake = false) => {
    const p = new Pixels(20, 20, T);
    const k = pal.c('ink', 0);
    // runners and deck
    p.rect(3 + lean, 6, 2, 13, k).rect(15 + lean, 6, 2, 13, k);
    p.rect(4 + lean, 5, 12, 13, pal.c('coat', 2)).rect(4 + lean, 5, 12, 1, pal.c('coat', 3));
    for (let y = 7; y < 17; y += 3) p.rect(5 + lean, y, 10, 1, pal.c('coat', 1));
    p.rect(3 + lean, 18, 14, 2, pal.c('wood', 1)).rect(4 + lean, 19, 12, 1, pal.c('gold', 2));
    // rider
    const rider = kidPic([...HEAD_DOWN, ...BODY_FRONT.slice(0, 4)], key);
    p.blit(rider, lean * 2 - 0, -1, T);
    if (brake) {
      p.rect(1, 13, 3, 4, pal.c('wood', 0)).rect(16, 13, 3, 4, pal.c('wood', 0));
      for (const [x, y] of [
        [0, 17],
        [2, 18],
        [18, 17],
        [19, 18],
      ])
        p.set(x, y, pal.c('snow', 6));
    }
    return p;
  };
  book.add('sled', sledBase(0));
  book.add('sledL', sledBase(-1));
  book.add('sledR', sledBase(1));
  book.add('sledBrake', sledBase(0, true));
  const crash = sledBase(0);
  const tumble = new Pixels(20, 20, T).blit(rotate(crash), 0, 0, T);
  blob(tumble, 10, 16, 9, 4, pal.r('snow'), 3, 6);
  book.add('sledCrash', tumble);
  book.add(
    'sledHurt',
    recolor(book.pics.get('sled')!, (c) => (c === T ? T : c === pal.c('ink', 0) ? pal.c('coat', 1) : white)),
  );
  return book;
}

// ---------------------------------------------------------------- monster blocks
export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const c = pal.c;
  const snow = pal.r('snow');
  const hurtBy = (hp: number) => ({ chHitPt: hp });

  // Snowballs: theirs hurt, yours don't touch you.
  const ball = (spin: number) => {
    const p = new Pixels(20, 20, T);
    blob(p, 10, 14, 3, 1, pal.r('ink'), 0, 1);
    p.disc(10, 10, 4.4, c('ink', 1));
    blob(p, 10, 10, 3.6, 3.6, snow, 2, 6);
    p.set(9 + spin, 8, c('snow', 6));
    return p;
  };
  book.add('ball0', ball(0), hurtBy(-5));
  book.add('ball1', ball(1), hurtBy(-5));
  book.add('myBall0', ball(0));
  book.add('myBall1', ball(1));
  const poof = (r: number) => {
    const p = new Pixels(20, 20, T);
    for (let a = 0; a < 8; a++) {
      const x = 10 + Math.cos(a * 0.8) * r;
      const y = 10 + Math.sin(a * 0.8) * r;
      blob(p, x, y, 1.8, 1.8, snow, 4, 6);
    }
    return p;
  };
  book.add('poof0', poof(3));
  book.add('poof1', poof(6));

  // Biscuit, the dog that wants to play.
  const dogKey = keyFor(pal);
  const DOG = [
    '............kk',
    '...........kDdk',
    '..........kdddddkk',
    '..k.......kddkdddddn',
    '.kdk......kddddddtk',
    '..kdk....krrrrdddk',
    '...kdkkkkkddddddk',
    '...kddddddddddddk',
    '...kdlddddddddddk',
    '...kdllllllldddk',
  ];
  dogKey.r = c('coat', 3);
  const dog = (legs: string[]) => sprite([...DOG, ...legs], dogKey, 20, 20, 0, 20 - DOG.length - legs.length);
  book.add('dog0', dog(['...kddkkkkkkkddk', '...kdk......kdk', '...kk.......kk']), hurtBy(-8));
  book.add('dog1', dog(['...kddkkkkkkkddk', '..kdk........kdk', '.kk..........kk']), hurtBy(-8));
  book.add('dogRun0', dog(['...kddkkkkkkkddk', '...kdk......kdk', '...kk.......kk']));
  book.add('dogRun1', dog(['...kddkkkkkkkddk', '..kdk........kdk', '.kk..........kk']));

  // Big Pete, the bully: green coat, blue beanie, no shovel.
  const bk = keyFor(pal, 'bully');
  const pete = (legs: string[]) => kidPic([...HEAD_DOWN, ...BODY_FRONT, ...legs], bk);
  book.add('bully0', pete(LEGS_A), hurtBy(-2));
  book.add('bully1', pete(LEGS_B), hurtBy(-2));
  const run = (legs: string[]) => kidPic([...HEAD_SIDE, ...BODY_SIDE, ...legs], bk);
  book.add('bullyRun0', run(LEGS_SIDE_A));
  book.add('bullyRun1', run(LEGS_SIDE_B));
  const cry = (k: number) => {
    const p = pete(LEGS_STAND);
    p.set(7, 7 + k, c('ice', 4))
      .set(11, 7 + k, c('ice', 4))
      .set(7, 8 + k, c('ice', 3))
      .set(11, 8 + k, c('ice', 3));
    p.rect(8, 7, 3, 1, c('ink', 0));
    return p;
  };
  book.add('bullyCry0', cry(0));
  book.add('bullyCry1', cry(1));

  // Snowplows and cars: two blocks each, drawn facing right (rear | front).
  const vehicle = (body: string, front: boolean, frame: number, plow: boolean) => {
    const p = new Pixels(20, 20, T);
    const k = c('ink', 0);
    const b = (s: number) => c(body, s);
    if (!front) {
      if (plow) {
        p.rect(0, 4, 20, 10, k).rect(1, 5, 18, 8, b(2)).rect(1, 5, 18, 2, b(3)).rect(1, 11, 18, 2, b(1));
        for (let x = 3; x < 18; x += 5) p.rect(x, 7, 1, 4, b(1));
        blob(p, 10, 4, 9, 2, snow, 3, 6);
        p.rect(0, 13, 20, 2, k);
      } else {
        p.rect(0, 8, 20, 6, k).rect(1, 9, 19, 4, b(2)).rect(1, 9, 19, 1, b(3));
        p.rect(8, 4, 12, 5, k).rect(9, 5, 11, 4, c('ice', 2)).rect(13, 5, 1, 4, k);
        p.rect(0, 10, 2, 2, c('coat', 3));
        blob(p, 14, 4, 6, 1.4, snow, 4, 6);
      }
      for (const x of [5, 15]) {
        blob(p, x, 16, 3.4, 3.4, pal.r('ink'), 0, 1);
        p.rect(x - 1, 15, 2, 2, c('grey', 3 + ((frame + x) % 2)));
      }
    } else {
      if (plow) {
        p.rect(0, 2, 11, 12, k).rect(1, 3, 9, 10, b(2)).rect(1, 3, 9, 2, b(3));
        p.rect(4, 4, 6, 5, c('ice', 3)).rect(4, 4, 6, 1, c('ice', 4));
        p.rect(10, 7, 4, 7, k).rect(10, 8, 3, 5, b(2));
        p.rect(2, 0, 4, 2, frame ? c('orange', 3) : c('orange', 0));
        if (frame) p.set(1, 0, c('orange', 2)).set(6, 0, c('orange', 2));
        // the blade, angled, with snow curling off it
        for (let y = 5; y < 20; y++) p.rect(14 + Math.floor((y - 5) / 5), y, 3, 1, y % 3 === 0 ? c('gold', 1) : c('gold', 3));
        p.rect(14, 5, 1, 15, k);
        for (const [x, y] of frame
          ? [
              [18, 7],
              [19, 11],
              [18, 15],
              [17, 3],
            ]
          : [
              [19, 6],
              [18, 10],
              [19, 14],
              [18, 2],
            ])
          blob(p, x, y, 1.5, 1.5, snow, 4, 6);
        blob(p, 6, 2, 5, 1.2, snow, 4, 6);
      } else {
        p.rect(0, 8, 17, 6, k).rect(0, 9, 16, 4, b(2)).rect(0, 9, 16, 1, b(3));
        p.rect(0, 4, 8, 5, k).rect(0, 5, 7, 4, c('ice', 2)).rect(3, 5, 1, 4, k);
        p.rect(15, 10, 2, 2, c('glow', 3));
        if (frame) p.rect(17, 9, 3, 4, c('glow', 1));
      }
      blob(p, 8, 16, 3.4, 3.4, pal.r('ink'), 0, 1);
      p.rect(7, 15, 2, 2, c('grey', 3 + frame));
    }
    return p;
  };
  for (const f of [0, 1]) {
    book.add(`plowRear${f}`, vehicle('orange', false, f, true), hurtBy(-6));
    book.add(`plowFront${f}`, vehicle('orange', true, f, true), hurtBy(-6));
  }
  for (const f of [0, 1]) {
    book.add(`carRear${f}`, vehicle('siding', false, f, false), hurtBy(-5));
    book.add(`carFront${f}`, vehicle('siding', true, f, false), hurtBy(-5));
  }

  // A runaway shopping cart.
  const cart = (f: number) => {
    const p = new Pixels(20, 20, T);
    const g = c('grey', 4);
    p.rect(2, 5, 15, 9, c('grey', 2));
    for (let x = 2; x < 17; x += 3) p.rect(x, 5, 1, 9, g);
    for (let y = 5; y < 14; y += 3) p.rect(2, y, 15, 1, g);
    p.line(17, 5, 19, 2, c('coat', 3)).rect(18, 1, 2, 2, c('coat', 3));
    p.rect(3, 14, 13, 1, g);
    for (const x of [4, 14]) p.rect(x, 15 + f, 2, 2, c('ink', 0));
    blob(p, 8, 5, 6, 1.5, snow, 4, 6);
    return p;
  };
  book.add('cart0', cart(0), hurtBy(-4));
  book.add('cart1', cart(1), hurtBy(-4));

  // Another kid on a toboggan, cutting across the hill.
  const sledder = (f: number) => {
    const p = new Pixels(20, 20, T);
    p.rect(1, 14, 17, 3, c('wood', 3)).rect(1, 17, 17, 1, c('wood', 0));
    p.rect(17, 11, 2, 4, c('wood', 3)).set(19, 10, c('wood', 3));
    p.rect(5, 6, 7, 8, c('pine', 3)).rect(5, 12, 9, 2, c('jeans', 2));
    p.rect(6, 1, 5, 5, c('skin', 2)).rect(6, 0, 5, 2, c('gold', 3)).set(9, 3, c('ink', 0));
    p.rect(11, 8, 4, 2, c('pine', 2));
    for (const [x, y] of f
      ? [
          [0, 12],
          [2, 10],
        ]
      : [
          [0, 14],
          [1, 11],
        ])
      blob(p, x, y, 1.5, 1.5, snow, 4, 6);
    return p;
  };
  book.add('sledder0', sledder(0), hurtBy(-5));
  book.add('sledder1', sledder(1), hurtBy(-5));

  // A cardinal hopping in the snow (scenery; touching it does nothing).
  const bird = (f: number) => {
    const p = new Pixels(20, 20, T);
    blob(p, 10, 13 - f, 4, 3, pal.r('coat'), 1, 3);
    blob(p, 13, 10 - f, 2.5, 2.5, pal.r('coat'), 1, 3);
    p.set(14, 8 - f, c('coat', 3))
      .set(14, 10 - f, c('ink', 0))
      .set(16, 10 - f, c('orange', 3))
      .set(15, 10 - f, c('orange', 3));
    p.rect(4, 12 - f, 3, 1, c('coat', 1));
    p.set(9, 16, c('ink', 0)).set(11, 16, c('ink', 0));
    return p;
  };
  book.add('bird0', bird(0));
  book.add('bird1', bird(1));
  return book;
}

// ---------------------------------------------------------------- monsters
const corner = (x: number, y: number, speed: number, orient = 0): March => ({ x, y, pic: speed, orient });

function mon(pics: [number, number][], o: Partial<Monster>, path: March[] = [], attack: March[] = []): Monster {
  const m = emptyMonster();
  m.used = 1;
  pics.forEach((p, i) => (m.pic[i] = p));
  Object.assign(m, o);
  path.forEach((c, i) => (m.march[0][i] = c));
  attack.forEach((c, i) => (m.march[1][i] = c));
  return m;
}

export interface MonsterOptions {
  /** Blocks a plow drives before turning around (each leg). */
  plowRun?: number;
  plow2Run?: number;
  carRun?: number;
  plowSpeed?: number;
  carSpeed?: number;
}

/**
 * The .MON file for a level. Vehicles are two monsters side by side; when a leg ends the
 * monster "dies" into its mirror twin, so the blade always leads. Each leg starts with a
 * zero-length corner because PLAYGAME aims a reborn monster with its parent's first corner.
 */
export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  set[MON.snowball] = mon(anim('ball0', 'ball1', 2), { power: 10, thru: 0, towards: 3, end: 34, newmon: MON.poof, upscore: 15 });
  set[MON.poof] = mon(anim('poof0', 'poof1', 2), { power: 100, thru: 0, end: 5 });
  set[MON.myBall] = mon(anim('myBall0', 'myBall1', 2), { power: 120, thru: 1, towards: 7, end: 18, newmon: MON.poof });
  // Biscuit wanders, runs at you when you're close, and bounds off happily after a hug.
  set[MON.dog] = mon(
    anim('dog0', 'dog1', 3),
    { power: 40, thru: 1, towards: 128, activate: 2, newmon: MON.dogRun, upscore: 50 },
    [],
    [corner(0, 0, 1), corner(0, 0, 3)],
  );
  set[MON.dogRun] = mon(anim('dogRun0', 'dogRun1', 2), { power: 100, thru: 0, towards: -5, end: 60 });
  set[MON.bully] = mon(
    anim('bully0', 'bully1', 4),
    { power: 110, thru: 1, towards: 128, activate: 2, newmon: MON.bullyCry, upscore: 150 },
    [],
    [corner(0, 0, 1), corner(0, 0, 2)],
  );
  // Pete is too big to bounce off you; only a snowball (power 120) makes him cry.
  set[MON.bullyRun] = mon(anim('bullyRun0', 'bullyRun1', 2), { power: 100, thru: 0, towards: -4, end: 70 });
  set[MON.bullyCry] = mon(anim('bullyCry0', 'bullyCry1', 6), { power: 100, thru: 0, end: 120 });

  const legs = (run: number, speed: number, names: [string, string], ids: [number, number, number, number]) => {
    const [ar, al, br, bl] = ids;
    const [rear, front] = names;
    // A is the left block, B the right. Going right: [rear][front]; going left: [front][rear], mirrored.
    set[ar] = mon(anim(`${rear}0`, `${rear}1`), { power: 200, thru: 0, end: -1, newmon: al }, [corner(0, 0, speed), corner(run, 0, speed, 0)]);
    set[al] = mon(anim(`${front}0`, `${front}1`), { power: 200, thru: 0, end: -1, newmon: ar }, [corner(0, 0, speed), corner(-run, 0, speed, 4)]);
    set[br] = mon(anim(`${front}0`, `${front}1`), { power: 200, thru: 0, end: -1, newmon: bl }, [corner(0, 0, speed), corner(run, 0, speed, 0)]);
    set[bl] = mon(anim(`${rear}0`, `${rear}1`), { power: 200, thru: 0, end: -1, newmon: br }, [corner(0, 0, speed), corner(-run, 0, speed, 4)]);
  };
  legs(o.plowRun ?? 30, o.plowSpeed ?? 4, ['plowRear', 'plowFront'], [MON.plowAR, MON.plowAL, MON.plowBR, MON.plowBL]);
  legs(o.plow2Run ?? 20, o.plowSpeed ?? 4, ['plowRear', 'plowFront'], [MON.plow2AR, MON.plow2AL, MON.plow2BR, MON.plow2BL]);
  legs(o.carRun ?? 30, o.carSpeed ?? 5, ['carRear', 'carFront'], [MON.carAR, MON.carAL, MON.carBR, MON.carBL]);
  set[MON.cart] = mon(anim('cart0', 'cart1', 3), { power: 150, thru: 1, towards: 64 * 2 });
  set[MON.sledder] = mon(anim('sledder0', 'sledder1', 3), { power: 150, thru: 0 }, [corner(7, 0, 3, 0), corner(0, 0, 3, 4)]);
  set[MON.cardinal] = mon(
    [
      [n('bird0'), 20],
      [n('bird1'), 2],
      [n('bird0'), 9],
      [n('bird1'), 2],
    ],
    { power: 100, thru: 0 },
    [corner(1, 0, 1, 0), corner(0, 0, 1, 4)],
  );
  return set;
}

// ---------------------------------------------------------------- characters
const KEY = { up: 0x4800, down: 0x5000, left: 0x4b00, right: 0x4d00, space: 0x3920 };
const JOY = { up: 1, right: 3, down: 5, left: 7, any: 9 };
const MIRROR = 0x40; // bottom block flipped left-right

type F = Partial<Frame> & { pic: number };
function frames(list: F[]): Frame[] {
  const out = Array.from({ length: 10 }, () => emptyFrame(true));
  list.forEach(
    (f, i) => (out[i] = { ...emptyFrame(), x: f.x ?? 0, y: f.y ?? 0, orient: f.orient ?? 0, pic1: f.pic1 ?? 50, pic2: f.pic2 ?? f.pic, pause: f.pause ?? 1 }),
  );
  return out;
}

export function buildKid(cb: ReturnType<typeof buildCharBlocks>, myBallMon: number): Character {
  const ch = newCharacter();
  const n = cb.n;
  const s = ch.sequences;
  const set = (i: number, list: F[], o: Partial<(typeof s)[0]> = {}) => {
    s[i].frames = frames(list);
    Object.assign(s[i], o);
  };
  set(0, [
    { pic: n('down0'), pause: 40 },
    { pic: n('blink'), pause: 2 },
    { pic: n('down0'), pause: 25 },
    { pic: n('blink'), pause: 2 },
  ]);
  set(
    1,
    [
      { pic: n('hurt'), pause: 2 },
      { pic: n('die0'), pause: 4 },
      { pic: n('die1'), pause: 6 },
      { pic: n('die1'), pause: 24 },
    ],
    { sound: SND.die },
  );
  set(
    2,
    [
      { pic: n('hurt'), pause: 1 },
      { pic: 50, pause: 1 },
      { pic: n('hurt'), pause: 1 },
      { pic: n('down0'), pause: 1 },
    ],
    { sound: SND.hurt },
  );
  const walk = (i: number, key: number, joy: number, dx: number, dy: number, pics: string[], orient = 0) =>
    set(
      i,
      pics.map((p) => ({ pic: n(p), x: dx, y: dy, orient })),
      { key, jstkMov: joy, jstkBut: 0 },
    );
  walk(5, KEY.up, JOY.up, 0, -4, ['up1', 'up0', 'up2', 'up0']);
  walk(6, KEY.down, JOY.down, 0, 4, ['down1', 'down0', 'down2', 'down0']);
  walk(7, KEY.left, JOY.left, -4, 0, ['side1', 'side0', 'side1', 'side0'], MIRROR);
  walk(8, KEY.right, JOY.right, 4, 0, ['side1', 'side0', 'side1', 'side0']);
  set(
    THROWSEQ,
    [
      { pic: n('windup'), pause: 2 },
      { pic: 0, pic1: myBallMon, pic2: 100, y: 20, pause: 0 },
      { pic: n('throw'), pause: 3 },
    ],
    { key: KEY.space, sound: SND.throw, norepeat: 1, ground: 1, jstkMov: JOY.any, jstkBut: 1 },
  );
  ch.meter[0] = 100; // hit points
  ch.meter[1] = 3; // lives
  ch.meter[3] = 1; // money: shown as meter - 1, so $0
  ch.meter[THROWSEQ] = 6; // snowballs in your pockets
  return ch;
}

export function buildSledder(cb: ReturnType<typeof buildCharBlocks>): Character {
  const ch = newCharacter();
  const n = cb.n;
  const s = ch.sequences;
  const set = (i: number, list: F[], o: Partial<(typeof s)[0]> = {}) => {
    s[i].frames = frames(list);
    Object.assign(s[i], o);
  };
  set(0, [{ pic: n('sled'), pause: 30 }]);
  set(
    1,
    [
      { pic: n('sledCrash'), pause: 6 },
      { pic: n('sledCrash'), pause: 30 },
    ],
    { sound: SND.die },
  );
  set(
    2,
    [
      { pic: n('sledCrash'), pause: 3 },
      { pic: n('sledHurt'), pause: 1 },
      { pic: n('sled'), pause: 1 },
      { pic: n('sledHurt'), pause: 1 },
    ],
    { sound: SND.hurt },
  );
  // Steering, braking and pushing all add momentum: the sled drifts and keeps its speed.
  const mo = { momentum: 1, jstkBut: 0 };
  set(5, [{ pic: n('sledBrake'), y: -1, pause: 2 }], { key: KEY.up, jstkMov: JOY.up, sound: SND.brake, ...mo });
  set(6, [{ pic: n('sled'), y: 1, pause: 2 }], { key: KEY.down, jstkMov: JOY.down, sound: SND.push, ...mo });
  set(
    7,
    [
      { pic: n('sledL'), x: -1, pause: 1 },
      { pic: n('sledL'), x: 0, pause: 1 },
    ],
    { key: KEY.left, jstkMov: JOY.left, ...mo },
  );
  set(
    8,
    [
      { pic: n('sledR'), x: 1, pause: 1 },
      { pic: n('sledR'), x: 0, pause: 1 },
    ],
    { key: KEY.right, jstkMov: JOY.right, ...mo },
  );
  ch.meter[0] = 100;
  ch.meter[1] = 3;
  ch.meter[3] = 1;
  return ch;
}
