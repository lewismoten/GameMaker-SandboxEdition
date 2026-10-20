// The two background block sets: EARTH.BBL (the suburbs, the Skyway, the mall and the
// phone exchange) and MOON.BBL (the Moon and the Moon School). Both share the items,
// the phone booths, the laser fences and the moving walkways.
import { Pixels, rng } from '../kit/pixels';
import { BlockSet, SOLID, type BlockDef } from './book';
import { T, blob, gradient, oval, shadeAt, speckle } from './draw';
import { FLOORS } from './floors';
import { micro } from './font';
import { CTR, MON, PAGES_NEEDED } from './ids';
import { ITEM_PICS, type ItemName } from './items';
import { C, PAL } from './pal';
import { banner, billboard, crater, domeHome, neonSign, rocket, tiled } from './bigart';

const R = PAL.r;
type Floor = keyof typeof FLOORS;

/** Grav bits: 1 up, 2 right, 4 down, 8 left. */
export const GRAV = { up: 1, right: 2, down: 4, left: 8 } as const;

const blank = (c = 0) => new Pixels(20, 20, c);
const on = (floor: Floor, seed?: number) => FLOORS[floor](seed);
const over = (bg: Pixels, fg: Pixels) => bg.blit(fg, 0, 0, T);

/** What every item does when touched. */
const ITEM_DEFS: Record<ItemName, BlockDef> = {
  page: { effect: CTR.pages, eamt: 1, score: 100 },
  quarter: { effect: CTR.quarters, eamt: 1, score: 25 },
  pill: { hp: 30, score: 10 },
  battery: { effect: CTR.zap, eamt: 6, score: 10 },
  zapper: { effect: CTR.zap, eamt: 15, score: 250 },
  cola: { effect: CTR.lives, eamt: 1, score: 500 },
  remote: { effect: CTR.remote, eamt: 1, score: 100 },
  keycard: { effect: CTR.keycard, eamt: 1, score: 100 },
  pass: { effect: CTR.moonpass, eamt: 1, score: 100 },
  cover: { effect: CTR.cover, eamt: 1, score: 1000 },
};

// ------------------------------------------------------------------ shared pieces
function addFloors(set: BlockSet, floors: Floor[]): void {
  for (const f of floors) set.add(f, on(f));
}

function addItems(set: BlockSet, floor: Floor, items: ItemName[], suffix = floor as string): void {
  for (const it of items) set.add(`${it}_${suffix}`, over(on(floor, 7), ITEM_PICS[it]()), { ...ITEM_DEFS[it], touch: floor });
}

/** Phone booths: red roof with PHONE, glass doors. The working ones take a quarter and teleport you. */
function addBooths(set: BlockSet, floor: Floor): void {
  const top = on(floor);
  top.rect(2, 4, 16, 16, C('red', 1));
  top.rect(3, 2, 14, 4, C('red', 3)).rect(3, 2, 14, 1, C('red', 4));
  top.rect(0, 7, 20, 7, C('paper', 2));
  micro(top, 1, 8, 'PHONE', C('red', 2));
  top.rect(2, 15, 16, 5, C('red', 2));
  micro(top, 6, 15, '25¢', C('gold', 5));
  set.add('booth_top', top, { solid: SOLID });

  const door = (inside: (p: Pixels) => void, sign?: string) => {
    const p = on(floor);
    p.rect(2, 0, 16, 20, C('red', 2));
    p.rect(4, 1, 12, 18, C('glass', 1));
    inside(p);
    // Folding glass door panels.
    for (const x of [4, 10]) {
      p.rect(x, 1, 6, 18, C('glass', 1)).frame(x, 1, 6, 18, C('chrome', 5));
      p.line(x + 1, 3, x + 3, 6, C('glass', 3));
    }
    p.rect(2, 18, 16, 2, C('red', 1));
    if (sign) {
      p.rect(4, 7, 12, 6, C('paper', 2));
      micro(p, 5, 8, sign, C('red', 2));
    }
    return p;
  };
  const phone = (p: Pixels) => {
    p.rect(12, 4, 3, 5, C('grey', 1)).rect(12, 4, 1, 3, C('grey', 3));
  };
  set.add('booth_door', door(phone), { solid: SOLID, effect: CTR.quarters, eamt: -1, touch: 'booth_open' });
  set.add('booth_dead', door(phone, 'OUT'), { solid: SOLID });
  set.add('booth_ring', door(phone), { solid: SOLID, next: 'booth_ring2', ntime: 5 });
  const ring2 = door(phone);
  for (const [x, y] of [
    [11, 3],
    [16, 3],
    [11, 9],
    [16, 9],
  ])
    ring2.set(x, y, C('gold', 5));
  set.add('booth_ring2', ring2, { solid: SOLID, next: 'booth_ring', ntime: 12 });

  // An open booth crackling with teleporter sparkle.
  const open = (k: number) => {
    const p = on(floor);
    p.rect(2, 0, 16, 20, C('red', 2));
    for (let y = 1; y < 19; y++)
      for (let x = 4; x < 16; x++) p.set(x, y, shadeAt(R('teal'), 2, 5, ((y + k * 3) % 8) / 8 + (Math.abs(x - 9.5) < 2 ? 0.3 : 0), x, y));
    const r = rng(k + 3);
    for (let i = 0; i < 9; i++) p.set(4 + r() * 12, 1 + r() * 18, C('grey', 7));
    return p;
  };
  set.add('booth_open', open(0), { next: 'booth_open2', ntime: 2 });
  set.add('booth_open2', open(1), { next: 'booth_open', ntime: 2 });
}

/** A laser fence that blinks: walk through while it is off. */
function addLasers(set: BlockSet, floor: Floor, onTime: number, offTime: number): void {
  const post = (lit: boolean) => {
    const p = on(floor);
    p.rect(0, 2, 3, 16, C('chrome', 3)).rect(17, 2, 3, 16, C('chrome', 3));
    p.rect(0, 2, 3, 1, C('chrome', 6)).rect(17, 2, 3, 1, C('chrome', 6));
    p.rect(1, 4, 1, 2, lit ? C('red', 4) : C('green', 3)).rect(18, 4, 1, 2, lit ? C('red', 4) : C('green', 3));
    if (lit)
      for (const y of [6, 10, 14]) {
        p.rect(3, y, 14, 1, C('red', 4));
        p.rect(3, y - 1, 14, 1, C('red', 2)).rect(3, y + 1, 14, 1, C('red', 2));
        for (let x = 4; x < 17; x += 4) p.set(x + (y % 3), y, C('grey', 7));
      }
    return p;
  };
  set.add('laser', post(true), { hp: -3, next: 'laser_off', ntime: onTime });
  set.add('laser_off', post(false), { next: 'laser', ntime: offTime });
}

