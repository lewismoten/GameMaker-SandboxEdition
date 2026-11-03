// What the trinkets add to the game's models so they stand and print as toys: the dogs' legs, paws and
// tails (the game's sprites show them from above, without), Doc Leo's neck and a stronger leash, and the
// CitiCar's recessed windows. Distances are in the game's units, floor at z = 0.
import { rgb, type Material, type Shape } from '../render/tracer';
import { F, model } from '../models/parts';
import { SHIELD_SIDE, WIN, Z, onShield } from '../models/citicar';

const fur: Material = { color: rgb(220, 128, 52), diffuse: 1, spec: 0.25, shine: 12 };
const white: Material = { color: rgb(252, 248, 238), diffuse: 1, spec: 0.2, shine: 10 };
const coat: Material = { color: rgb(118, 64, 40), diffuse: 1, spec: 0.5, shine: 30 };

/** Teddy: front legs that run up into his chest, hind legs with haunches and paws, and a nub of a tail. */
export function teddyLegs(): Shape[] {
  const parts = [];
  for (const x of [0.41, 0.59]) {
    parts.push({ d: F.cap([x, 0.6, 0.22], [x, 0.74, 0.05], 0.058, 0.046), mat: fur });
    parts.push({ d: F.ell([x, 0.75, 0.04], 0.05, 0.062, 0.04), mat: white });
    const side = x < 0.5 ? 0.38 : 0.62;
    parts.push({ d: F.ell([side, 0.3, 0.2], 0.07, 0.11, 0.11), mat: fur });
    parts.push({ d: F.cap([side, 0.3, 0.14], [side, 0.27, 0.05], 0.06, 0.046), mat: fur });
    parts.push({ d: F.ell([side, 0.255, 0.04], 0.05, 0.07, 0.04), mat: white });
  }
  parts.push({ d: F.sphere([0.5, 0.19, 0.22], 0.045), mat: fur });
  return [
    model(
      parts,
      [
        [0.25, 0.1, 0],
        [0.75, 0.82, 0.36],
      ],
      0.02,
    ),
  ];
}

/** Gwinn, sitting: front legs joined to her chest, haunches with hind paws forward, and a long tail curling up. */
export function gwinnLegs(): Shape[] {
  const parts = [];
  for (const x of [0.42, 0.58]) {
    parts.push({ d: F.cap([x + (x < 0.5 ? 0.01 : -0.01), 0.62, 0.22], [x, 0.75, 0.04], 0.062, 0.044), mat: coat });
    const side = x < 0.5 ? 0.36 : 0.64;
    parts.push({ d: F.ell([side, 0.46, 0.13], 0.07, 0.13, 0.11), mat: coat });
    parts.push({ d: F.ell([side + (x < 0.5 ? 0.01 : -0.01), 0.6, 0.035], 0.05, 0.08, 0.035), mat: coat });
  }
  parts.push({ d: F.cap([0.5, 0.36, 0.09], [0.5, 0.2, 0.045], 0.04, 0.034), mat: coat });
  parts.push({ d: F.cap([0.5, 0.2, 0.045], [0.5, 0.1, 0.2], 0.034, 0.024), mat: coat });
  return [
    model(
      parts,
      [
        [0.25, 0.05, 0],
        [0.75, 0.8, 0.3],
      ],
      0.02,
    ),
  ];
}

/** Doc Leo: a neck that joins his head to his shoulders, and a thicker leash to the chicken. */
export function docLeoJoins(): Shape[] {
  const skin: Material = { color: rgb(240, 196, 170), diffuse: 1, spec: 0.2, shine: 10 };
  const leash: Material = { color: rgb(230, 30, 40), diffuse: 0.8, spec: 1.2, shine: 80 };
  return [
    model(
      [
        { d: F.cap([0.5, 0.6, 0.54], [0.5, 0.6, 0.66], 0.06), mat: skin },
        { d: F.cap([0.67, 0.68, 0.36], [0.8, 0.78, 0.09], 0.014), mat: leash },
      ],
      [
        [0.4, 0.5, 0],
        [0.9, 0.9, 0.75],
      ],
      0.01,
    ),
  ];
}

/** Distance to a polygon in the x, z plane (negative inside). */
function polyDist(poly: [number, number][], x: number, z: number): number {
  let d = Infinity;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = poly[j];
    const [bx, bz] = poly[i];
    if (az > z !== bz > z && x < ((bx - ax) * (z - az)) / (bz - az) + ax) inside = !inside;
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)));
    d = Math.min(d, Math.hypot(x - (ax + t * (bx - ax)), z - (az + t * (bz - az))));
  }
  return inside ? -d : d;
}

/**
 * THE CHEZ's windows as recesses (the windshield in the slope, the door window on each side, the back window),
 * cut a millimeter and a half into the body where the painted windows are. From the side there is only the door's
 * window.
 */
export function chezWindows({ mm, d }: { mm: number; d: (x: number, y: number, z: number) => number }): ((x: number, y: number, z: number) => number)[] {
  const depth = 1.4 * mm;
  const W = 0.8;
  // the back window: a rectangle across the rear face, in the back face's own place at its top and bottom
  const [z0, z1] = [Z(8), Z(3)];
  const rear = (z: number) => {
    let lo = -1;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (d(m, W / 2, z) < 0) hi = m;
      else lo = m;
    }
    return lo;
  };
  const [r0, r1] = [rear(z0), rear(z1)];
  // the windshield: along the slope from its top to its bottom, between the pillars, `depth` into the slope
  const shield = (x: number, y: number, z: number) => {
    const { t, out, len } = onShield(x, z);
    return Math.max(Math.abs(t - 0.5) * len - len / 2, Math.abs(y - W / 2) - (W / 2 - SHIELD_SIDE), -out - depth);
  };
  return [
    shield,
    (x, y, z) => Math.max(polyDist(WIN, x, z), y - depth),
    (x, y, z) => Math.max(polyDist(WIN, x, z), W - y - depth),
    (x, y, z) => {
      const xr = r0 + ((r1 - r0) * (z - z0)) / (z1 - z0);
      return Math.max(Math.abs(y - W / 2) - (W / 2 - 0.1), Math.abs(z - (z0 + z1) / 2) - (z1 - z0) / 2, x - xr - depth);
    },
  ];
}
