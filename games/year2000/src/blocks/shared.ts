// What all three background sets share: floors to draw on, the items laid over any floor
// (and what each does when touched), the phone booths, laser fences that switch on and off
// by next/ntime chains, the moving walkways (gravity blocks), staff doors that open for the
// right counter, and addBig, which cuts a big picture into numbered blocks.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, SOLID, type BlockDef } from './book';
import { T, shadeAt } from '../art/draw';
import { FLOORS } from './floors';
import { micro } from '../art/font';
import { CTR } from '../ids';
import { ITEM_PICS, type ItemName } from './items';
import { C, PAL } from '../art/pal';

export const R = PAL.r;
export type Floor = keyof typeof FLOORS;

/** Grav bits: 1 up, 2 right, 4 down, 8 left. */
export const GRAV = { up: 1, right: 2, down: 4, left: 8 } as const;

export const blank = (c = 0) => new Pixels(20, 20, c);
export const on = (floor: Floor, seed?: number) => FLOORS[floor](seed);
const over = (bg: Pixels, fg: Pixels) => bg.blit(fg, 0, 0, T);

/** What every item does when touched. */
const ITEM_DEFS: Record<ItemName, BlockDef> = {
  page: { effect: CTR.pages, eamt: 1, score: 100 },
  quarter: { effect: CTR.quarters, eamt: 1, score: 25 },
  pill: { hp: 20, score: 10 },
  battery: { effect: CTR.zap, eamt: 6, score: 10 },
  zapper: { effect: CTR.zap, eamt: 15, score: 250 },
  cola: { effect: CTR.lives, eamt: 1, score: 500 },
  keys: { effect: CTR.keys, eamt: 2, score: 100 },
  keycard: { effect: CTR.keycard, eamt: 1, score: 100 },
  pass: { effect: CTR.moonpass, eamt: 1, score: 100 },
  cover: { effect: CTR.cover, eamt: 1, score: 1000 },
};

// ------------------------------------------------------------------ shared pieces
export function addFloors(set: BlockSet, floors: Floor[]): void {
  for (const f of floors) set.add(f, on(f));
}

/**
 * A food pill heals less the further Dex gets (it's the same pill; the trip gets harder):
 * the suburb 20, the Skyway 15, the mall 12, the exchange's rooms 10, the Moon and the school 8.
 */
const PILL_HP: Partial<Record<Floor, number>> = { deck: 15, tile: 12, marble: 10, beach: 10, jungle: 10, moon: 8, metal: 8, gym: 8 };

export function addItems(set: BlockSet, floor: Floor, items: ItemName[], suffix = floor as string): void {
  for (const it of items) {
    const def = it === 'pill' && PILL_HP[floor] ? { ...ITEM_DEFS[it], hp: PILL_HP[floor] } : ITEM_DEFS[it];
    set.add(`${it}_${suffix}`, over(on(floor, 7), ITEM_PICS[it]()), { ...def, touch: floor });
  }
}

/** Phone booths: red roof with PHONE, glass doors. The working ones take a quarter and teleport you. */
export function addBooths(set: BlockSet, floor: Floor): void {
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
    p.rect(12, 4, 3, 5, C('gray', 1)).rect(12, 4, 1, 3, C('gray', 3));
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
    for (let i = 0; i < 9; i++) p.set(4 + r() * 12, 1 + r() * 18, C('gray', 7));
    return p;
  };
  set.add('booth_open', open(0), { next: 'booth_open2', ntime: 2 });
  set.add('booth_open2', open(1), { next: 'booth_open', ntime: 2 });
}

/** A laser fence that blinks: walk through while it is off. */
export function addLasers(set: BlockSet, floor: Floor, onTime: number, offTime: number): void {
  const post = (lit: boolean) => {
    const p = on(floor);
    p.rect(0, 2, 3, 16, C('chrome', 3)).rect(17, 2, 3, 16, C('chrome', 3));
    p.rect(0, 2, 3, 1, C('chrome', 6)).rect(17, 2, 3, 1, C('chrome', 6));
    p.rect(1, 4, 1, 2, lit ? C('red', 4) : C('green', 3)).rect(18, 4, 1, 2, lit ? C('red', 4) : C('green', 3));
    if (lit)
      for (const y of [6, 10, 14]) {
        p.rect(3, y, 14, 1, C('red', 4));
        p.rect(3, y - 1, 14, 1, C('red', 2)).rect(3, y + 1, 14, 1, C('red', 2));
        for (let x = 4; x < 17; x += 4) p.set(x + (y % 3), y, C('gray', 7));
      }
    return p;
  };
  set.add('laser', post(true), { hp: -3, next: 'laser_off', ntime: onTime });
  set.add('laser_off', post(false), { next: 'laser', ntime: offTime });
}

/** Moving walkways (gravity blocks), two animation frames each way. */
export function addWalkways(set: BlockSet, style: 'walk' | 'tube'): void {
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
        const col = tube ? C('gray', 7) : C('gold', 4);
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
export function addBig(set: BlockSet, name: string, pic: Pixels, def: (col: number, row: number) => BlockDef = () => ({ solid: SOLID })): void {
  const cols = pic.w / 20;
  const rows = pic.h / 20;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) set.add(`${name}${j * cols + i}`, pic.crop(i * 20, j * 20, 20, 20), def(i, j));
}

export function staffDoor(kind: 'keycard' | 'keys' | 'pass', floor: Floor): Pixels {
  const p = on(floor);
  const col = kind === 'keycard' ? 'pink' : kind === 'keys' ? 'gold' : 'purple';
  p.rect(0, 0, 20, 20, C(col, 1));
  for (let y = 1; y < 20; y += 3) p.rect(1, y, 18, 2, C(col, 3));
  p.rect(0, 5, 20, 12, C('paper', 2));
  micro(p, 1, 6, kind === 'keycard' ? 'STAFF' : kind === 'keys' ? 'GATE' : 'MOON', C(col, 1));
  micro(p, 1, 11, kind === 'keycard' ? 'ONLY' : kind === 'keys' ? 'CLICK' : 'PASS', C('denim', 1));
  p.rect(15, 14, 3, 3, C('red', 4));
  return p;
}
