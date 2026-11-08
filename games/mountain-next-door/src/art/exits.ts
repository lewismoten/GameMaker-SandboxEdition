// The ways out of each place, in the trail guide's woodcut (each 20 x 40, top block then bottom), so no level ends
// at a door standing alone in a field:
//   cairn    outdoors: a trail crew's cairn of fieldstones with a marker post in it, blazed twice
//   library  a tall oak door set in the library's stone wall, a brass push plate, a fanlight
//   mouth    the far end of the old tunnel: an arch of stones open on the moonlit night
//   house    Tess's own front door, standing open, lamplight inside (drawn on sky: the wall goes behind it)
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../../kit/starter/palette';
import { inked } from './land';
import { fieldstone, hatch } from './style';

export type ExitKind = 'cairn' | 'library' | 'mouth';

/** A cairn of fieldstones with a blazed post standing in it. */
function cairn(pal: Pal): Pixels {
  const p = new Pixels(20, 40, skyOf(pal));
  const w = pal.r('wood');
  // the post: a squared trail marker, flat cut across the top, with two fresh yellow blazes, one over the other
  p.rect(7, 3, 6, 17, w[2]).rect(8, 4, 1, 16, w[3]).rect(12, 4, 1, 16, w[1]);
  p.rect(6, 1, 8, 2, w[3]).rect(6, 3, 8, 1, w[0]);
  for (const y of [4, 11])
    p.rect(8, y, 4, 5, pal.c('gold', 3))
      .rect(8, y, 4, 1, pal.c('gold', 5))
      .rect(8, y + 4, 4, 1, pal.c('gold', 1));
  // the stones, biggest at the bottom
  for (const [x, y, sw, sh] of [
    [0, 33, 9, 7],
    [9, 32, 11, 8],
    [2, 26, 8, 7],
    [10, 25, 8, 7],
    [5, 19, 10, 7],
  ])
    fieldstone(p, pal, x, y, sw, sh);
  return inked(pal, p);
}

/** A tall oak door in a stone frame, with a fanlight and a brass push plate. */
function libraryDoor(pal: Pal): Pixels {
  const p = new Pixels(20, 40, skyOf(pal));
  const w = pal.r('wood');
  const ink = pal.c('ink', 0);
  // the stone jambs and the arch
  for (let y = 4; y < 40; y += 6) {
    fieldstone(p, pal, 0, y, 4, 6);
    fieldstone(p, pal, 16, y, 4, 6);
  }
  for (let x = 0; x < 20; x += 5) fieldstone(p, pal, x, 0, 5, 5);
  // the fanlight, lit from inside, then the door: two tall panels
  p.rect(4, 5, 12, 5, pal.c('gold', 4));
  for (const x of [7, 10, 13]) p.rect(x, 5, 1, 5, w[1]);
  p.rect(4, 10, 12, 1, ink);
  p.rect(4, 11, 12, 29, w[1]);
  hatch(p, 4, 11, 12, 29, w[0], 4);
  for (const x of [5, 11]) p.rect(x, 13, 4, 11, w[2]).rect(x, 26, 4, 11, w[2]);
  p.rect(10, 11, 1, 29, ink);
  p.rect(12, 22, 2, 5, pal.c('gold', 3)).set(12, 22, pal.c('gold', 5));
  return inked(pal, p);
}

/** The tunnel's far end: an arch of stones, and outside it the night, a star and a tuft of grass. */
function tunnelMouth(pal: Pal): Pixels {
  const p = new Pixels(20, 40, skyOf(pal));
  const night = pal.r('blue');
  p.rect(3, 4, 14, 36, night[0]);
  p.rect(4, 4, 12, 3, night[1]);
  p.set(12, 9, pal.c('white', 3)).set(6, 15, pal.c('white', 2));
  const m = pal.r('moss');
  for (let x = 3; x < 17; x++) p.rect(x, 37 - ((x * 3) % 2), 1, 3, m[(x % 3) + 1]);
  for (let y = 4; y < 40; y += 6) {
    fieldstone(p, pal, 0, y, 4, 6);
    fieldstone(p, pal, 16, y, 4, 6);
  }
  for (let x = 0; x < 20; x += 5) fieldstone(p, pal, x, 0, 5, 5);
  return inked(pal, p);
}

/** The way out of a place: its top and bottom blocks. */
export function exitArt(pal: Pal, kind: ExitKind): [Pixels, Pixels] {
  const art = kind === 'library' ? libraryDoor(pal) : kind === 'mouth' ? tunnelMouth(pal) : cairn(pal);
  return [art.crop(0, 0, 20, 20), art.crop(0, 20, 20, 20)];
}

/** Tess's front door standing open, lamplight inside; sky around it (the house's wall goes behind). */
export function houseDoor(pal: Pal): [Pixels, Pixels] {
  const p = new Pixels(20, 40, skyOf(pal));
  const trim = pal.c('white', 3);
  const lamp = pal.r('orange');
  const w = pal.r('teal');
  p.rect(2, 4, 16, 36, trim);
  p.rect(4, 6, 12, 34, lamp[1]);
  p.rect(4, 6, 12, 10, lamp[2]);
  p.disc(10, 10, 2, lamp[4]);
  // the door leaf swung in against the left jamb
  p.rect(4, 6, 4, 34, w[1]).rect(5, 8, 2, 12, w[2]).rect(5, 24, 2, 12, w[2]).set(7, 22, pal.c('gold', 4));
  p.rect(1, 2, 18, 2, trim);
  const d = inked(pal, p);
  return [d.crop(0, 0, 20, 20), d.crop(0, 20, 20, 20)];
}
