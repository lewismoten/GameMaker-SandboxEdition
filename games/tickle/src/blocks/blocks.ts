// TICKLE.BBL: every background block, drawn in code, seen from the side. A block's number is
// the order it was added (by name here); the attributes are the game:
//   - air falls (gravity down): Doc Leo hops with an upward push each tick Up is held;
//   - ledges (desk tops, cage racks, lab benches, pipes, tower steps) hold you up and let you hop
//     up through them;
//   - steam over a sewer grate lifts (gravity up); a ladder has no gravity, so Up and Down climb;
//   - Bunsen flames, Tesla coils and Jacob's ladders while they arc, and the sewer water, cost
//     rapport (hit points);
//   - yogurt drops and cheese are points, a cup of coffee mends rapport, a rubber chicken on a
//     leash (Doc Leo's own) is an extra life;
//   - each level's door is a Dutch door: the top half open, the bottom half shut so the rats stay
//     in. The bottom half only opens for a laughing carpet big enough (counter 20, all game long),
//     and gives the rats straight back as Doc Leo steps through.
import { CLEAR, joeCameo } from '../../../kit/cameos';
import { chezSide } from '../../../kit/chez';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { Pixels, rng } from '../../../kit/pixels';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { blob, shadeAt, speckle } from '../../../snowbound/src/art/draw';
import { micro, microWidth } from '../../../snowbound/src/art/font';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import { buildPalette, type Pal } from '../art/pal';
import { CARPET, NEEDED } from '../ids';

export { BlockBook, SOLID };
/** Solid on top only: stand on it, hop up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, down: 4 } as const;
const LIFE = 1;
/** Ticks a Tesla coil rests, and arcs. */
export const COIL_REST = 40;
export const COIL_ARC = 14;

/** The four places, each with its own wall behind everything. */
export type Area = 'course' | 'lab' | 'sewer' | 'tower';
export const AREAS: Area[] = ['course', 'lab', 'sewer', 'tower'];

