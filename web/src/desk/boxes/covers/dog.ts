// The dogs on the painted covers: Teddy, the red-gold Pembroke corgi (big upright ears, his
// right one taller, a white blaze, chest and paws, a big grin), and Gwin, his big sister,
// a lean liver-brown pit-lab mix with floppy ears, amber eyes and a pink collar.
import { type Ctx, blob, ell, fill, lin, poly, rad, stroke } from './paint';

export interface DogLook {
  coat: [string, string, string]; // highlight, body, shadow
  ears: 'up' | 'flop';
  legs: number; // leg length
  long: number; // body half-length
  eye: string;
  nose: string;
  collar?: string;
  /** A tin knight's helmet with a red plume. */
  helmet?: boolean;
  tongue?: boolean;
}

export const TEDDY: DogLook = { coat: ['#ffc070', '#dc7a2a', '#7a3410'], ears: 'up', legs: 24, long: 72, eye: '#2a1408', nose: '#111', tongue: true };
export const GWIN: DogLook = { coat: ['#b07050', '#6e3a22', '#2e1408'], ears: 'flop', legs: 64, long: 70, eye: '#f0b030', nose: '#5a2a1a', collar: '#ff6fb0', tongue: true };

/** A dog standing, facing right; (x, y) is the ground under its middle. */
export function dog(c: Ctx, x: number, y: number, s: number, d: DogLook, flip = false): void {
  const [hi, mid, lo] = d.coat;
  const L = d.long;
  const top = -d.legs - 52; // body center
  c.save();
  c.translate(x, y);
  c.scale(flip ? -s : s, s);
  ell(c, 0, 4, L + 20, 10);
  fill(c, 'rgba(0,0,0,0.3)');
  const leg = (lx: number, back: boolean) => {
    blob(c, [lx - 13, top + 10, lx + 13, top + 10, lx + 12, -6, lx - 12, -6]);
    fill(c, lin(c, 0, top, 0, 0, [
      [0, back ? lo : mid],
      [0.8, back ? lo : mid],
      [0.92, back ? '#d8d0c6' : '#f6efe6'],
    ]));
    ell(c, lx + 4, -5, 15, 8);
    fill(c, back ? '#d8d0c6' : '#fff');
  };
  leg(-L + 30, true);
  leg(L - 30, true);
  // body
  ell(c, 0, top, L, 38);
  fill(c, lin(c, 0, top - 38, 0, top + 38, [
    [0, hi],
    [0.45, mid],
    [1, lo],
  ]));
  ell(c, 10, top + 24, L * 0.7, 14);
  fill(c, d.ears === 'up' ? '#fbf3e8' : mid);
  // the fluffy corgi rump, or Gwin's whip of a tail
  if (d.ears === 'up') {
    ell(c, -L + 16, top - 2, 26, 30);
    fill(c, rad(c, -L + 8, top - 16, 36, [
      [0, hi],
      [1, mid],
    ]));
  } else stroke(c, mid, 10, [-L + 4, top - 10, -L - 26, top - 40, -L - 34, top - 66]);
  leg(-L + 46, false);
  leg(L - 16, false);
  // chest
  const hx = L + 6;
  const hy = top - 46;
  blob(c, [L - 30, top - 20, L + 14, top - 36, L + 26, top + 10, L - 10, top + 34]);
  fill(c, d.ears === 'up' ? '#fffaf0' : '#e8d0c0');
  // head
  ell(c, hx, hy, 40, 35);
  fill(c, rad(c, hx - 8, hy - 14, 44, [
    [0, hi],
    [0.6, mid],
    [1, lo],
  ]));
  if (d.collar) stroke(c, d.collar, 10, [hx - 34, hy + 14, hx - 18, hy + 30, hx + 2, hy + 36]);
  // muzzle, with Teddy's white blaze up to the forehead
  const white = d.ears === 'up';
  if (white) {
    poly(c, [hx + 2, hy - 30, hx + 14, hy - 30, hx + 22, hy + 4, hx + 4, hy + 4]);
    fill(c, '#fffaf0');
  }
  ell(c, hx + 30, hy + 10, 26, 17, 0.1);
  fill(c, white ? '#fffaf0' : lin(c, 0, hy, 0, hy + 26, [[0, hi], [1, mid]]));
  ell(c, hx + 54, hy + 2, 9, 7);
  fill(c, d.nose);
  ell(c, hx + 52, hy - 1, 3, 2);
  fill(c, 'rgba(255,255,255,0.6)');
  // the big grin
  if (d.tongue) {
    blob(c, [hx + 20, hy + 18, hx + 48, hy + 14, hx + 40, hy + 30, hx + 24, hy + 30]);
    fill(c, '#3a0a0a');
    blob(c, [hx + 26, hy + 24, hx + 40, hy + 24, hx + 40, hy + 44, hx + 30, hy + 46]);
    fill(c, '#ff6f8a');
  }
  // eyes
  for (const [ex, ey, er] of [
    [hx + 16, hy - 8, 6],
    [hx - 2, hy - 10, 5],
  ]) {
    ell(c, ex, ey, er, er * 1.15);
    fill(c, d.eye);
    ell(c, ex + (d.ears === 'flop' ? 0 : 0), ey, er * 0.55, er * 0.6);
    fill(c, d.ears === 'flop' ? '#2a1408' : d.eye);
    ell(c, ex + 1.5, ey - 2, er * 0.35, er * 0.35);
    fill(c, '#fff');
  }
  if (d.helmet) plume(c, hx, hy);
  // ears
  if (d.ears === 'up') {
    for (const [bx, tx, ty] of [
      [hx - 26, hx - 34, hy - 86],
      [hx + 4, hx + 10, hy - 96], // his right ear stands taller
    ]) {
      poly(c, [bx - 14, hy - 18, tx, ty, bx + 18, hy - 22]);
      fill(c, lin(c, 0, ty, 0, hy, [[0, lo], [0.3, mid], [1, mid]]));
      poly(c, [bx - 6, hy - 22, tx + 1, ty + 18, bx + 10, hy - 24]);
      fill(c, '#f4a0a0');
    }
  } else {
    for (const ex of [hx - 26, hx - 4]) {
      blob(c, [ex - 8, hy - 30, ex + 14, hy - 32, ex + 10, hy + 6, ex - 4, hy + 8]);
      fill(c, lo);
    }
  }
  if (d.helmet) helmet(c, hx, hy);
  c.restore();
}