/** Moving walkways (gravity blocks), two animation frames each way. */
function addWalkways(set: BlockSet, style: 'walk' | 'tube'): void {
  const draw = (dir: keyof typeof GRAV, phase: number) => {
    const p = blank();
    const tube = style === 'tube';
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const across = dir === 'left' || dir === 'right' ? y : x;
        p.set(x, y, tube ? shadeAt(R('glass'), 0, 3, 1 - Math.abs(across - 9.5) / 10, x, y) : across < 2 || across > 17 ? C('chrome', 6) : C('asphalt', 1));
      }
    // Chevrons that crawl along.
    for (let k = 0; k < 2; k++) {
      const off = ((k * 10 + phase * 5) % 20) - 2;
      for (let i = 0; i < 5; i++) {
        const col = tube ? C('grey', 7) : C('gold', 4);
        const pts: [number, number][] = [
          [off + i, 5 + i],
          [off + i, 14 - i],
        ];
        for (const [a, b] of pts) {
          const [x, y] = dir === 'right' ? [a, b] : dir === 'left' ? [19 - a, b] : dir === 'down' ? [b, a] : [b, 19 - a];
          p.set(x, y, col);
        }
      }
    }
    return p;
  };
  for (const dir of ['right', 'left', 'up', 'down'] as const) {
    set.add(`${style}_${dir}`, draw(dir, 0), { grav: GRAV[dir], next: `${style}_${dir}2`, ntime: 2 });
    set.add(`${style}_${dir}2`, draw(dir, 1), { grav: GRAV[dir], next: `${style}_${dir}`, ntime: 2 });
  }
}

/** Adds every 20x20 piece of a big picture as name0, name1... (row by row). */
function addBig(set: BlockSet, name: string, pic: Pixels, def: (col: number, row: number) => BlockDef = () => ({ solid: SOLID })): void {
  const cols = pic.w / 20;
  const rows = pic.h / 20;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) set.add(`${name}${j * cols + i}`, pic.crop(i * 20, j * 20, 20, 20), def(i, j));
}

// ------------------------------------------------------------------ walls and things
function chromeFence(floor: Floor, dir: 'h' | 'v' | 'post'): Pixels {
  const p = on(floor);
  if (dir === 'h') {
    p.rect(0, 6, 20, 2, C('chrome', 6)).rect(0, 12, 20, 2, C('chrome', 4));
    for (let x = 2; x < 20; x += 6) p.rect(x, 3, 2, 14, C('chrome', 5)).rect(x, 3, 1, 14, C('chrome', 7)).rect(x, 16, 2, 2, C('grey', 1));
  } else if (dir === 'v') {
    p.rect(7, 0, 2, 20, C('chrome', 6)).rect(11, 0, 2, 20, C('chrome', 4));
    for (let y = 2; y < 20; y += 6) p.rect(6, y, 8, 2, C('chrome', 5));
  } else {
    p.rect(6, 2, 8, 15, C('chrome', 4)).rect(6, 2, 8, 2, C('chrome', 7)).rect(6, 16, 8, 2, C('grey', 1));
    p.disc(10, 3, 2, C('pink', 4));
  }
  return p;
}

function hedgeCube(floor: Floor): Pixels {
  const p = on(floor);
  // A hedge trimmed into a perfect cube by the robot gardener: bright top, shaded front.
  oval(p, 11, 18, 9, 2, C('grey', 1));
  p.rect(1, 1, 18, 17, C('green', 0));
  speckle(p, 2, 2, 16, 6, R('green'), 4, 1, 4, 0.5);
  speckle(p, 2, 8, 16, 9, R('green'), 1, 1, 5, 0.5);
  p.rect(2, 8, 16, 1, C('green', 5));
  for (const [x, y] of [
    [4, 11],
    [9, 13],
    [14, 10],
    [6, 15],
  ])
    p.set(x, y, C('green', 3));
  return p;
}

function chromeTree(floor: Floor): Pixels {
  const p = on(floor);
  oval(p, 11, 17, 7, 2, C('grey', 1));
  p.rect(9, 9, 2, 9, C('chrome', 3));
  // A perfect sphere of robot-trimmed leaves, and a chrome ring around it.
  blob(p, 10, 7, 7, 7, R('neon'), 0, 3);
  for (let a = 0; a < Math.PI * 2; a += 0.05) p.set(10 + Math.cos(a) * 8.5, 8 + Math.sin(a) * 2.5, Math.sin(a) > 0 ? C('chrome', 6) : C('chrome', 3));
  return p;
}

function mailbox(floor: Floor): Pixels {
  const p = on(floor);
  oval(p, 10, 17, 5, 1.5, C('grey', 1));
  p.rect(9, 9, 2, 8, C('chrome', 3));
  p.rect(4, 3, 12, 7, C('denim', 2)).rect(4, 3, 12, 2, C('denim', 4));
  p.rect(15, 1, 1, 5, C('red', 3)).rect(15, 1, 3, 2, C('red', 4));
  micro(p, 5, 6, 'FAX', C('paper', 2));
  return p;
}

function dish(floor: Floor): Pixels {
  const p = on(floor);
  oval(p, 10, 17, 7, 2, C('grey', 1));
  p.rect(9, 11, 2, 6, C('chrome', 2));
  for (let y = 2; y < 13; y++)
    for (let x = 2; x < 18; x++) {
      const nx = (x - 10) / 8;
      const ny = (y - 7) / 6;
      if (nx * nx + ny * ny <= 1) p.set(x, y, shadeAt(R('chrome'), 3, 7, 0.5 - nx * 0.4 + ny * 0.3, x, y));
    }
  p.line(10, 7, 14, 2, C('chrome', 1));
  p.disc(14, 2, 1, C('red', 4));
  return p;
}

function doghouse(floor: Floor): Pixels {
  const p = on(floor);
  for (let y = 2; y < 9; y++) p.rect(10 - (y - 1) * 1.3, y, (y - 1) * 2.6, 1, C('chrome', 4 + (y % 2)));
  p.rect(3, 9, 14, 9, C('sky', 3));
  oval(p, 10, 15, 3.5, 4, C('night', 0));
  p.rect(6, 17, 8, 1, C('night', 0));
  p.rect(4, 10, 12, 3, C('paper', 2));
  micro(p, 5, 10, 'SPRKY', C('denim', 1));
  return p;
}

