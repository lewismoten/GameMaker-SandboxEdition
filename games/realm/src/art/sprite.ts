// Pixel sprites from ASCII art: each character is a pixel, looked up in a key of colors (the
// fixed sprite colors of art/pal.ts). Townsfolk are the same drawings with another key, so a
// baker and a guard can share a body and differ in hat, hair and coat.
import { C } from './pal';
import { Canvas, type RGB } from './rgb';

export type Key = Record<string, RGB>;

/** A drawing as a canvas (unknown characters and '.' or ' ' are clear). */
export function art(rows: string[], key: Key, w = 20, h = 20, dx = 0, dy = 0): Canvas {
  const cv = new Canvas(w, h);
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const c = key[ch];
      if (c) cv.set(x + dx, y + dy, c);
    }),
  );
  return cv;
}

/** Stacks drawings (later ones on top); rows may be shorter than the canvas. */
export function layered(parts: [string[], number?, number?][], key: Key, w = 20, h = 20): Canvas {
  const cv = new Canvas(w, h);
  for (const [rows, dx = 0, dy = 0] of parts)
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const c = key[ch];
        if (c) cv.set(x + dx, y + dy, c);
      }),
    );
  return cv;
}

/** The common key every person shares: outline, skin, eyes, white, boots. */
export function baseKey(over: Key = {}): Key {
  return {
    K: C('outline'),
    k: C('ink'),
    e: C('ink'),
    d: C('skin', 1),
    s: C('skin', 2),
    S: C('skin', 3),
    w: C('white', 1),
    W: C('white', 0),
    n: C('leather', 0),
    N: C('leather', 1),
    m: C('steel', 2),
    M: C('steel', 3),
    o: C('red', 2),
    ...over,
  };
}

/** Hair, clothes and hat ramps for a person: [dark, mid, light]. */
export interface Look {
  hair: RGB[];
  coat: RGB[];
  pants: RGB[];
  hat?: RGB[];
  trim?: RGB[];
}

/** Key letters for a look: h H j hair, g G L coat, p P pants, c C r hat, t T trim. */
export function lookKey(l: Look, over: Key = {}): Key {
  const hat = l.hat ?? l.hair;
  const trim = l.trim ?? [C('gold', 1), C('gold', 2), C('gold', 3)];
  return baseKey({
    h: l.hair[0],
    H: l.hair[1],
    j: l.hair[2] ?? l.hair[1],
    g: l.coat[0],
    G: l.coat[1],
    L: l.coat[2] ?? l.coat[1],
    p: l.pants[0],
    P: l.pants[1] ?? l.pants[0],
    c: hat[0],
    C: hat[1],
    r: hat[2] ?? hat[1],
    t: trim[0],
    T: trim[1],
    y: trim[2] ?? trim[1],
    ...over,
  });
}

/** The ramps from the fixed palette, by name. */
export const R = (name: string, ...k: number[]): RGB[] => k.map((i) => C(name, i));
