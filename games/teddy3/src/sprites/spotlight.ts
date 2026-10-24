// The Big Top's stage spotlights as monster art: a lamp on a trolley, riding its track, with
// its pale cone of light below it (one block), and the bright end of the beam, which sits at
// a standing dog's head height (the top four rows of the block under the lamp, so a dog
// flopped flat on the floor is under it). When a sweep ends, or the light finds Gwinn, the
// lamp goes dark for a moment.
import { Pixels } from '../../../kit/pixels';
import { P } from '../art/pal';

const CLEAR = 255;
const glow = (k: number) => P.c('glow', k);

/** The lamp and its cone (lit), or the lamp gone dark with no cone. */
export function spotLamp(lit: boolean): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  // the trolley's two wheels on the track, and the yoke down to the lamp
  p.rect(5, 0, 3, 2, P.c('metal', 3)).rect(12, 0, 3, 2, P.c('metal', 3));
  p.rect(5, 2, 10, 1, P.c('metal', 2)).rect(9, 2, 2, 2, P.c('metal', 2));
  // the lamp's can, pointing down: metal, so it shows against the dark
  p.rect(5, 4, 10, 6, P.c('metal', 1)).frame(5, 4, 10, 6, P.c('ink', 0));
  p.rect(6, 5, 2, 4, P.c('metal', 3)).rect(12, 5, 2, 3, P.c('metal', 2));
  p.rect(4, 9, 12, 2, P.c('ink', 0)).rect(6, 10, 8, 1, lit ? glow(3) : P.c('metal', 0));
  if (!lit) return p;
  // the pale cone: its edges and a few rays, widening down to the block's edges
  for (let y = 11; y < 20; y++) {
    const half = 4 + ((y - 11) * 6) / 8;
    for (let x = 0; x < 20; x++) {
      const d = Math.abs(x - 9.5);
      if (d > half) continue;
      const ray = [0.4, 0.75].some((k) => Math.abs(d - half * k) < 0.5);
      if (d > half - 1) p.set(x, y, glow(2));
      else if (ray && (x + y) % 2 === 0) p.set(x, y, glow(3));
      else if (d < 1 && y % 2) p.set(x, y, glow(1));
    }
  }
  return p;
}

/** The beam's bright end: rows 0-3 only (a standing dog's ears), everything below it clear. */
export function spotEnd(lit: boolean): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  if (!lit) {
    for (let x = 2; x < 18; x += 3) p.set(x, 1, glow(0));
    return p;
  }
  // the cone's last row, then the bright spot where the light lands
  for (let x = 0; x < 20; x++) if (x === 0 || x === 19 || x % 4 === 1 || x === 9 || x === 10) p.set(x, 0, glow(x === 0 || x === 19 ? 2 : 3));
  p.rect(0, 1, 20, 2, glow(3)).rect(2, 3, 16, 1, glow(2));
  return p;
}