function pool(phase: number): Pixels {
  const p = blank();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('sky'), 3, 6, 0.5 + 0.5 * Math.sin((x + y * 0.5 + phase * 3) / 3), x, y));
  for (let x = 0; x < 20; x += 5) p.set(x + phase, 6 + ((x / 5) % 2) * 7, C('grey', 7));
  return p;
}

function parkedCar(color: string): Pixels {
  const p = new Pixels(40, 20);
  tiled(p, () => on('road'));
  oval(p, 20, 17, 18, 2.5, C('grey', 1));
  // A flying car from above: swept body, bubble canopy, tail fins.
  for (let y = 3; y < 16; y++)
    for (let x = 2; x < 38; x++) {
      const nx = (x - 20) / 18;
      const ny = (y - 9.5) / 6.5;
      if (nx * nx * nx * nx + ny * ny <= 1) p.set(x, y, shadeAt(R(color), 1, 5, 0.6 - ny * 0.35, x, y));
    }
  oval(p, 17, 9, 7, 4.5, C('glass', 1));
  oval(p, 16, 8, 5, 3, C('glass', 3));
  p.line(13, 6, 16, 6, C('grey', 7));
  p.rect(34, 2, 4, 3, C(color, 2)).rect(34, 15, 4, 3, C(color, 2));
  p.rect(37, 7, 2, 6, C('orange', 4)).rect(38, 8, 2, 4, C('gold', 5));
  return p;
}

function mowerDock(floor: Floor, label = 'MOW'): Pixels {
  const p = on(floor);
  p.rect(3, 4, 14, 13, C('chrome', 2)).rect(3, 4, 14, 2, C('chrome', 5));
  p.rect(5, 8, 10, 7, C('night', 1));
  micro(p, 6, 9, label, C('neon', 3));
  p.rect(16, 6, 2, 2, C('red', 4));
  return p;
}

function paperCannon(floor: Floor): Pixels {
  const p = on(floor);
  oval(p, 10, 16, 7, 2, C('grey', 1));
  p.rect(5, 8, 10, 8, C('purple', 2)).rect(5, 8, 10, 2, C('purple', 4));
  p.rect(8, 13, 4, 7, C('grey', 1));
  micro(p, 6, 10, 'NEWS', C('paper', 2));
  return p;
}

/** Guardrail on the Skyway. */
function rail(dir: 'h' | 'v' | 'post', floor: Floor): Pixels {
  const p = on(floor);
  if (dir === 'h') {
    p.rect(0, 7, 20, 6, C('chrome', 5)).rect(0, 7, 20, 2, C('chrome', 7)).rect(0, 12, 20, 1, C('chrome', 2));
    for (let x = 1; x < 20; x += 5) p.rect(x, 9, 3, 2, C('red', 3));
  } else if (dir === 'v') {
    p.rect(7, 0, 6, 20, C('chrome', 5)).rect(7, 0, 2, 20, C('chrome', 7)).rect(12, 0, 1, 20, C('chrome', 2));
    for (let y = 1; y < 20; y += 5) p.rect(9, y, 2, 3, C('red', 3));
  } else {
    p.rect(5, 5, 10, 10, C('chrome', 4)).rect(5, 5, 10, 2, C('chrome', 7));
    p.disc(10, 10, 2, C('gold', 5));
  }
  return p;
}

function clouds(seed: number): Pixels {
  const p = blank();
  gradient(p, 0, 0, 20, 20, R('sky'), 4, 5);
  const r = rng(seed);
  for (let i = 0; i < 3; i++) blob(p, r() * 20, r() * 20, 3 + r() * 4, 2 + r() * 2, R('grey'), 5, 7);
  return p;
}

/** The mouth of a hover-car tunnel: cars come out of it. */
function tunnel(dir: 'R' | 'L'): Pixels {
  const p = blank();
  gradient(p, 0, 0, 20, 20, R('chrome'), 2, 5);
  oval(p, dir === 'R' ? 14 : 5, 10, 7, 8, C('night', 0));
  oval(p, dir === 'R' ? 14 : 5, 10, 5, 6, C('night', 1));
  for (let y = 2; y < 18; y += 3) p.set(dir === 'R' ? 3 : 16, y, C('gold', 5));
  return p;
}

function tollBot(floor: Floor): Pixels {
  const p = on(floor);
  oval(p, 10, 18, 7, 1.5, C('grey', 1));
  p.rect(5, 6, 10, 12, C('gold', 3)).rect(5, 6, 10, 2, C('gold', 5));
  blob(p, 10, 5, 5, 4, R('chrome'), 3, 7);
  p.rect(7, 4, 2, 2, C('red', 4)).rect(11, 4, 2, 2, C('red', 4));
  p.rect(7, 10, 6, 4, C('night', 1));
  micro(p, 7, 10, '25', C('neon', 3));
  return p;
}

function pillStand(floor: Floor, k: number): Pixels {
  const p = on(floor);
  p.rect(1, 3, 18, 15, C('pink', 2)).rect(1, 3, 18, 3, C('pink', 4));
  p.rect(1, 8, 18, 10, C('paper', 2));
  micro(p, 2, 9, k === 0 ? 'FOOD' : 'PILL', C('pink', 1));
  micro(p, 2, 13, k === 0 ? 'PILL' : 'DRIVE', C('denim', 1));
  return p;
}

// Mall pieces.
function mallWall(top: boolean): Pixels {
  const p = blank();
  if (top) {
    gradient(p, 0, 0, 20, 20, R('purple'), 3, 4);
    p.rect(0, 18, 20, 2, C('chrome', 6));
  } else {
    gradient(p, 0, 0, 20, 20, R('pink'), 4, 3);
    p.rect(0, 0, 20, 2, C('chrome', 6)).rect(0, 16, 20, 4, C('purple', 2));
    for (let x = 0; x < 20; x += 5) p.rect(x, 2, 1, 14, C('pink', 2));
  }
  return p;
}