export function buildBlocks(pal: Pal): BlockBook {
  const book = new BlockBook();
  const { r: R, c } = pal;
  const P = () => new Pixels(20, 20);
  const air = { grav: GRAV.down };

  // ---------- the walls behind everything, one per place ----------
  const walls: Record<Area, () => Pixels> = {
    // the night classroom: warm plaster above a wainscot
    course: () => {
      const p = speckle(P(), 0, 0, 20, 20, R('sky'), 3, 1, 3, 0.18);
      return p;
    },
    // the lab: white tiles, grout lines
    lab: () => {
      const p = speckle(P(), 0, 0, 20, 20, R('tile'), 2, 1, 5, 0.12);
      p.rect(0, 9, 20, 1, c('tile', 0)).rect(9, 0, 1, 20, c('tile', 0)).rect(0, 19, 20, 1, c('tile', 0)).rect(19, 0, 1, 20, c('tile', 0));
      return p;
    },
    // the sewer: old brick, slick and green
    sewer: () => {
      const p = speckle(P(), 0, 0, 20, 20, R('brick'), 1, 1, 7, 0.3);
      for (let row = 0; row < 4; row++) {
        p.rect(0, row * 5 + 4, 20, 1, c('slime', 0));
        for (let k = 0; k < 3; k++) p.rect(((row % 2) * 5 + k * 10) % 20, row * 5, 1, 4, c('slime', 0));
      }
      return p;
    },
    // the tower: big dark stones
    tower: () => {
      const p = speckle(P(), 0, 0, 20, 20, R('stone'), 1, 1, 9, 0.25);
      p.rect(0, 9, 20, 1, c('stone', 0)).rect(0, 19, 20, 1, c('stone', 0)).rect(6, 0, 1, 9, c('stone', 0)).rect(15, 10, 1, 9, c('stone', 0));
      p.rect(0, 0, 20, 1, c('stone', 2)).rect(0, 10, 20, 1, c('stone', 2));
      return p;
    },
  };
  const wall = (a: Area) => walls[a]();

  // the classroom's wainscot (the lower wall), the wall plain
  book.add('wallC', wall('course'), air);
  const wains = () => {
    const p = speckle(P(), 0, 0, 20, 20, R('wood'), 2, 1, 11, 0.2);
    p.rect(0, 0, 20, 2, c('wood', 3)).rect(0, 2, 20, 1, c('wood', 0));
    for (const x of [1, 11]) p.frame(x, 5, 8, 12, c('wood', 1));
    return p;
  };
  book.add('wainsC', wains(), air);
  book.add('wallL', wall('lab'), air);
  book.add('wallS', wall('sewer'), air);
  book.add('wallT', wall('tower'), air);

  // ---------- floors, ceilings and solid walls ----------
  const planks = () => {
    const p = speckle(P(), 0, 0, 20, 20, R('wood'), 1, 1, 13, 0.25);
    p.rect(0, 0, 20, 3, c('wood', 3)).rect(0, 3, 20, 1, c('wood', 0));
    for (let y = 8; y < 20; y += 6) p.rect(0, y, 20, 1, c('wood', 0));
    return p;
  };
  book.add('floorW', planks(), { solid: SOLID });
  const under = speckle(P(), 0, 0, 20, 20, R('stone'), 0, 1, 15, 0.3);
  book.add('under', under, { solid: SOLID });
  const ceil = (a: Area) => {
    const p = a === 'lab' ? speckle(P(), 0, 0, 20, 20, R('steel'), 1, 1, 17, 0.2) : a === 'course' ? speckle(P(), 0, 0, 20, 20, R('wood'), 0, 1, 18, 0.2) : under.crop(0, 0, 20, 20);
    if (a === 'lab') p.rect(2, 14, 16, 4, c('glass', 2)).rect(2, 18, 16, 1, c('steel', 0)).rect(3, 15, 14, 2, c('paint', 1));
    if (a === 'course') p.rect(0, 17, 20, 3, c('wood', 2)).rect(0, 19, 20, 1, c('wood', 0));
    return p;
  };
  book.add('ceilC', ceil('course'), { solid: SOLID });
  book.add('ceilL', ceil('lab'), { solid: SOLID });
  // the lab's floor: checkered vinyl
  const vinyl = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) vinyl.set(x, y, (Math.floor(x / 10) + Math.floor(y / 10)) % 2 ? c('tile', 3) : c('grey', 1));
  vinyl.rect(0, 0, 20, 1, c('paint', 0));
  book.add('floorL', vinyl, { solid: SOLID });
  // the sewer's walkway and its stone, the tower's stone
  const walk = speckle(P(), 0, 0, 20, 20, R('stone'), 2, 1, 19, 0.3);
  walk.rect(0, 0, 20, 3, c('stone', 3)).rect(0, 3, 20, 1, c('stone', 0)).rect(0, 4, 20, 1, c('slime', 2));
  book.add('walkS', walk, { solid: SOLID });
  book.add('stoneS', speckle(P(), 0, 0, 20, 20, R('stone'), 1, 1, 21, 0.3), { solid: SOLID });
  const block = speckle(P(), 0, 0, 20, 20, R('stone'), 2, 1, 23, 0.25);
  block.rect(0, 0, 20, 2, c('stone', 4)).rect(0, 19, 20, 1, c('stone', 0)).rect(19, 0, 1, 20, c('stone', 0)).rect(0, 9, 20, 1, c('stone', 0));
  book.add('blockT', block, { solid: SOLID });

  // ---------- ledges: stand on them, hop up through them ----------
  const ledge = (bg: Pixels, draw: (p: Pixels) => void) => (draw(bg), bg);
  // a classroom desk top (and its legs below), on the wainscot it stands against; the desks'
  // ends have legs down to the leg blocks under them, the tops between them (deskMid) none
  const deskTop = (legs: boolean) =>
    ledge(wains(), (p) => {
      p.rect(0, 1, 20, 4, c('wood', 3)).rect(0, 1, 20, 1, c('wood', 2)).rect(0, 5, 20, 1, c('wood', 0));
      if (legs) p.rect(2, 6, 2, 14, c('wood', 1)).rect(16, 6, 2, 14, c('wood', 1));
    });
  book.add('desk', deskTop(true), { solid: LEDGE, grav: GRAV.down });
  const deskLeg = wains();
  deskLeg.rect(2, 0, 2, 20, c('wood', 1)).rect(16, 0, 2, 20, c('wood', 1)).rect(2, 0, 16, 2, c('wood', 2));
  book.add('deskLeg', deskLeg, air);
  // a rack of rat cages: the wire front (scenery) and its top to stand on
  const cage = (top: boolean) => {
    const p = wall('lab');
    p.rect(0, top ? 4 : 0, 20, top ? 16 : 20, c('steel', 1));
    for (let y = top ? 6 : 1; y < 18; y++) for (let x = 1; x < 19; x++) p.set(x, y, (x % 3 === 0 || y % 4 === 0) ? c('steel', 3) : y > 13 ? c('agouti', 4) : c('sky', 1));
    if (top) p.rect(0, 1, 20, 3, c('steel', 4)).rect(0, 4, 20, 1, c('steel', 0));
    p.rect(0, 18, 20, 2, c('steel', 2));
    return p;
  };
  book.add('cage', cage(false), air);
  book.add('cageTop', cage(true), { solid: LEDGE, grav: GRAV.down });
  // a steel lab bench top (and the legs and shelf under it); benchMid between the ends, no legs
  const benchTop = (legs: boolean) =>
    ledge(wall('lab'), (p) => {
      p.rect(0, 1, 20, 4, c('steel', 3)).rect(0, 1, 20, 1, c('steel', 4)).rect(0, 5, 20, 1, c('steel', 0));
      if (legs) p.rect(1, 6, 2, 14, c('steel', 1)).rect(17, 6, 2, 14, c('steel', 1));
    });
  book.add('bench', benchTop(true), { solid: LEDGE, grav: GRAV.down });
  const benchLeg = wall('lab');
  benchLeg.rect(1, 0, 2, 20, c('steel', 1)).rect(17, 0, 2, 20, c('steel', 1)).rect(1, 10, 18, 2, c('steel', 2));
  book.add('benchLeg', benchLeg, air);
  // a sewer pipe running along the wall
  book.add(
    'pipe',
    ledge(wall('sewer'), (p) => {
      for (let y = 1; y < 8; y++) p.rect(0, y, 20, 1, shadeAt(R('steel'), 0, 3, 1 - Math.abs(y - 3) / 4, 0, y));
      p.rect(0, 8, 20, 1, c('ink', 0)).rect(14, 0, 3, 9, c('steel', 2));
    }),
    { solid: LEDGE, grav: GRAV.down },
  );
  // a tower step jutting from the wall
  book.add(
    'ledgeT',
    ledge(wall('tower'), (p) => {
      speckle(p, 0, 1, 20, 5, R('stone'), 3, 1, 25, 0.3);
      p.rect(0, 1, 20, 1, c('stone', 4)).rect(0, 6, 20, 1, c('ink', 0));
      for (const x of [3, 15]) p.line(x, 7, x + 2, 11, c('stone', 1));
    }),
    { solid: LEDGE, grav: GRAV.down },
  );

  // ---------- the classroom (the course) ----------
  // the chalkboard, with the lesson on it
  const board = (lines: string[]) => {
    const p = speckle(P(), 0, 0, 20, 20, R('chalk'), 1, 1, 27, 0.2);
    lines.forEach((l, i) => micro(p, Math.max(1, Math.round((20 - microWidth(l)) / 2)), 2 + i * 6, l, c('paper', 2)));
    return p;
  };
  book.add('board1', board(['1.', 'NAPE']), air);
  book.add('board2', board(['2.', 'PIN']), air);
  book.add('board3', board(['3.', 'TICK', 'LE']), air);
  book.add('board4', board(['50', 'KHZ', ':)']), air);
  const tray = board(['', '', '']);
  tray.rect(0, 16, 20, 4, c('wood', 2)).rect(0, 16, 20, 1, c('wood', 3)).rect(5, 15, 4, 1, c('paper', 2));
  book.add('boardTray', tray, air);
  // a night window
  const night = (bg: Pixels, seed: number) => {
    bg.rect(2, 2, 16, 16, c('wood', 1));
    for (let y = 3; y < 17; y++) for (let x = 3; x < 17; x++) bg.set(x, y, shadeAt(R('blue'), 0, 1, y / 30, x, y));
    const r = rng(seed);
    for (let i = 0; i < 4; i++) bg.set(4 + Math.floor(r() * 12), 4 + Math.floor(r() * 7), c('paper', 2));
    bg.disc(13, 6, 2, c('paper', 1)).disc(14, 5, 1.6, c('blue', 0));
    bg.rect(9, 3, 1, 14, c('wood', 1)).rect(3, 9, 14, 1, c('wood', 1));
    return bg;
  };
  book.add('windowC', night(wall('course'), 31), air);
  // the clock: well past midnight
  const clock = wall('course');
  clock.disc(10, 10, 6, c('wood', 1)).disc(10, 10, 5, c('paper', 2)).line(10, 10, 10, 6, c('ink', 0)).line(10, 10, 13, 11, c('ink', 0));
  book.add('clockC', clock, air);
  // the course on the TV cart (the VCR's tape: "RAT TICKLING, SELF-PACED")
  const tv = (f: number) => {
    const p = wains();
    p.rect(2, 1, 16, 12, c('ink', 0)).rect(3, 2, 14, 10, f ? c('blue', 2) : c('blue', 1));
    blob(p, 9 + f, 9, 3, 1.6, R('rat'), 2, 4);
    p.set(12 + f, 8, c('eye', 1));
    if (f) p.line(5, 4, 8, 6, c('skin', 3)).line(6, 3, 9, 5, c('skin', 3));
    p.rect(1, 13, 18, 2, c('steel', 2)).rect(3, 15, 2, 5, c('steel', 1)).rect(15, 15, 2, 5, c('steel', 1));
    return p;
  };
  book.add('tv0', tv(0), { ...air, next: 'tv1', ntime: 9 });
  book.add('tv1', tv(1), { ...air, next: 'tv0', ntime: 9 });
  // signs on the wall: the keys
  const sign = (bg: Pixels, a: string, b: string) => {
    bg.rect(1, 3, 18, 14, c('wood', 1)).rect(2, 4, 16, 12, c('paper', 2));
    micro(bg, Math.round((20 - microWidth(a)) / 2), 5, a, c('red', 1));
    micro(bg, Math.round((20 - microWidth(b)) / 2), 11, b, c('ink', 0));
    return bg;
  };
  book.add('signPin', sign(wall('course'), 'Z', 'PIN'), air);
  book.add('signTickle', sign(wall('course'), 'X', 'TKL'), air);
  book.add('signFirst', sign(wall('course'), 'PIN', '1ST!'), air);
  book.add('signHop', sign(wall('course'), 'UP', 'HOP'), air);
  // a Bunsen burner on a desk: its flame costs rapport
  const bunsen = (f: number) => {
    const p = wall('course');
    p.rect(6, 17, 8, 3, c('steel', 2)).rect(9, 10, 2, 7, c('steel', 3));
    for (let k = 0; k < 3; k++) {
      const h = 6 + ((k * 2 + f * 3) % 4);
      for (let y = 0; y < h; y++) p.set(8 + k + Math.round(Math.sin((y + f * 2 + k) / 2) * 0.8), 9 - y, c(y < h / 2 ? 'spark' : 'flame', 3 - Math.floor((y / h) * 3)));
    }
    return p;
  };
  book.add('bunsen0', bunsen(0), { hp: -5, grav: GRAV.down, next: 'bunsen1', ntime: 4 });
  book.add('bunsen1', bunsen(1), { hp: -5, grav: GRAV.down, next: 'bunsen0', ntime: 4 });

  // ---------- the lab ----------
  // a Tesla coil: it rests, then arcs (and only the arc costs rapport)
  const coil = (arc: number) => {
    const p = wall('lab');
    p.rect(6, 15, 8, 5, c('steel', 1)).rect(8, 5, 4, 10, c('wood', 2));
    for (let y = 5; y < 15; y += 2) p.rect(8, y, 4, 1, c('crust', 3));
    blob(p, 10, 3, 5, 2.6, R('steel'), 2, 4);
    if (arc) {
      const r = rng(arc * 7);
      for (let k = 0; k < 3; k++) {
        let x = 10;
        let y = 3;
        const dir = k - 1;
        for (let s = 0; s < 8; s++) {
          const nx = x + dir * 1.4 + (r() - 0.5) * 2;
          const ny = y + (r() - 0.3) * 2.4;
          p.line(x, y, nx, ny, c('spark', s < 3 ? 3 : 2));
          x = nx;
          y = ny;
        }
      }
    }
    return p;
  };
  book.add('coil', coil(0), { grav: GRAV.down, next: 'coilArc0', ntime: COIL_REST });
  book.add('coilArc0', coil(1), { hp: -8, grav: GRAV.down, next: 'coilArc1', ntime: COIL_ARC / 2 });
  book.add('coilArc1', coil(2), { hp: -8, grav: GRAV.down, next: 'coil', ntime: COIL_ARC / 2 });
  // the bat detector on the wall: its needle swings between 22 and 50 kHz
  const detector = (f: number) => {
    const p = wall('lab');
    p.rect(2, 3, 16, 14, c('steel', 1)).rect(3, 4, 14, 8, c('paper', 2));
    micro(p, 3, 13, '22', c('blue', 2));
    micro(p, 11, 13, '50', c('red', 2));
    const a = f ? -0.5 : -2.4;
    p.line(10, 11, 10 + Math.cos(a) * 6, 11 + Math.sin(a) * 6, c('ink', 0));
    p.set(16, 3, f ? c('potion', 3) : c('red', 3));
    return p;
  };
  book.add('detector0', detector(0), { ...air, next: 'detector1', ntime: 22 });
  book.add('detector1', detector(1), { ...air, next: 'detector0', ntime: 30 });
  // flasks bubbling on a bench (scenery)
  const flask = (f: number) => {
    const p = wall('lab');
    for (let y = 6; y < 19; y++) {
      const w = y < 11 ? 2 : 2 + (y - 11) * 0.8;
      for (let x = Math.round(10 - w); x <= 10 + w; x++) p.set(x, y, y > 11 ? c('potion', 1 + ((x + y + f) % 3 === 0 ? 2 : 0)) : c('glass', 2));
    }
    for (const [x, y] of [[9 + f, 4 - f], [11 - f, 2 + f], [10, 0 + f * 2]]) p.set(x, y, c('potion', 3));
    return p;
  };
  book.add('flask0', flask(0), { ...air, next: 'flask1', ntime: 6 });
  book.add('flask1', flask(1), { ...air, next: 'flask0', ntime: 6 });
  // the open window out of the lab (the way out: the city's lights)
  const out = wall('lab');
  out.rect(1, 0, 18, 20, c('steel', 2));
  for (let y = 1; y < 20; y++) for (let x = 2; x < 18; x++) out.set(x, y, shadeAt(R('blue'), 0, 2, y / 26, x, y));
  for (const [x, y] of [[4, 14], [7, 12], [12, 15], [15, 11], [5, 6]]) out.rect(x, y, 2, 2, c('cheese', 2));
  book.add('windowL', out, air);
  // a lab poster: "TICKLE FIRST, DATA LATER"
  const poster = wall('lab');
  poster.rect(2, 1, 16, 18, c('paper', 2)).frame(2, 1, 16, 18, c('steel', 1));
  micro(poster, 3, 3, 'TKL', c('red', 1));
  micro(poster, 3, 9, '1ST', c('red', 1));
  blob(poster, 10, 16, 4, 1.6, R('rat'), 2, 4);
  book.add('posterL', poster, air);

  // ---------- the sewers ----------
  // the water: it costs rapport (and pulls you down into it)
  const water = (f: number) => {
    const p = wall('sewer');
    for (let y = 6; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('slime', y === 6 ? 3 : (x + y * 2 + f * 3) % 7 === 0 ? 2 : 1));
    return p;
  };
  book.add('water0', water(0), { hp: -3, grav: GRAV.down, next: 'water1', ntime: 6 });
  book.add('water1', water(1), { hp: -3, grav: GRAV.down, next: 'water0', ntime: 6 });
  const deep = (f: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('slime', (x + y * 2 + f * 3) % 9 === 0 ? 2 : 0));
    return p;
  };
  book.add('deep', deep(0), { solid: SOLID });
  // a grate in the floor, and the steam out of it that lifts you up
  const grate = walk.crop(0, 0, 20, 20);
  grate.rect(2, 0, 16, 4, c('ink', 0));
  for (let x = 3; x < 18; x += 3) grate.rect(x, 0, 1, 4, c('steel', 2));
  book.add('grate', grate, { solid: SOLID });
  const steam = (f: number) => {
    const p = wall('sewer');
    for (let k = 0; k < 3; k++) {
      const x = 4 + k * 6;
      for (let y = 0; y < 20; y++) if ((y + f * 5 + k * 4) % 10 < 5) p.set(x + Math.round(Math.sin((y + k) / 3) * 1.5), y, c('paper', 1)).set(x + 1 + Math.round(Math.sin((y + k) / 3) * 1.5), y, c('grey', 3));
    }
    return p;
  };
  book.add('steam0', steam(0), { grav: GRAV.up, next: 'steam1', ntime: 5 });
  book.add('steam1', steam(1), { grav: GRAV.up, next: 'steam0', ntime: 5 });
  // the ladder up to the manhole (no gravity: climb), and the light at the top
  const ladder = (bg: Pixels) => {
    bg.rect(4, 0, 2, 20, c('steel', 2)).rect(14, 0, 2, 20, c('steel', 2));
    for (let y = 2; y < 20; y += 5) bg.rect(4, y, 12, 2, c('steel', 3));
    return bg;
  };
  book.add('ladder', ladder(wall('sewer')), { grav: GRAV.none });
  const manhole = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) manhole.set(x, y, shadeAt(R('cheese'), 0, 2, 1 - y / 24, x, y));
  ladder(manhole);
  book.add('manhole', manhole, { grav: GRAV.none });
  // an arch into the dark (scenery)
  const arch = wall('sewer');
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x - 10) ** 2 / 64 + ((y - 20) ** 2) / 300 < 1) arch.set(x, y, c('ink', 0));
  book.add('archS', arch, air);
  // a drain spout dribbling (scenery)
  const spout = wall('sewer');
  spout.rect(0, 4, 8, 5, c('steel', 1)).rect(0, 4, 8, 1, c('steel', 3));
  for (let y = 9; y < 20; y += 2) spout.set(6, y, c('slime', 3));
  book.add('spout', spout, air);

  // ---------- the tower ----------
  // a window: the storm outside, and now and then the lightning
  const storm = (flash: boolean) => {
    const p = wall('tower');
    p.rect(4, 1, 12, 18, c('stone', 0));
    for (let y = 2; y < 19; y++) for (let x = 5; x < 15; x++) if ((x - 10) ** 2 / 25 + Math.max(0, 7 - y) ** 2 / 25 < 1 || y >= 7) p.set(x, y, flash ? c('paper', 2) : shadeAt(R('blue'), 0, 1, y / 30, x, y));
    if (flash) p.line(11, 3, 8, 9, c('spark', 1)).line(8, 9, 11, 11, c('spark', 1)).line(11, 11, 7, 18, c('spark', 1));
    p.rect(9, 2, 2, 17, c('stone', 1));
    return p;
  };
  book.add('windowT', storm(false), { ...air, next: 'windowF', ntime: 70 });
  book.add('windowF', storm(true), { ...air, next: 'windowT', ntime: 3 });
  // a Jacob's ladder: a spark climbs its two rods, and costs rapport when it is low enough to touch
  const jacob = (f: number) => {
    const p = wall('tower');
    p.rect(3, 17, 14, 3, c('steel', 1));
    p.line(6, 17, 4, 1, c('steel', 3)).line(14, 17, 16, 1, c('steel', 3));
    if (f > 0) {
      const y = 16 - f * 5;
      const half = 4 + f;
      p.line(10 - half, y, 10, y - 2, c('spark', 3)).line(10, y - 2, 10 + half, y, c('spark', 3)).line(10 - half, y + 1, 10 + half, y + 1, c('spark', 1));
    }
    return p;
  };
  book.add('jacob0', jacob(0), { grav: GRAV.down, next: 'jacob1', ntime: 26 });
  book.add('jacob1', jacob(1), { hp: -6, grav: GRAV.down, next: 'jacob2', ntime: 5 });
  book.add('jacob2', jacob(2), { hp: -6, grav: GRAV.down, next: 'jacob3', ntime: 5 });
  book.add('jacob3', jacob(3), { grav: GRAV.down, next: 'jacob0', ntime: 5 });
  // a banner with the empire's crest: a laughing rat over crossed hands
  const banner = wall('tower');
  banner.rect(4, 0, 12, 17, c('purple', 1)).rect(4, 0, 12, 1, c('gold', 1));
  for (let x = 4; x < 16; x++) banner.set(x, 17 + (x % 3 === 0 ? 1 : 0), c('purple', 1));
  blob(banner, 10, 8, 4, 3, R('rat'), 2, 4);
  banner.set(12, 7, c('eye', 1)).set(9, 9, c('pink', 1)).line(6, 13, 14, 13, c('gold', 2));
  book.add('banner', banner, air);
  // the balcony: where the laughing carpet will bow
  const balcony = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) balcony.set(x, y, shadeAt(R('purple'), 0, 2, y / 22, x, y));
  for (let x = 0; x < 20; x += 4) balcony.rect(x, 12, 2, 8, c('stone', 3));
  balcony.rect(0, 11, 20, 2, c('stone', 4));
  book.add('balcony', balcony, air);

  // ---------- things to find (on each place's wall) ----------
  const items = (a: Area, bgName: string) => {
    // yogurt drops: points (rat treats)
    const drops = wall(a);
    for (const [x, y] of [[6, 12], [11, 9], [14, 14], [9, 15]]) blob(drops, x, y, 2.2, 1.8, R('paper'), 0, 2).set(x, y - 1, c('pink', 2));
    book.add(`drops.${a}`, drops, { score: 10, touch: bgName, ...air });
    // a cup of coffee: rapport back
    const coffee = wall(a);
    coffee.rect(6, 9, 8, 9, c('paper', 2)).rect(7, 10, 6, 2, c('coffee', 1)).rect(14, 11, 2, 4, c('paper', 1)).rect(5, 18, 10, 1, c('paper', 0));
    for (const [x, y] of [[8, 6], [10, 4], [12, 6]]) coffee.set(x, y, c('grey', 3)).set(x + 1, y - 1, c('grey', 2));
    book.add(`coffee.${a}`, coffee, { hp: 20, score: 10, touch: bgName, ...air });
    // Doc Leo's rubber chicken on its leash: an extra life
    const chicken = wall(a);
    blob(chicken, 10, 12, 5, 3.4, R('cheese'), 0, 2);
    blob(chicken, 15, 8, 2.4, 2.4, R('cheese'), 0, 2);
    chicken.set(16, 7, c('ink', 0)).rect(17, 8, 2, 1, c('flame', 2)).set(15, 5, c('red', 2)).set(16, 5, c('red', 2));
    chicken.rect(9, 9, 6, 2, c('red', 1)).line(6, 11, 1, 3, c('red', 2));
    micro(chicken, 1, 15, '+1', c('ink', 0));
    book.add(`chicken.${a}`, chicken, { effect: LIFE, eamt: 1, score: 100, touch: bgName, ...air });
  };
  items('course', 'wallC');
  items('lab', 'wallL');
  items('sewer', 'wallS');
  items('tower', 'wallT');
  // cheese in the sewers: a big wedge of points
  const cheese = wall('sewer');
  for (let y = 9; y < 18; y++) cheese.rect(4 + Math.round((17 - y) * 0.6), y, 14 - Math.round((17 - y) * 0.6), 1, c('cheese', y === 9 ? 2 : 1));
  for (const [x, y] of [[10, 13], [14, 15], [8, 16]]) cheese.set(x, y, c('cheese', 0));
  book.add('cheese', cheese, { score: 50, touch: 'wallS', ...air });

  // ---------- the doors: a Dutch door, the bottom half shut until the carpet is big enough ----------
  NEEDED.forEach((need, i) => {
    const a = AREAS[i];
    const frame = (p: Pixels) => p.rect(0, 0, 2, 20, c('wood', 1)).rect(18, 0, 2, 20, c('wood', 1));
    // the top half, open (scenery)
    const top = wall(a);
    frame(top).rect(0, 0, 20, 2, c('wood', 1));
    book.add(`doorTop${i}`, top, air);
    // the bottom half: it asks for the carpet
    const shut = wall(a);
    frame(shut).rect(2, 1, 16, 19, c('wood', 2)).rect(2, 1, 16, 2, c('wood', 3)).frame(4, 6, 12, 11, c('wood', 1));
    const label = String(need);
    micro(shut, Math.round((20 - microWidth(label)) / 2), 8, label, c('gold', 3));
    blob(shut, 10, 15, 3, 1.4, R('rat'), 2, 4);
    book.add(`gate${i}`, shut, { solid: SOLID, effect: CARPET, eamt: -need, score: 250 * (i + 1), touch: `gateOpen${i}` });
    // swung open: stepping through gives the rats straight back
    const open = wall(a);
    frame(open).rect(14, 1, 4, 19, c('wood', 2));
    book.add(`gateOpen${i}`, open, { effect: CARPET, eamt: need, touch: `gatePast${i}`, ...air });
    const past = wall(a);
    frame(past).rect(14, 1, 4, 19, c('wood', 2));
    book.add(`gatePast${i}`, past, air);
  });
  // the exit beyond each door (the link sits on it)
  const exit = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) exit.set(x, y, shadeAt(R('cheese'), 0, 2, 0.4 + Math.sin((x + y) / 3) * 0.2, x, y));
  book.add('exit', exit, { grav: GRAV.none });
  // (last, so every other block keeps its number) the desk and bench tops between their ends
  book.add('deskMid', deskTop(false), { solid: LEDGE, grav: GRAV.down });
  book.add('benchMid', benchTop(false), { solid: LEDGE, grav: GRAV.down });
  // (last too) the classroom's wide window onto the parking lot: THE CHEZ, Doc Leo's red
  // CitiCar, waits under the lamp on the charger's cord while he takes the course
  const lotWin = new Pixels(40, 20);
  lotWin.blit(wall('course'), 0, 0).blit(wall('course'), 20, 0);
  lotWin.rect(1, 2, 38, 16, c('wood', 1));
  for (let y = 3; y < 17; y++) for (let x = 2; x < 38; x++) lotWin.set(x, y, y < 13 ? shadeAt(R('blue'), 0, 1, y / 30, x, y) : shadeAt(R('grey'), 0, 1, 0.2 + (y - 13) / 10, x, y));
  const st = rng(37);
  for (let i = 0; i < 6; i++) lotWin.set(3 + Math.floor(st() * 34), 4 + Math.floor(st() * 4), c('paper', 2));
  lotWin.rect(2, 13, 36, 1, c('grey', 2));
  // the lamp and its pool of light on the asphalt
  for (let x = 22; x < 38; x++) for (let y = 13; y < 17; y++) if (Math.abs(x - 33) < 6 - (y - 13)) lotWin.set(x, y, shadeAt(R('cheese'), 0, 1, 0.3, x, y));
  lotWin.rect(34, 5, 1, 9, c('grey', 1)).rect(31, 4, 4, 1, c('grey', 1)).rect(31, 5, 3, 1, c('cheese', 2));
  // the charger, its green light, and the cord to the car's port
  lotWin.rect(28, 10, 2, 5, c('grey', 2)).set(28, 11, c('potion', 3));
  const port = chezSide(lotWin, 6, 6, {
    body: [c('red', 1), c('red', 2), c('red', 3)],
    trim: c('red', 0),
    glass: [c('navy', 0), c('glass', 0)],
    roof: c('ink', 1),
    tire: c('ink', 0),
    hub: c('grey', 3),
    rim: c('paper', 2),
    stripe: c('ink', 1),
    bumper: c('grey', 0),
    lamp: c('paper', 2),
    tail: c('flame', 1),
  }, 'left', 0.5);
  lotWin.line(port.portX + 1, port.portY, 27, 11, c('ink', 0));
  lotWin.rect(1, 17, 38, 1, c('wood', 3));
  book.add('windowLotL', lotWin.crop(0, 0, 20, 20), air);
  book.add('windowLotR', lotWin.crop(20, 0, 20, 20), air);

  // (last too) a tin heart on the tower's floor, tucked in the far corner under the dean's ledge:
  // a glint crosses it now and then; 100 points
  const tin = { ink: c('ink', 0), tin: [c('steel', 1), c('steel', 2), c('steel', 4)], white: c('paint', 1), dark: c('steel', 0) };
  for (let k = 0; k < SHINE_FRAMES; k++)
    book.add(`tinHeart${k || ''}`, drawTinHeart(wall('tower'), tin, k), { next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`, ntime: k ? 2 : 50, touch: 'wallT', score: 100, ...air });
  // a dyed Easter egg rolled under the lab's first bench: 50 points
  const egg = { ink: c('ink', 0), shell: R('pink'), paint: R('blue').slice(1), accent: c('gold', 3), white: c('paint', 1) };
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    book.add(`easterEgg${k || ''}`, drawEasterEgg(wall('lab'), egg, 'dots', k), { next: `easterEgg${(k + 1) % EGG_SHINE_FRAMES || ''}`, ntime: k ? 3 : 60, touch: 'wallL', score: 50, ...air });
  // Mystery Robot Joe (Keep It Brief!), the tin box night librarian, keeping count of the course's
  // rats by the chalkboard (scenery: walk right past him)
  book.add('joe', wains().blit(joeCameo(buildPalette('plain').pal, 'down', 0, { use: ['ink', 'steel', 'grey', 'paint', 'glass', 'red', 'navy', 'gold', 'nose'].flatMap((n) => R(n)) }), 0, 0, CLEAR), air);
  return book;
}
