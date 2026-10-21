// EARTH.BBL's suburb half and the set for Dome Sweet Dome and the Information Superhighway:
// chrome fences, hedge cubes, chrome trees, mailboxes, dishes, doghouses, pools, parked
// cars, mower docks, newspaper cannons, Skyway rails, clouds, tunnels, toll bots and the
// pill drive-thru.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, SOLID } from './book';
import { blob, gradient, oval, shadeAt, speckle } from '../art/draw';
import { FLOORS } from './floors';
import { micro } from '../art/font';
import { CTR, MON } from '../ids';
import { C } from '../art/pal';
import { billboard, domeHome, tiled } from '../art/bigart';
import { R, addBig, addBooths, addFloors, addItems, addWalkways, blank, on, staffDoor, type Floor } from './shared';

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

export function pool(phase: number): Pixels {
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

export function mowerDock(floor: Floor, label = 'MOW'): Pixels {
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
