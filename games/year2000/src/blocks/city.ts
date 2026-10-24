// The set for Mega Mall 2000 and the Teleport-A-Phone Exchange (with the places its wrong
// numbers go): mall walls, CRT TVs, arcade cabinets, pinball, fountains, palms, the food
// court, the switchboards and exchange walls, and the wrong-number places' flamingos,
// shuffleboard, test pattern, sea floor, jungle, tar pits and launch pad.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, SOLID } from './book';
import { T, blob, gradient, oval, shadeAt } from '../art/draw';
import { FLOORS } from './floors';
import { micro } from '../art/font';
import { CTR, MON } from '../ids';
import { C, PAL } from '../art/pal';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { wattCameo } from '../../../kit/cameos';
import { neonSign, rocket } from '../art/bigart';
import { addEgg, addHatch } from './egg';
import { R, addBig, addBooths, addFloors, addItems, addLasers, addWalkways, blank, on, staffDoor, type Floor } from './shared';
import { mowerDock, pool } from './suburb';
import { addSignal } from './signal';

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
export function crtTv(screen: number): Pixels {
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

function exchangeGlow(): Pixels {
  const p = exchangeWall();
  for (const [x, y] of [
    [0, 7],
    [0, 8],
    [5, 12],
    [5, 13],
    [3, 10],
    [8, 10],
    [10, 16],
    [10, 17],
    [12, 15],
  ])
    p.set(x, y, C('teal', 3));
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
  micro(p, 3, 10, '->GO', C('neon', 3));
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
  addSignal(s);
  // The closet beside the launch pad: one brick of its wall is only a hologram, with the
  // closet's teal light showing through the mortar.
  s.add('xwallGlow', exchangeGlow());
  addHatch(s);
  addKeepsakes(s);
  addEgg(s, 'concrete');
  return s;
}

/**
 * Keepsakes and a visitor, added before the felt egg's fixed block: a tin heart tucked behind
 * the food court's tables at PILLS (a glint crosses it now and then) and a painted Easter egg in
 * the sand in a corner of Florida, each a few points and gone when touched (the floor under it
 * is its touch block), with no sound of its own; and Watt, the repair robot from Ohm Sweet Ohm,
 * tinkering with the Exchange's switchboard (scenery, solid like the wall he stands by).
 */
function addKeepsakes(s: BlockSet): void {
  const tin = { ink: C('grey', 0), tin: [C('chrome', 3), C('chrome', 5), C('chrome', 6)], white: C('grey', 7), dark: C('chrome', 1) };
  for (let k = 0; k < SHINE_FRAMES; k++)
    s.add(`tinHeart${k || ''}`, drawTinHeart(on('tile'), tin, k), {
      next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`,
      ntime: k ? 2 : 50,
      touch: 'tile',
      score: 100,
    });
  const egg = { ink: C('purple', 0), shell: PAL.r('pink').slice(2), paint: [C('teal', 2), C('teal', 4)], accent: C('gold', 4), white: C('grey', 7) };
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    s.add(`easterEgg${k || ''}`, drawEasterEgg(on('beach'), egg, 'zigzag', k), {
      next: `easterEgg${(k + 1) % EGG_SHINE_FRAMES || ''}`,
      ntime: k ? 2 : 60,
      touch: 'beach',
      score: 50,
    });
  s.add('watt', on('marble').blit(wattCameo(PAL.pal, 'up', 0), 0, 0, T), { solid: SOLID });
}
