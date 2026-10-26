// MOON.BBL: the Moon (stars with the Earth rising, moon rocks, the flag, the base) and the
// Moon School's Science Fair (lockers, school walls, the projects, the judges' table that
// counts your pages, the podium and bleachers).
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, SOLID } from './book';
import { blob, gradient, oval } from '../art/draw';
import { FLOORS } from './floors';
import { micro } from '../art/font';
import { COPY_TICKS, CTR, MON, PAGES_NEEDED } from '../ids';
import { C, PAL } from '../art/pal';
import { banner, billboard, crater, domeHome } from '../art/bigart';
import { R, addBig, addBooths, addFloors, addItems, addLasers, addWalkways, blank, on, staffDoor, type Floor } from './shared';
import { addEgg } from './egg';
import { saveSignBlocks } from '../../../kit/saveSign';
import { mowerDock } from './suburb';
import { crtTv } from './city';

// Moon pieces.
function stars(seed: number, earth = false): Pixels {
  const p = blank(C('night', 0));
  const r = rng(seed);
  for (let i = 0; i < 5; i++) p.set(r() * 20, r() * 20, C('gray', 4 + Math.floor(r() * 4)));
  if (earth) {
    blob(p, 10, 10, 7, 7, R('sky'), 1, 5);
    blob(p, 8, 8, 3, 2, R('green'), 2, 4);
    blob(p, 12, 13, 2.5, 2, R('green'), 2, 4);
    oval(p, 11, 6, 3, 1, C('gray', 7));
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
  p.set(7, 3, C('gray', 7)).set(8, 4, C('gray', 7));
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
    p.set(6, 7, C('gray', 7));
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
  p.rect(0, 18, 20, 2, C('gray', 1));
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

function project(kind: 'volcano' | 'potato' | 'robot' | 'tv' | 'phone' | 'cpu6502' | 'cpu6502b' | 'cpu1802' | 'capsule'): Pixels {
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
  } else if (kind === 'cpu6502' || kind === 'cpu6502b') {
    // A breadboard computer: a 6502, its jumper wires, and a clock LED that blinks.
    p.rect(1, 1, 18, 12, C('paper', 2)).frame(1, 1, 18, 12, C('paper', 0));
    for (let x = 2; x < 18; x += 2) p.set(x, 2, C('paper', 0)).set(x, 11, C('paper', 0));
    p.line(3, 3, 5, 11, C('red', 4)).line(17, 3, 14, 11, C('teal', 4)).line(9, 10, 17, 11, C('gold', 4));
    p.rect(2, 4, 16, 6, C('gray', 1));
    micro(p, 3, 4, '6502', C('gray', 6));
    p.disc(17, 11, 1, kind === 'cpu6502b' ? C('red', 4) : C('red', 1));
    micro(p, 1, 14, '8-BIT', C('denim', 1));
  } else if (kind === 'cpu1802') {
    // The RCA 1802 on a little red card, and the planet it went to aboard Galileo.
    oval(p, 15, 3, 3.5, 2.5, C('orange', 3));
    p.rect(12, 2, 7, 1, C('orange', 1)).rect(12, 4, 7, 1, C('orange', 4));
    p.line(6, 6, 12, 3, C('gray', 6));
    p.rect(0, 6, 20, 7, C('red', 2)).rect(1, 7, 17, 5, C('gray', 1));
    micro(p, 2, 7, '1802', C('gray', 6));
    micro(p, 1, 14, 'SPACE', C('denim', 1));
  } else if (kind === 'capsule') {
    // A time capsule for America's 250th birthday: open on July 4, 2026.
    p.rect(6, 1, 8, 13, C('chrome', 5)).rect(6, 1, 8, 2, C('chrome', 7));
    for (let y = 4; y < 13; y += 2) p.rect(6, y, 8, 1, C('red', 4));
    p.rect(6, 3, 4, 4, C('denim', 2)).set(7, 4, C('gray', 7)).set(8, 5, C('gray', 7));
    micro(p, 3, 14, '2026', C('red', 3));
  } else {
    // Dex's own project: a "pocket telephone". The judges have their doubts.
    p.rect(8, 3, 4, 10, C('gray', 1)).rect(9, 4, 2, 2, C('neon', 2)).line(11, 3, 12, 0, C('gray', 2));
    for (let y = 7; y < 12; y += 2) p.set(9, y, C('gray', 5)).set(10, y, C('gray', 5));
    micro(p, 1, 14, 'PHONE', C('denim', 1));
  }
  return p;
}

function judgeTable(done: boolean, label = 'PAGES'): Pixels {
  const p = on('gym');
  p.rect(0, 4, 20, 14, C('denim', 2)).rect(0, 4, 20, 3, C('denim', 4));
  // the card runs edge to edge: PAGES and COVER take 19 of the block's 20 pixels
  p.rect(0, 9, 20, 6, C('paper', 2));
  micro(p, 1, 10, done ? 'OK!' : label, done ? C('green', 2) : C('red', 3));
  if (!done) micro(p, 2, 14, 'HERE', C('denim', 1));
  void PAGES_NEEDED;
  return p;
}

function podium(): Pixels {
  const p = on('gym');
  p.rect(3, 6, 14, 13, C('gold', 3)).rect(3, 6, 14, 3, C('gold', 5));
  micro(p, 8, 8, '1', C('gold', 1), 2);
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

/** The school's copier, seen from above: a gray body, the glass and a green PRINT button. */
function copier(): Pixels {
  const p = on('gym');
  p.rect(1, 2, 18, 17, C('chrome', 3)).rect(1, 2, 18, 2, C('chrome', 5)).rect(1, 17, 18, 2, C('chrome', 1));
  p.rect(3, 5, 10, 7, C('glass', 2)).rect(4, 6, 5, 1, C('glass', 4));
  p.rect(14, 6, 3, 3, C('green', 3)).rect(14, 10, 3, 1, C('red', 3));
  micro(p, 3, 13, 'COPY', C('night', 1));
  return p;
}

/** The copier's out tray on the gym floor, where its pages land. */
function copierTray(): Pixels {
  const p = on('gym');
  p.rect(2, 0, 16, 9, C('chrome', 2)).rect(3, 0, 14, 7, C('chrome', 4)).rect(2, 8, 16, 1, C('chrome', 1));
  return p;
}

/**
 * Spare covers beside the copier: a SPARE card over two blank covers on the gym floor. Touch it
 * for one cover page, in case a stray zap burned Sparky's. The COVER table takes only one, so a
 * second cover changes nothing, and it scores nothing.
 */
function spareCovers(): Pixels {
  const p = on('gym');
  p.rect(0, 0, 20, 7, C('paper', 2));
  micro(p, 1, 1, 'SPARE', C('red', 3));
  p.rect(6, 10, 12, 9, C('denim', 1)).rect(5, 9, 12, 9, C('sky', 4));
  p.rect(3, 8, 12, 10, C('sky', 6)).rect(3, 8, 12, 2, C('denim', 2));
  p.set(12, 13, C('gold', 4)).set(11, 14, C('gold', 4)).set(12, 14, C('gold', 4)).set(13, 14, C('gold', 4)).set(12, 15, C('gold', 4));
  return p;
}

function volcanoSpawner(): Pixels {
  return project('volcano');
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
  addBig(s, 'bbMoon', billboard(['CRATER CAFE', 'A 3-COURSE', 'MEAL IN 1 PILL'], 'gold', 'red', FLOORS.moon));
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
  s.add('proj6502', project('cpu6502'), { solid: SOLID, next: 'proj6502b', ntime: 5 });
  s.add('proj6502b', project('cpu6502b'), { solid: SOLID, next: 'proj6502', ntime: 5 });
  s.add('proj1802', project('cpu1802'), { solid: SOLID });
  s.add('capsule', project('capsule'), { solid: SOLID });
  s.add('judgetable', judgeTable(false), { solid: SOLID, effect: CTR.pages, eamt: -PAGES_NEEDED, score: 5000, touch: 'judgedone' });
  s.add('judgedone', judgeTable(true));
  s.add('covertable', judgeTable(false, 'COVER'), { solid: SOLID, effect: CTR.cover, eamt: -1, score: 5000, touch: 'judgedone' });
  s.add('podium', podium());
  addBig(s, 'banner', banner('SCIENCE FAIR 2000', 8, 1, 'denim', 'gold'));
  // How to finish: the cover page from Sparky, and pages from the copier when you are short
  // (its tray prints a page every few seconds, MON.page), so no player reaches the fair stuck;
  // beside the copier, one spare cover for a player whose cover a stray zap burned.
  const gymFloor = FLOORS.gym;
  addBig(s, 'bbSparky', billboard(['ZAP SPARKY 3 TIMES', 'FOR THE COVER PAGE!', 'NEEDS THE ZAPPER', 'AND BATTERIES.'], 'denim', 'gold', gymFloor, 5, 6));
  addBig(s, 'bbCopier', billboard(['SHORT ON PAGES?', 'WAIT AT THE COPIER.', 'IT PRINTS ONE EVERY', 'FEW SECONDS.'], 'purple', 'gold', gymFloor, 5, 6));
  s.add('copier', copier(), { solid: SOLID });
  s.add('copiertray', copierTray(), { birthMon: MON.page, birthTime: COPY_TICKS });
  s.add('sparecover', spareCovers(), { effect: CTR.cover, eamt: 1, touch: 'gym' });
  // the save sign (kit/saveSign.ts), standing in the dust by the landing spot
  const dust = s.pic('moon');
  const sign = saveSignBlocks(PAL.pal, { board: [dust, dust], posts: [dust, dust] });
  [...sign.board, ...sign.posts!].forEach((p, k) => s.add(`saveSign${k}`, p));
  addEgg(s, 'moon');
  return s;
}