/** A 1992 console TV: woodgrain cabinet, curved glass, rabbit ears. */
function crtTv(screen: number): Pixels {
  const p = blank(C('night', 0));
  p.rect(1, 3, 18, 16, C('wood', 2));
  for (let y = 4; y < 19; y += 3) p.rect(1, y, 18, 1, C('wood', 1));
  p.rect(2, 5, 12, 10, C('grey', 1));
  const sx = 3;
  const sy = 6;
  const sw = 10;
  const sh = 8;
  if (screen === 0) {
    const bars = ['grey', 'gold', 'teal', 'green', 'pink', 'red', 'denim'];
    for (let i = 0; i < sw; i++) p.rect(sx + i, sy, 1, sh - 2, C(bars[Math.floor((i * bars.length) / sw)], 4));
    p.rect(sx, sy + sh - 2, sw, 2, C('night', 2));
  } else if (screen === 1) {
    p.rect(sx, sy, sw, sh, C('sky', 5));
    // A cartoon: the Earth with a smile, of course.
    blob(p, 8, 10, 3, 3, R('green'), 1, 4);
    p.set(7, 10, C('grey', 0)).set(9, 10, C('grey', 0)).rect(7, 11, 3, 1, C('grey', 0));
  } else {
    const r = rng(screen * 7);
    for (let y = sy; y < sy + sh; y++) for (let x = sx; x < sx + sw; x++) p.set(x, y, C('grey', 2 + Math.floor(r() * 6)));
  }
  p.rect(15, 6, 3, 1, C('chrome', 4)).rect(15, 8, 3, 1, C('chrome', 4));
  p.disc(16, 12, 1, C('gold', 4));
  p.line(6, 3, 3, 0, C('chrome', 5)).line(10, 3, 13, 0, C('chrome', 5));
  return p;
}

function arcade(state: 'a' | 'b' | 'over' | 'tilt'): Pixels {
  const p = blank(C('night', 1));
  p.rect(2, 0, 16, 20, C('purple', 2));
  p.rect(2, 0, 16, 4, C('pink', 3));
  micro(p, 3, 0, state === 'tilt' ? 'TILT' : 'ZAP!', C('gold', 5));
  p.rect(4, 5, 12, 8, C('grey', 0));
  if (state === 'over') {
    micro(p, 3, 5, 'GAME', C('red', 4));
    micro(p, 3, 11, 'OVER', C('red', 4));
  } else {
    const r = rng(state === 'a' ? 3 : 4);
    for (let i = 0; i < 6; i++) p.set(5 + r() * 10, 6 + r() * 6, C('grey', 7));
    p.rect(7 + (state === 'a' ? 0 : 3), 10, 3, 2, C('neon', 3));
    p.rect(10 - (state === 'a' ? 0 : 2), 7, 2, 2, C('pink', 4));
  }
  p.rect(3, 14, 14, 4, C('chrome', 3));
  p.rect(6, 14, 1, 2, C('grey', 0)).disc(6, 14, 1, C('red', 4));
  p.disc(11, 16, 1, C('gold', 4)).disc(14, 16, 1, C('teal', 4));
  return p;
}

function pinball(part: 'top' | 'bottom', lit: number): Pixels {
  const p = blank(C('night', 1));
  if (part === 'top') {
    p.rect(1, 2, 18, 18, C('chrome', 2));
    gradient(p, 2, 3, 16, 14, R('sunset'), 3 + lit, 10);
    micro(p, 3, 4, '2000', C('grey', 7));
    for (let i = 0; i < 4; i++) p.set(4 + i * 4, 15, (i + lit) % 2 ? C('gold', 5) : C('red', 4));
  } else {
    p.rect(1, 0, 18, 20, C('chrome', 2));
    gradient(p, 2, 0, 16, 18, R('denim'), 2, 3);
    for (const [x, y, c] of [
      [6, 4, 'pink'],
      [13, 5, 'gold'],
      [9, 9, 'teal'],
    ] as const)
      p.disc(x, y, 2, C(c, 4)).set(x, y, C('grey', 7));
    p.line(4, 15, 8, 17, C('red', 4)).line(15, 15, 11, 17, C('red', 4));
    p.disc(10 + lit, 12, 1, C('chrome', 7));
    p.rect(2, 18, 16, 2, C('chrome', 1));
  }
  return p;
}

function fountain(k: number): Pixels {
  const p = blank();
  p.map((x, y) => FLOORS.tile().get(x, y));
  oval(p, 10, 11, 9, 8, C('chrome', 5));
  oval(p, 10, 11, 7.5, 6.5, C('sky', 4));
  for (let a = 0; a < 6; a++) {
    const t = a + k * 0.5;
    p.set(10 + Math.cos(t) * 4, 9 + Math.sin(t) * 3, C('grey', 7));
  }
  p.rect(9, 3, 2, 8, C('sky', 6))
    .set(10, 2 - k, C('grey', 7))
    .set(8 - k, 4, C('sky', 7))
    .set(12 + k, 4, C('sky', 7));
  return p;
}

function palm(floor: Floor): Pixels {
  const p = on(floor);
  oval(p, 10, 18, 6, 1.5, C('grey', 1));
  p.rect(6, 14, 8, 5, C('pink', 3)).rect(6, 14, 8, 1, C('pink', 5));
  p.line(10, 14, 9, 7, C('wood', 2)).line(11, 14, 10, 7, C('wood', 3));
  for (const [dx, dy] of [
    [-8, -2],
    [8, -2],
    [-6, -6],
    [6, -6],
    [0, -7],
  ])
    p.line(10, 7, 10 + dx, 7 + dy, C('green', 3)).line(10, 8, 10 + dx, 8 + dy + 1, C('green', 2));
  return p;
}

function foodTable(): Pixels {
  const p = on('tile');
  oval(p, 10, 16, 8, 2, C('grey', 2));
  oval(p, 10, 10, 8, 6, C('chrome', 6));
  oval(p, 10, 10, 6.5, 4.5, C('gold', 4));
  // Lunch in the year 2000: a single pill on a plate.
  oval(p, 7, 10, 2.5, 1.5, C('paper', 2));
  p.rect(6, 10, 3, 1, C('pink', 3));
  oval(p, 13, 9, 2.5, 1.5, C('paper', 2));
  p.rect(12, 9, 3, 1, C('teal', 4));
  return p;
}

