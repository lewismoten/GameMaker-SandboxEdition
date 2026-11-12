// EARTH.BBL's suburb half and the set for Dome Sweet Dome and the Information Superhighway:
// chrome fences, hedge cubes, chrome trees, mailboxes, dishes, doghouses, pools, parked
// cars, the CitiCar and its charger, mower docks, newspaper cannons, Skyway rails, clouds, tunnels, toll bots and the
// pill drive-thru.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { BlockSet, SOLID } from './book';
import { blob, gradient, oval, shadeAt, speckle } from '../art/draw';
import { FLOORS } from './floors';
import { micro } from '../art/font';
import { CTR, DOME_PAGES, MON } from '../ids';
import { C } from '../art/pal';
import { billboard, domeHome } from '../art/bigart';
import { addTicker } from './ticker';
import { chargerPost, citicar } from '../art/citicar';
import { R, addBig, addBooths, addFloors, addItems, addWalkways, blank, on, staffDoor, type Floor } from './shared';
import { addEgg } from './egg';

// ------------------------------------------------------------------ walls and things
/** A garden gate between two chrome posts with a sign on it saying what it wants. */
function gatePic(lines: string[], tone: 'pink' | 'teal' | 'gold', state: 'shut' | 'ajar'): Pixels {
  const p = on('grass');
  const posts = () => {
    for (const x of [0, 17]) p.rect(x, 2, 3, 16, C('chrome', 4)).rect(x, 2, 1, 16, C('chrome', 7)).rect(x, 16, 3, 2, C('gray', 1));
  };
  const w = state === 'shut' ? 20 : 5;
  p.rect(0, 3, w, 14, C(tone, 1));
  for (let y = 4; y < 16; y += 3) p.rect(0, y, w, 1, C(tone, 3));
  if (state === 'shut') {
    p.rect(0, 2, 20, 16, C(tone, 1)).frame(0, 2, 20, 16, C('gray', 1));
    p.rect(0, 4, 20, 12, C('paper', 2));
    lines.forEach((line, i) => micro(p, 1, 5 + i * 6, line, C('denim', 1)));
  }
  if (state !== 'shut') posts();
  return p;
}

function chromeFence(floor: Floor, dir: 'h' | 'v' | 'post'): Pixels {
  const p = on(floor);
  if (dir === 'h') {
    p.rect(0, 6, 20, 2, C('chrome', 6)).rect(0, 12, 20, 2, C('chrome', 4));
    for (let x = 2; x < 20; x += 6) p.rect(x, 3, 2, 14, C('chrome', 5)).rect(x, 3, 1, 14, C('chrome', 7)).rect(x, 16, 2, 2, C('gray', 1));
  } else if (dir === 'v') {
    p.rect(7, 0, 2, 20, C('chrome', 6)).rect(11, 0, 2, 20, C('chrome', 4));
    for (let y = 2; y < 20; y += 6) p.rect(6, y, 8, 2, C('chrome', 5));
  } else {
    p.rect(6, 2, 8, 15, C('chrome', 4)).rect(6, 2, 8, 2, C('chrome', 7)).rect(6, 16, 8, 2, C('gray', 1));
    p.disc(10, 3, 2, C('pink', 4));
  }
  return p;
}

function hedgeCube(floor: Floor): Pixels {
  const p = on(floor);
  // A hedge trimmed into a perfect cube by the robot gardener: bright top, shaded front.
  oval(p, 11, 18, 9, 2, C('gray', 1));
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
  oval(p, 11, 17, 7, 2, C('gray', 1));
  p.rect(9, 9, 2, 9, C('chrome', 3));
  // A perfect sphere of robot-trimmed leaves, and a chrome ring around it.
  blob(p, 10, 7, 7, 7, R('neon'), 0, 3);
  for (let a = 0; a < Math.PI * 2; a += 0.05) p.set(10 + Math.cos(a) * 8.5, 8 + Math.sin(a) * 2.5, Math.sin(a) > 0 ? C('chrome', 6) : C('chrome', 3));
  return p;
}

