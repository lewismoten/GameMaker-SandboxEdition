// Gwinn's dig: a pocket of wet sand under one lone dune in the sandbox, where something
// felt was buried. The egg itself (an object Teddy picks up with P), the word pressed into
// the sand where it lay, the little sandcastle that only lets Teddy by once he carries it,
// and the paw prints that lead to the dune.
import { OCHRE, PINK, RED, SAND, WATER, WOOD } from '../art/palette';
import { CTR } from '../rules';
import { Pixels, sandTexture, shade } from '../art/draw';
import { SOLID, bg, sand } from './common';

const damp = (seed: number) => sandTexture(seed, 3, OCHRE, 0.2);

/** The felt egg: sandy tan, blue scallops at its base, a turreted castle with a pink pennant, one brown paw print. */
function feltEgg(p: Pixels): Pixels {
  const inside = (x: number, y: number) => {
    const dy = (y - 10.5) / 8.6;
    if (Math.abs(dy) > 1) return false;
    const half = 6.6 * Math.sqrt(1 - dy * dy) * (1 + 0.12 * dy);
    return Math.abs(x - 9.5) <= half;
  };
  // A soft shadow down and to the right, then the felt with its fuzz.
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (!inside(x, y) && inside(x - 1, y - 1)) p.set(x, y, OCHRE[1]);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      const lit = -(x - 9.5) / 7 - (y - 10.5) / 9;
      const fuzz = (x * 7 + y * 13) % 5 === 0 ? -1 : (x * 11 + y * 3) % 7 === 0 ? 1 : 0;
      p.set(x, y, edge ? OCHRE[2] : shade(SAND, 7 + lit * 1.6 + fuzz));
    }
  // Blue scalloped waves around the base, with a running stitch along their crests.
  for (let y = 13; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (!inside(x, y) || !inside(x, y + 1)) continue;
      const crest = 14 + (Math.abs(((x + 1) % 4) - 1.5) > 1 ? 0 : 1);
      if (y >= crest) p.set(x, y, y === crest ? WATER[6] : (x + y) % 3 === 0 ? WATER[3] : WATER[4]);
      if (y === crest - 1 && x % 2 === 0) p.set(x, y, SAND[9]);
    }
  // The castle appliqué (rust felt): two turrets, a keep, a dark gate and merlons.
  p.rect(6, 8, 7, 5, RED[3]);
  p.rect(5, 6, 2, 7, RED[3]).rect(12, 6, 2, 7, RED[3]);
  p.set(5, 5, RED[3]).set(13, 5, RED[3]);
  p.rect(8, 6, 3, 2, RED[3]).set(8, 5, RED[3]).set(10, 5, RED[3]);
  p.rect(5, 6, 1, 7, RED[4]).rect(8, 6, 1, 2, RED[4]);
  p.rect(13, 6, 1, 7, RED[2]).rect(6, 12, 7, 1, RED[2]);
  p.rect(9, 10, 1, 3, RED[0]).set(9, 9, RED[1]);
  p.set(6, 9, RED[1]).set(12, 9, RED[1]);
  // The pink pennant on its pole.
  p.rect(9, 2, 1, 4, WOOD[2]);
  p.rect(10, 2, 2, 2, PINK[2]).set(12, 2, PINK[1]).set(10, 3, PINK[3]);
  // One brown paw print by the moat.
  p.rect(14, 12, 2, 2, WOOD[1]).set(13, 11, WOOD[1]).set(14, 10, WOOD[1]).set(16, 10, WOOD[1]).set(16, 11, WOOD[1]);
  // A little light on the felt.
  p.set(4, 4, SAND[9]).set(5, 3, SAND[9]);
  return p;
}

/** "ONCE", pressed into wet sand, with the dent the egg left above it. */
function onceInSand(p: Pixels): Pixels {
  const font: Record<string, string[]> = {
    O: ['###', '#.#', '#.#', '#.#', '###'],
    N: ['#.#', '###', '###', '###', '#.#'],
    C: ['###', '#..', '#..', '#..', '###'],
    E: ['###', '#..', '##.', '#..', '###'],
  };
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = (x - 9.5) / 5;
      const dy = (y - 5) / 4;
      const d = dx * dx + dy * dy;
      if (d <= 1) p.set(x, y, d > 0.6 ? OCHRE[1] : OCHRE[2]);
      else if (d <= 1.35 && y > 5) p.set(x, y, OCHRE[4]);
    }
  // Each stroke is a groove: lit on its lower right edge, dark inside.
  const strokes = (fn: (x: number, y: number) => void) =>
    [...'ONCE'].forEach((ch, i) => font[ch].forEach((row, y) => [...row].forEach((c, x) => c === '#' && fn(1 + i * 5 + x, 11 + y))));
  strokes((x, y) => p.set(x + 1, y + 1, OCHRE[5]));
  strokes((x, y) => p.set(x, y, OCHRE[0]));
  return p;
}

/** A little sandcastle of wet sand with a pink pennant: it stands in the way out. */
function tinyCastle(p: Pixels): Pixels {
  const body = (x: number, y: number, w: number, h: number) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) p.set(xx, yy, shade(SAND, 6 - (xx - x) / (w / 3) + (yy === y ? 2 : 0)));
  };
  p.rect(2, 18, 17, 1, OCHRE[1]);
  body(3, 10, 14, 8);
  body(2, 5, 4, 13);
  body(14, 5, 4, 13);
  body(8, 6, 4, 5);
  for (const x of [2, 4, 14, 16, 8, 10]) p.set(x, x === 8 || x === 10 ? 5 : 4, SAND[8]);
  p.rect(9, 13, 2, 5, OCHRE[1]).set(9, 12, OCHRE[2]).set(10, 12, OCHRE[2]);
  p.set(4, 8, OCHRE[2]).set(15, 8, OCHRE[2]);
  p.rect(10, 1, 1, 5, WOOD[2]).rect(11, 1, 3, 2, PINK[2]).set(14, 1, PINK[1]).set(11, 2, PINK[3]);
  p.rect(18, 6, 1, 12, OCHRE[2]);
  return p;
}

/** Plain sand with Gwinn's paw prints pressed in, heading up and to the right. */
function pawPrints(p: Pixels): Pixels {
  const paw = (x: number, y: number) => {
    p.rect(x, y + 2, 3, 2, SAND[3]).set(x + 1, y + 4, SAND[3]);
    p.set(x - 1, y + 1, SAND[3]).set(x, y, SAND[3]).set(x + 2, y, SAND[3]).set(x + 3, y + 1, SAND[3]);
    p.rect(x, y + 4, 3, 1, SAND[8]);
  };
  paw(4, 11);
  paw(12, 3);
  return p;
}

export function addDig(): void {
  // The egg comes first, so its block number (146) never moves.
  bg.add('egg', feltEgg(damp(181)), { obj: true, effect: CTR.egg, eamt: 1, score: 100, touch: 'once' });
  bg.add('once', onceInSand(damp(182)));
  bg.add('tinyCastle', tinyCastle(damp(183)), { solid: SOLID, effect: CTR.egg, eamt: -1, score: 100, touch: 'damp' });
  bg.add('paws', pawPrints(sand(11)));
}