function staffDoor(kind: 'keycard' | 'remote' | 'pass', floor: Floor): Pixels {
  const p = on(floor);
  const col = kind === 'keycard' ? 'pink' : kind === 'remote' ? 'gold' : 'purple';
  p.rect(0, 0, 20, 20, C(col, 1));
  for (let y = 1; y < 20; y += 3) p.rect(1, y, 18, 2, C(col, 3));
  p.rect(0, 5, 20, 12, C('paper', 2));
  micro(p, 1, 6, kind === 'keycard' ? 'STAFF' : kind === 'remote' ? 'GATE' : 'MOON', C(col, 1));
  micro(p, 1, 11, kind === 'keycard' ? 'ONLY' : kind === 'remote' ? 'CLICK' : 'PASS', C('denim', 1));
  p.rect(15, 14, 3, 3, C('red', 4));
  return p;
}

function switchboard(k: number): Pixels {
  const p = blank(C('wood', 1));
  p.rect(1, 1, 18, 14, C('night', 1));
  const r = rng(7);
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 6; x++) p.set(3 + x * 3, 3 + y * 3, r() < 0.5 !== (k === 1 && (x + y) % 2 === 0) ? C('gold', 5) : C('red', 2));
  p.rect(0, 15, 20, 5, C('wood', 2));
  for (let i = 0; i < 4; i++) p.line(3 + i * 4, 15, 6 + i * 3, 19, [C('red', 3), C('teal', 3), C('gold', 4), C('pink', 3)][i]);
  return p;
}

function exchangeWall(): Pixels {
  const p = blank();
  gradient(p, 0, 0, 20, 20, R('brick'), 1, 2);
  for (let y = 0; y < 20; y += 5) {
    p.rect(0, y, 20, 1, C('brick', 0));
    for (let x = (y / 5) % 2 ? 0 : 5; x < 20; x += 10) p.rect(x, y, 1, 5, C('brick', 0));
  }
  return p;
}

function flamingo(floor: Floor): Pixels {
  const p = on(floor);
  p.line(9, 12, 9, 18, C('grey', 2)).line(11, 12, 11, 18, C('grey', 2));
  oval(p, 10, 10, 5, 3, C('pink', 4));
  p.line(13, 9, 15, 3, C('pink', 4)).line(14, 9, 16, 3, C('pink', 3));
  p.disc(15, 3, 1.6, C('pink', 4));
  p.set(17, 3, C('grey', 0)).set(17, 4, C('grey', 0));
  return p;
}

function shuffleboard(): Pixels {
  const p = blank(C('teal', 3));
  p.rect(0, 0, 20, 1, C('paper', 2)).rect(0, 19, 20, 1, C('paper', 2));
  for (let y = 4; y < 16; y++) p.set(10 - (y - 4) / 2, y, C('paper', 2)).set(10 + (y - 4) / 2, y, C('paper', 2));
  micro(p, 8, 10, '10', C('paper', 2));
  return p;
}

function testPattern(): Pixels {
  const p = blank(C('grey', 3));
  const bars = ['grey', 'gold', 'teal', 'green', 'pink', 'red', 'denim'];
  for (let i = 0; i < 20; i++) p.rect(i, 0, 1, 14, C(bars[Math.floor((i * 7) / 20)], 4));
  p.rect(0, 14, 20, 6, C('grey', 1));
  p.rect(6, 15, 8, 4, C('grey', 6));
  return p;
}

function seaweed(): Pixels {
  const p = on('seafloor');
  for (const x0 of [5, 10, 15]) for (let y = 3; y < 19; y++) p.set(x0 + Math.sin(y / 2 + x0) * 2, y, C('green', 2 + (y % 2)));
  return p;
}

function coral(): Pixels {
  const p = on('seafloor');
  blob(p, 10, 12, 7, 6, R('pink'), 2, 5);
  for (const [x, y] of [
    [6, 9],
    [12, 7],
    [9, 13],
    [14, 12],
  ])
    p.disc(x, y, 1, C('pink', 0));
  return p;
}

function seaGlass(): Pixels {
  const p = blank();
  gradient(p, 0, 0, 20, 20, R('teal'), 1, 0);
  p.rect(0, 0, 20, 3, C('chrome', 5)).rect(0, 17, 20, 3, C('chrome', 3));
  for (let x = 0; x < 20; x += 6) p.line(x, 5, x + 3, 14, C('teal', 4));
  // A fish swims past outside.
  oval(p, 9, 10, 3, 1.5, C('gold', 4));
  p.set(12, 9, C('gold', 4)).set(12, 11, C('gold', 4)).set(7, 10, C('grey', 0));
  return p;
}

function fern(): Pixels {
  const p = on('jungle');
  for (let a = -1.2; a <= 1.2; a += 0.4) for (let t = 0; t < 9; t++) p.set(10 + Math.sin(a) * t, 18 - Math.cos(a) * t * 1.6, C('green', 2 + (t % 3)));
  return p;
}

function rockWall(ramp: string, seed: number): Pixels {
  const p = blank(C(ramp, 1));
  const r = rng(seed);
  for (let i = 0; i < 5; i++) blob(p, r() * 20, r() * 20, 4 + r() * 4, 3 + r() * 3, R(ramp), 1, 4);
  return p;
}

function tar(k: number): Pixels {
  const p = blank();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('night'), 0, 2, 0.5 + 0.5 * Math.sin((x * 0.7 + y + k * 4) / 2.5), x, y));
  p.disc(6 + k * 3, 8, 1.5, C('night', 3));
  return p;
}

function launchSign(): Pixels {
  const p = on('concrete');
  p.rect(1, 3, 18, 12, C('night', 0)).frame(1, 3, 18, 12, C('chrome', 5));
  micro(p, 3, 5, 'MOON', C('gold', 5));
  micro(p, 3, 10, '-> GO', C('neon', 3));
  p.rect(9, 15, 2, 4, C('chrome', 3));
  return p;
}

function boardRamp(): Pixels {
  const p = on('concrete');
  p.rect(2, 0, 16, 20, C('gold', 3));
  for (let y = 0; y < 20; y += 4) p.rect(2, y, 16, 2, C('grey', 1));
  p.rect(5, 6, 10, 8, C('night', 0));
  micro(p, 6, 8, 'GO', C('gold', 5));
  return p;
}

function numberSign(n: number): Pixels {
  const p = on('marble');
  p.rect(5, 1, 10, 13, C('chrome', 6)).rect(6, 2, 8, 11, C('denim', 2));
  micro(p, 7, 3, String(n), C('grey', 7), 2);
  p.rect(9, 14, 2, 5, C('chrome', 3));
  return p;
}