/** The tin helmet, the ears poking through it. */
function helmet(c: Ctx, hx: number, hy: number): void {
  c.beginPath();
  c.ellipse(hx + 2, hy - 18, 42, 34, 0, Math.PI, 0);
  c.closePath();
  fill(c, lin(c, hx - 38, 0, hx + 42, 0, [
    [0, '#5a6070'],
    [0.4, '#eef2f8'],
    [0.6, '#b8c0cc'],
    [1, '#4a505c'],
  ]));
  poly(c, [hx - 42, hy - 20, hx + 46, hy - 20, hx + 46, hy - 13, hx - 42, hy - 13]);
  fill(c, '#8a929e');
  for (let i = 0; i < 5; i++) (ell(c, hx - 32 + i * 18, hy - 16.5, 2.5, 2.5), fill(c, '#e8ecf2'));
  ell(c, hx - 8, hy - 38, 6, 12, -0.5);
  fill(c, 'rgba(255,255,255,0.65)');
}

/** The helmet's red plume, streaming back behind the ears. */
function plume(c: Ctx, hx: number, hy: number): void {
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    blob(c, [hx - 4, hy - 50, hx - 30 - t * 40, hy - 80 - t * 10 + i * 6, hx - 70 - t * 30, hy - 60 + i * 8, hx - 20, hy - 54]);
    fill(c, i % 2 ? '#e8202a' : '#ff4a40');
  }
}