function mailbox(floor: Floor): Pixels {
  const p = on(floor);
  oval(p, 10, 17, 5, 1.5, C('gray', 1));
  p.rect(9, 9, 2, 8, C('chrome', 3));
  p.rect(4, 3, 12, 7, C('denim', 2)).rect(4, 3, 12, 2, C('denim', 4));
  p.rect(15, 1, 1, 5, C('red', 3)).rect(15, 1, 3, 2, C('red', 4));
  micro(p, 5, 6, 'FAX', C('paper', 2));
  return p;
}

function doghouse(floor: Floor): Pixels {
  const p = on(floor);
  for (let y = 2; y < 9; y++) p.rect(10 - (y - 1) * 1.3, y, (y - 1) * 2.6, 1, C('chrome', 4 + (y % 2)));
  p.rect(3, 9, 14, 9, C('sky', 3));
  oval(p, 10, 16.5, 3.5, 3, C('night', 0));
  p.rect(6, 17, 8, 1, C('night', 0));
  // the name board is wider than the house: five letters take 19 pixels
  p.rect(0, 9, 20, 5, C('paper', 2));
  micro(p, 1, 9, 'SPRKY', C('denim', 1));
  return p;
}

/** The ocean's waves (the city's harbor): water to the edge, no deck around it. */
export function pool(phase: number): Pixels {
  const p = blank();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('sky'), 3, 6, 0.5 + 0.5 * Math.sin((x + y * 0.5 + phase * 3) / 3), x, y));
  for (let x = 0; x < 20; x += 5) p.set(x + phase, 6 + ((x / 5) % 2) * 7, C('gray', 7));
  return p;
}

/**
 * The backyard swimming pool, 2x2 blocks: a pale concrete deck, a blue rim of tiles, water with
 * ripples, a steel ladder over the near corner, a diving board and a red-and-white float. It reads as a pool and not as an ice rink or a building, and Dex can't walk on water.
 */
function poolBig(): Pixels {
  const p = new Pixels(40, 40);
  // the deck, wider on the side the board stands on
  p.rect(0, 0, 40, 40, C('paper', 1)).rect(0, 0, 40, 1, C('paper', 2));
  for (let x = 3; x < 40; x += 8) p.rect(x, 0, 1, 40, C('paper', 0));
  // the tile rim and the water
  p.rect(3, 4, 34, 28, C('sky', 5)).rect(4, 5, 32, 26, C('sky', 2));
  for (let y = 6; y < 30; y++) for (let x = 5; x < 35; x++) p.set(x, y, shadeAt(R('sky'), 3, 6, 0.5 + 0.5 * Math.sin((x + y * 0.7) / 2.6), x, y));
  // ripples: short light dashes
  for (let r = 0; r < 5; r++) p.rect(7 + r * 6, 10 + ((r * 5) % 17), 3, 1, C('sky', 7));
  // a rubber duck floating: yellow body, round head, orange beak
  oval(p, 12, 19, 5, 3, C('gold', 5));
  p.rect(7, 18, 2, 2, C('gold', 6));
  p.disc(16, 16, 2, C('gold', 5)).set(17, 15, C('night', 0));
  p.rect(18, 16, 2, 1, C('orange', 4));
  p.rect(8, 22, 8, 1, C('sky', 7));
  // the steel ladder over the corner: two rails with rungs, going into the water
  p.rect(29, 1, 2, 13, C('chrome', 2)).rect(34, 1, 2, 13, C('chrome', 2));
  p.rect(29, 1, 1, 13, C('chrome', 7)).rect(34, 1, 1, 13, C('chrome', 7));
  for (const y of [5, 8, 11]) p.rect(29, y, 7, 1, C('chrome', 6));
  // the diving board: a long gold plank on a post at the bottom edge, reaching out over the water
  p.rect(18, 32, 14, 3, C('gold', 5)).rect(18, 32, 14, 1, C('gold', 7));
  p.rect(18, 35, 3, 4, C('chrome', 3)).rect(18, 35, 1, 4, C('chrome', 6));
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
  oval(p, 10, 16, 7, 2, C('gray', 1));
  p.rect(2, 8, 16, 8, C('purple', 2)).rect(2, 8, 16, 2, C('purple', 4));
  p.rect(8, 13, 4, 7, C('gray', 1));
  micro(p, 3, 10, 'NEWS', C('paper', 2));
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
  for (let i = 0; i < 3; i++) blob(p, r() * 20, r() * 20, 3 + r() * 4, 2 + r() * 2, R('gray'), 5, 7);
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
  oval(p, 10, 18, 7, 1.5, C('gray', 1));
  p.rect(5, 6, 10, 12, C('gold', 3)).rect(5, 6, 10, 2, C('gold', 5));
  blob(p, 10, 5, 5, 4, R('chrome'), 3, 7);
  p.rect(7, 4, 2, 2, C('red', 4)).rect(11, 4, 2, 2, C('red', 4));
  p.rect(7, 10, 6, 4, C('night', 1));
  micro(p, 7, 10, '25', C('neon', 3));
  return p;
}