// Moon pieces.
function stars(seed: number, earth = false): Pixels {
  const p = blank(C('night', 0));
  const r = rng(seed);
  for (let i = 0; i < 5; i++) p.set(r() * 20, r() * 20, C('grey', 4 + Math.floor(r() * 4)));
  if (earth) {
    blob(p, 10, 10, 7, 7, R('sky'), 1, 5);
    blob(p, 8, 8, 3, 2, R('green'), 2, 4);
    blob(p, 12, 13, 2.5, 2, R('green'), 2, 4);
    oval(p, 11, 6, 3, 1, C('grey', 7));
  }
  return p;
}

function moonRock(floor: Floor): Pixels {
  const p = on(floor);
  oval(p, 11, 16, 8, 2.5, C('moon', 0));
  blob(p, 10, 11, 8, 7, R('moon'), 1, 5);
  p.set(7, 8, C('moon', 0)).set(13, 12, C('moon', 0));
  return p;
}

function flag(): Pixels {
  const p = on('moon');
  p.rect(5, 2, 1, 16, C('chrome', 5));
  p.rect(6, 2, 10, 7, C('paper', 2));
  for (let y = 2; y < 9; y += 2) p.rect(6, y, 10, 1, C('red', 3));
  p.rect(6, 2, 4, 4, C('denim', 2));
  p.set(7, 3, C('grey', 7)).set(8, 4, C('grey', 7));
  return p;
}

function baseWall(top: boolean): Pixels {
  const p = blank();
  if (top) {
    gradient(p, 0, 0, 20, 20, R('chrome'), 4, 6);
    for (let x = 0; x < 20; x += 10) p.rect(x, 0, 1, 20, C('chrome', 3));
    p.rect(0, 18, 20, 2, C('chrome', 7));
  } else {
    gradient(p, 0, 0, 20, 20, R('chrome'), 3, 1);
    p.rect(0, 0, 20, 2, C('chrome', 7));
    p.rect(4, 6, 12, 6, C('glass', 1)).frame(4, 6, 12, 6, C('chrome', 5));
    p.set(6, 7, C('grey', 7));
  }
  return p;
}

function lockers(): Pixels {
  const p = blank();
  for (let x = 0; x < 20; x += 5) {
    p.rect(x, 0, 5, 20, C('denim', 3)).rect(x, 0, 1, 20, C('denim', 1));
    for (let y = 3; y < 9; y += 2) p.rect(x + 1, y, 3, 1, C('denim', 1));
    p.set(x + 3, 12, C('chrome', 6));
  }
  p.rect(0, 18, 20, 2, C('grey', 1));
  return p;
}

function schoolWall(top: boolean): Pixels {
  const p = blank();
  if (top) {
    gradient(p, 0, 0, 20, 20, R('gold'), 1, 2);
    p.rect(0, 18, 20, 2, C('chrome', 6));
  } else {
    gradient(p, 0, 0, 20, 20, R('brick'), 2, 1);
    for (let y = 0; y < 20; y += 4) p.rect(0, y, 20, 1, C('brick', 0));
  }
  return p;
}

function project(kind: 'volcano' | 'potato' | 'robot' | 'tv' | 'phone'): Pixels {
  const p = on('gym');
  p.rect(0, 8, 20, 12, C('paper', 2)).rect(0, 8, 20, 2, C('chrome', 6)).rect(0, 18, 20, 2, C('paper', 0));
  if (kind === 'volcano') {
    for (let y = 2; y < 15; y++) p.rect(10 - (y - 1) / 1.6, y, ((y - 1) / 1.6) * 2, 1, C('wood', 1 + (y % 2)));
    p.rect(8, 1, 4, 2, C('red', 4)).set(9, 0, C('orange', 4));
  } else if (kind === 'potato') {
    blob(p, 6, 12, 4, 3, R('wood'), 1, 3);
    blob(p, 14, 12, 4, 3, R('wood'), 1, 3);
    p.rect(7, 3, 6, 5, C('night', 1));
    micro(p, 8, 4, '12', C('red', 4));
    p.line(6, 9, 9, 7, C('red', 3)).line(14, 9, 11, 7, C('gold', 3));
  } else if (kind === 'robot') {
    p.rect(6, 4, 8, 10, C('chrome', 4));
    p.rect(7, 1, 6, 4, C('chrome', 5));
    p.set(8, 2, C('red', 4)).set(11, 2, C('red', 4));
    p.rect(3, 6, 3, 2, C('chrome', 3)).rect(14, 6, 3, 2, C('chrome', 3));
    micro(p, 7, 8, 'HI', C('neon', 3));
  } else if (kind === 'tv') {
    p.blit(crtTv(1).crop(0, 2, 20, 16), 0, -2);
    p.rect(0, 14, 20, 6, C('paper', 2));
  } else {
    // Dex's own project: a "pocket telephone". The judges have their doubts.
    p.rect(8, 3, 4, 10, C('grey', 1)).rect(9, 4, 2, 2, C('neon', 2)).line(11, 3, 12, 0, C('grey', 2));
    for (let y = 7; y < 12; y += 2) p.set(9, y, C('grey', 5)).set(10, y, C('grey', 5));
    micro(p, 1, 14, 'POCKET', C('denim', 1));
  }
  return p;
}

function judgeTable(done: boolean, label = 'PAGES'): Pixels {
  const p = on('gym');
  p.rect(0, 4, 20, 14, C('denim', 2)).rect(0, 4, 20, 3, C('denim', 4));
  p.rect(2, 9, 16, 6, C('paper', 2));
  micro(p, 2, 10, done ? 'OK!' : label, done ? C('green', 2) : C('red', 3));
  if (!done) micro(p, 2, 14, 'HERE', C('denim', 1));
  void PAGES_NEEDED;
  return p;
}

function podium(): Pixels {
  const p = on('gym');
  p.rect(3, 6, 14, 13, C('gold', 3)).rect(3, 6, 14, 3, C('gold', 5));
  micro(p, 8, 11, '1', C('gold', 1), 2);
  p.disc(10, 3, 2.5, C('gold', 5));
  p.rect(9, 3, 2, 4, C('gold', 4));
  return p;
}

function bleachers(): Pixels {
  const p = blank();
  for (let y = 0; y < 20; y += 5) {
    p.rect(0, y, 20, 3, C('wood', 3)).rect(0, y + 3, 20, 2, C('wood', 1));
  }
  return p;
}

function volcanoSpawner(): Pixels {
  return project('volcano');
}

// ------------------------------------------------------------------ the sets
export function suburbSet(): BlockSet {
  const s = new BlockSet(150, false);
  addFloors(s, ['grass', 'flowers', 'sidewalk', 'road', 'roadH', 'roadV', 'deck', 'lane', 'laneLine', 'concrete']);
  s.add('void', blank(C('grey', 0)), { solid: SOLID });
  s.add('clouds', clouds(1), { solid: SOLID });
  s.add('clouds2', clouds(2), { solid: SOLID });
  addItems(s, 'grass', ['page', 'quarter', 'pill', 'battery', 'zapper', 'cola', 'remote']);
  addItems(s, 'sidewalk', ['page', 'quarter']);
  addItems(s, 'deck', ['page', 'quarter', 'pill', 'battery', 'cola']);
  addBooths(s, 'sidewalk');
  addWalkways(s, 'tube');
  // Dome Sweet Dome.
  addBig(s, 'dome', domeHome(FLOORS.grass, 'pink'));
  addBig(s, 'domeB', domeHome(FLOORS.grass, 'teal'));
  s.add('fenceH', chromeFence('grass', 'h'), { solid: SOLID });
  s.add('fenceV', chromeFence('grass', 'v'), { solid: SOLID });
  s.add('post', chromeFence('grass', 'post'), { solid: SOLID });
  s.add('hedge', hedgeCube('grass'), { solid: SOLID });
  s.add('tree', chromeTree('grass'), { solid: SOLID });
  s.add('mailbox', mailbox('grass'), { solid: SOLID });
  s.add('dish', dish('grass'), { solid: SOLID });
  s.add('doghouse', doghouse('grass'), { solid: SOLID });
  s.add('pool', pool(0), { solid: SOLID, next: 'pool2', ntime: 6 });
  s.add('pool2', pool(1), { solid: SOLID, next: 'pool', ntime: 6 });
  addBig(s, 'car', parkedCar('red'));
  s.add('mowdock', mowerDock('grass'), { solid: SOLID, birthMon: MON.mowerBox, birthTime: 260 });
  s.add('newscannon', paperCannon('sidewalk'), { solid: SOLID, birthMon: MON.paper, birthTime: 34 });
  s.add('garagedoor', staffDoor('remote', 'grass'), { solid: SOLID, effect: CTR.remote, eamt: -1, touch: 'concrete' });
  const gw = blank();
  gradient(gw, 0, 0, 20, 20, R('purple'), 2, 3);
  gw.rect(0, 16, 20, 4, C('chrome', 5));
  for (let x = 0; x < 20; x += 5) gw.rect(x, 0, 1, 16, C('purple', 1));
  s.add('garagewall', gw, { solid: SOLID });
  addBig(s, 'bbHome', billboard(['HOVER HEIGHTS', 'EST. 1999'], 'teal', 'gold', FLOORS.grass));

  // The Information Superhighway.
  s.add('railH', rail('h', 'deck'), { solid: SOLID });
  s.add('railV', rail('v', 'deck'), { solid: SOLID });
  s.add('railPost', rail('post', 'deck'), { solid: SOLID });
  s.add('tunnelR', tunnel('R'), { solid: SOLID, birthMon: MON.carR, birthTime: 46 });
  s.add('tunnelL', tunnel('L'), { solid: SOLID, birthMon: MON.carL, birthTime: 40 });
  s.add('tunnelFR', tunnel('R'), { solid: SOLID, birthMon: MON.fastR, birthTime: 54 });
  s.add('tunnelFL', tunnel('L'), { solid: SOLID, birthMon: MON.fastL, birthTime: 62 });
  s.add('tunnelTR', tunnel('R'), { solid: SOLID, birthMon: MON.truckR, birthTime: 70 });
  s.add('tunnelTL', tunnel('L'), { solid: SOLID, birthMon: MON.truckL, birthTime: 66 });
  s.add('tollbot', tollBot('deck'), { solid: SOLID });
  s.add('pillstand', pillStand('deck', 0), { solid: SOLID });
  s.add('pillstand2', pillStand('deck', 1), { solid: SOLID });
  addBig(s, 'bbInfo', billboard(['INFORMATION', 'SUPERHIGHWAY', 'NEXT 9 EXITS'], 'denim', 'gold', FLOORS.deck));
  addBig(s, 'bbFax', billboard(['FAX-A-PIZZA!', 'HOT PIZZA BY', 'FAX IN 30 SEC'], 'red', 'gold', FLOORS.deck));

  return s;
}