function pillStand(floor: Floor, k: number): Pixels {
  const p = on(floor);
  // edge to edge: DRIVE's five letters take 19 of the block's 20 pixels
  p.rect(0, 3, 20, 15, C('pink', 2)).rect(0, 3, 20, 3, C('pink', 4));
  p.rect(0, 8, 20, 10, C('paper', 2));
  micro(p, 2, 9, k === 0 ? 'FOOD' : 'PILL', C('pink', 1));
  micro(p, 2 - (k === 0 ? 0 : 1), 13, k === 0 ? 'PILL' : 'DRIVE', C('denim', 1));
  return p;
}

// ------------------------------------------------------------------ the sets
export function suburbSet(): BlockSet {
  const s = new BlockSet(150, false);
  addFloors(s, ['grass', 'flowers', 'sidewalk', 'road', 'roadH', 'roadV', 'deck', 'lane', 'laneLine', 'concrete']);
  s.add('void', blank(C('gray', 0)), { solid: SOLID });
  s.add('clouds', clouds(1), { solid: SOLID });
  s.add('clouds2', clouds(2), { solid: SOLID });
  addItems(s, 'grass', ['page', 'quarter', 'pill', 'battery', 'zapper', 'cola', 'keys']);
  addItems(s, 'deck', ['page', 'quarter', 'pill', 'battery', 'cola']);
  addBooths(s, 'sidewalk');
  // Only horizontal tubes occur in these maps; leave room for the car's DOS gate stages.
  addWalkways(s, 'tube', ['right', 'left']);
  // Dome Sweet Dome.
  addBig(s, 'dome', domeHome(FLOORS.grass, 'pink'));
  addBig(s, 'domeB', domeHome(FLOORS.grass, 'teal'));
  s.add('fenceH', chromeFence('grass', 'h'), { solid: SOLID });
  s.add('fenceV', chromeFence('grass', 'v'), { solid: SOLID });
  s.add('post', chromeFence('grass', 'post'), { solid: SOLID });
  s.add('hedge', hedgeCube('grass'), { solid: SOLID });
  s.add('tree', chromeTree('grass'), { solid: SOLID });
  s.add('mailbox', mailbox('grass'), { solid: SOLID });
  s.add('doghouse', doghouse('grass'), { solid: SOLID });
  // the backyard pool (the block set has no room to ripple it between two pictures)
  addBig(s, 'swim', poolBig());
  // The CitiCar on its charger: honk it (touch the front, on the left) and the headlights flash.
  // The car's picture is left whole; the three gates in front of it (below) do the checking, and
  // its door takes the keys. Stepping in is Dome Sweet Dome's way out (to the Cloud Lane).
  const parked = citicar(false);
  addBig(s, 'citi', parked, (col, row) =>
    col === 0 && row === 1
      ? { solid: SOLID, score: 1976, touch: 'citiLit' }
      : col === 1 && row === 1
        ? { solid: SOLID, effect: CTR.keys, eamt: -1, touch: 'citiOpen' }
        : // the top row is only the sky above the roof (the car stands in the lower row): Dex can walk through it
          row === 0
          ? {}
          : { solid: SOLID },
  );
  const open = citicar(false).crop(20, 20, 20, 20);
  for (let y = 1; y < 14; y++) for (let x = 0; x < 7; x++) if (open.get(x, y) !== C('gray', 0)) open.set(x, y, y < 7 ? C('teal', 2) : C('night', 1));
  open.rect(7, 1, 2, 13, C('red', 4));
  s.add('citiOpen', open);
  s.add('citiLit', citicar(true).crop(0, 20, 20, 20), { solid: SOLID, next: 'citiLit2', ntime: 4 });
  s.add('citiLit2', citicar(false).crop(0, 20, 20, 20), { solid: SOLID, next: 'citiLit', ntime: 4 });
  // the charger's cord crosses the grass beside the car (one block of lawn with the cord in it)
  const cord = on('grass');
  cord.line(0, 11, 6, 13, C('gray', 0)).line(6, 13, 13, 13, C('gray', 0)).line(13, 13, 19, 11, C('gray', 0));
  s.add('cord', cord);
  // a red doormat in front of the car's door: it shows Dex where to step in (the door is one block wide)
  const mat = on('grass');
  mat.rect(3, 3, 14, 15, C('red', 2)).frame(3, 3, 14, 15, C('gold', 5));
  // a white arrow pointing up at the door
  for (let i = 0; i < 5; i++) mat.rect(9 - i, 6 + i, 2 + i * 2, 1, C('paper', 2));
  mat.rect(8, 11, 4, 5, C('paper', 2));
  s.add('doormat', mat);
  s.add('charger', chargerPost('1MI'), { solid: SOLID, next: 'charger2', ntime: 12 });
  s.add('charger2', chargerPost('/HR'), { solid: SOLID, next: 'charger', ntime: 12 });
  s.add('newscannon', paperCannon('sidewalk'), { solid: SOLID, birthMon: MON.paper, birthTime: 34 });
  s.add('garagedoor', staffDoor('keys', 'grass'), { solid: SOLID, effect: CTR.keys, eamt: -1, touch: 'concrete' });
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
  s.add('tunnelCR', tunnel('R'), { solid: SOLID, birthMon: MON.citicar, birthTime: 90 });
  s.add('tollbot', tollBot('deck'), { solid: SOLID });
  s.add('pillstand', pillStand('deck', 0), { solid: SOLID });
  s.add('pillstand2', pillStand('deck', 1), { solid: SOLID });
  addBig(s, 'bbInfo', billboard(['INFORMATION', 'SUPERHIGHWAY', 'NEXT 9 EXITS'], 'denim', 'gold', FLOORS.deck));
  addBig(s, 'bbFax', billboard(['FAX-A-PIZZA!', 'HOT PIZZA BY', 'FAX IN 30 SEC'], 'red', 'gold', FLOORS.deck));
  addTicker(s, () => rail('h', 'deck'));

  // Three gates in a row lead to the car: all seven pages, then the Zapper, then the keys.
  // PLAYGAME checks counters >=20 before accepting a touch (PLAYGAME.C DoBlockTouchChar), so the
  // pages are only checked: the next solid stage gives them back (Dex still needs them at the
  // fair). The ring holds three keys: the garage gate, this gate and the car's door each take one.
  s.add('gatePages', gatePic(['SEVEN', 'PAGES'], 'pink', 'shut'), { solid: SOLID, effect: CTR.pages, eamt: -DOME_PAGES, touch: 'gatePagesB' });
  s.add('gatePagesB', gatePic([], 'pink', 'ajar'), { solid: SOLID, effect: CTR.pages, eamt: DOME_PAGES, touch: 'grass' });
  s.add('gateZap', gatePic(['ZAP-', 'PER'], 'teal', 'shut'), { solid: SOLID, effect: CTR.zapperFound, eamt: -1, touch: 'grass' });
  s.add('gateKeys', gatePic(['THE', 'KEYS'], 'gold', 'shut'), { solid: SOLID, effect: CTR.keys, eamt: -1, touch: 'doormat' });
  // A pickup receipt is separate from ammunition: batteries cannot impersonate the Zapper,
  // and spending every shot before boarding cannot lock Dex out. The next touch grants ammo.
  Object.assign(s.def('zapper_grass'), { effect: CTR.zapperFound, eamt: 1, touch: 'zapperCharge' });
  s.add('zapperCharge', s.pic('zapper_grass'), { effect: CTR.zap, eamt: 15, touch: 'grass' });

  addEgg(s, 'sidewalk');
  return s;
}