export function citySet(): BlockSet {
  const s = new BlockSet(150, false);
  addFloors(s, ['tile', 'carpet', 'marble', 'beach', 'shag', 'seafloor', 'jungle', 'concrete', 'sidewalk']);
  s.add('static', on('static', 51), { next: 'static2', ntime: 1 });
  s.add('static2', on('static', 52), { next: 'static', ntime: 1 });
  s.add('void', blank(C('grey', 0)), { solid: SOLID });
  addItems(s, 'tile', ['page', 'quarter', 'pill', 'battery', 'keycard', 'cola']);
  addItems(s, 'carpet', ['quarter', 'page']);
  addItems(s, 'marble', ['quarter', 'pill', 'battery']);
  addItems(s, 'beach', ['quarter', 'pill']);
  addItems(s, 'seafloor', ['quarter']);
  addItems(s, 'jungle', ['quarter', 'pill']);
  addItems(s, 'static', ['quarter']);
  addBooths(s, 'sidewalk');
  addLasers(s, 'tile', 9, 27);
  addWalkways(s, 'tube');
  // Mega Mall 2000.
  s.add('mallTop', mallWall(true), { solid: SOLID });
  s.add('mallWall', mallWall(false), { solid: SOLID });
  s.add('tv', crtTv(0), { solid: SOLID, next: 'tv2', ntime: 9 });
  s.add('tv2', crtTv(1), { solid: SOLID, next: 'tv3', ntime: 9 });
  s.add('tv3', crtTv(2), { solid: SOLID, next: 'tv', ntime: 4 });
  s.add('arcade', arcade('a'), { solid: SOLID, next: 'arcade2', ntime: 5, effect: CTR.quarters, eamt: -1, score: 1000, touch: 'arcadeOver' });
  s.add('arcade2', arcade('b'), { solid: SOLID, next: 'arcade', ntime: 5, effect: CTR.quarters, eamt: -1, score: 1000, touch: 'arcadeOver' });
  s.add('arcadeOver', arcade('over'), { solid: SOLID });
  s.add('pinTop', pinball('top', 0), { solid: SOLID, next: 'pinTop2', ntime: 4 });
  s.add('pinTop2', pinball('top', 1), { solid: SOLID, next: 'pinTop', ntime: 4 });
  s.add('pinball', pinball('bottom', 0), { solid: SOLID, effect: CTR.quarters, eamt: -1, score: 2500, touch: 'pinTilt' });
  s.add('pinTilt', arcade('tilt'), { solid: SOLID });
  s.add('fountain', fountain(0), { solid: SOLID, next: 'fountain2', ntime: 3 });
  s.add('fountain2', fountain(1), { solid: SOLID, next: 'fountain', ntime: 3 });
  s.add('palm', palm('tile'), { solid: SOLID });
  s.add('foodtable', foodTable(), { solid: SOLID });
  s.add('staffdoor', staffDoor('keycard', 'tile'), { solid: SOLID, effect: CTR.keycard, eamt: -1, touch: 'tile' });
  s.add('secdock', mowerDock('tile', 'SEC'), { solid: SOLID, birthMon: MON.secbot, birthTime: 150 });
  addBig(
    s,
    'nArcade',
    neonSign('ARCADE', 3, () => mallWall(false), 'neon'),
  );
  addBig(
    s,
    'nTv',
    neonSign('TV-RAMA', 3, () => mallWall(false), 'teal'),
  );
  addBig(
    s,
    'nPill',
    neonSign('PILLS', 3, () => mallWall(false), 'gold'),
  );

  // The Teleport-A-Phone Exchange (and wherever its wrong numbers go).
  s.add('switchboard', switchboard(0), { solid: SOLID, next: 'switchboard2', ntime: 7 });
  s.add('switchboard2', switchboard(1), { solid: SOLID, next: 'switchboard', ntime: 7 });
  s.add('xwall', exchangeWall(), { solid: SOLID });
  s.add('flamingo', flamingo('beach'), { solid: SOLID });
  s.add('beachpalm', palm('beach'), { solid: SOLID });
  s.add('shuffle', shuffleboard());
  s.add('ocean', pool(0), { solid: SOLID, next: 'ocean2', ntime: 6 });
  s.add('ocean2', pool(1), { solid: SOLID, next: 'ocean', ntime: 6 });
  s.add('testpattern', testPattern(), { solid: SOLID });
  s.add('seaweed', seaweed(), { solid: SOLID });
  s.add('coral', coral(), { solid: SOLID });
  s.add('seaglass', seaGlass(), { solid: SOLID });
  s.add('fern', fern(), { solid: SOLID });
  s.add('rockwall', rockWall('wood', 3), { solid: SOLID });
  s.add('tar', tar(0), { hp: -3, next: 'tar2', ntime: 5 });
  s.add('tar2', tar(1), { hp: -3, next: 'tar', ntime: 5 });
  addBig(s, 'rocket', rocket(FLOORS.concrete));
  s.add('launchsign', launchSign(), { solid: SOLID });
  s.add('board', boardRamp());
  for (const n of [1, 2, 3, 4]) s.add(`num${n}`, numberSign(n), { solid: SOLID });
  return s;
}

export function moonSet(): BlockSet {
  const s = new BlockSet(150, false);
  addFloors(s, ['moon', 'moonprint', 'gym', 'gymLine', 'metal', 'sidewalk']);
  s.add('space', stars(1), { solid: SOLID });
  s.add('space2', stars(2), { solid: SOLID });
  s.add('earth', stars(3, true), { solid: SOLID });
  addItems(s, 'moon', ['page', 'quarter', 'pill', 'battery', 'cola', 'pass']);
  addItems(s, 'metal', ['page', 'quarter', 'pill', 'battery']);
  addItems(s, 'gym', ['page', 'pill', 'battery', 'quarter']);
  addBooths(s, 'sidewalk');
  addLasers(s, 'metal', 9, 27);
  addWalkways(s, 'walk');

  addBig(s, 'crater', crater(FLOORS.moon));
  s.add('moonrock', moonRock('moon'), { solid: SOLID });
  s.add('flag', flag(), { solid: SOLID });
  s.add('baseTop', baseWall(true), { solid: SOLID });
  s.add('baseWall', baseWall(false), { solid: SOLID });
  s.add('airlock', staffDoor('pass', 'metal'), { solid: SOLID, effect: CTR.moonpass, eamt: -1, touch: 'metal' });
  addBig(s, 'mdome', domeHome(FLOORS.moon, 'purple'));
  addBig(s, 'bbMoon', billboard(["MCMOON'S", 'OVER 1 BILLION', 'PILLS SERVED'], 'gold', 'red', FLOORS.moon));
  addBig(s, 'bbWelcome', billboard(['WELCOME TO', 'THE MOON', 'POP. 2,000'], 'purple', 'gold', FLOORS.moon));
  const meteorHole = stars(5);
  s.add('meteorgun', meteorHole, { solid: SOLID, birthMon: MON.meteor, birthTime: 40 });
  s.add('meteorgunL', stars(6), { solid: SOLID, birthMon: MON.meteorL, birthTime: 47 });
  s.add('buggydock', mowerDock('moon', 'GAS'), { solid: SOLID });

  // Moon School.
  s.add('lockers', lockers(), { solid: SOLID });
  s.add('schoolTop', schoolWall(true), { solid: SOLID });
  s.add('schoolWall', schoolWall(false), { solid: SOLID });
  s.add('bleachers', bleachers(), { solid: SOLID });
  s.add('volcano', volcanoSpawner(), { solid: SOLID, birthMon: MON.lava, birthTime: 48 });
  s.add('potato', project('potato'), { solid: SOLID });
  s.add('robotproj', project('robot'), { solid: SOLID });
  s.add('tvproj', project('tv'), { solid: SOLID });
  s.add('phoneproj', project('phone'), { solid: SOLID });
  s.add('judgetable', judgeTable(false), { solid: SOLID, effect: CTR.pages, eamt: -PAGES_NEEDED, score: 5000, touch: 'judgedone' });
  s.add('judgedone', judgeTable(true));
  s.add('covertable', judgeTable(false, 'COVER'), { solid: SOLID, effect: CTR.cover, eamt: -1, score: 5000, touch: 'judgedone' });
  s.add('podium', podium());
  addBig(s, 'banner', banner('SCIENCE FAIR 2000', 8, 1, 'denim', 'gold'));
  return s;
}

export { tiled };
