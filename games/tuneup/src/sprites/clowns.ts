// The Clown Club's horn section as the real clown types, all friendly: faces two blocks square
// (the whiteface, all white with a small red nose and arched brows under a cone hat; the
// auguste, a flesh-tone face with white round the eyes and mouth, a big red nose and wild hair;
// the hobo, a stubbled face with a white mouth under a battered hat), and character clowns a
// block tall who stroll the curb (the fireman, the police officer, the baker, the butcher).
// Drawn in the fixed colors only, so they read the same in every palette.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

type C = (role: string, shade: number) => number;

export const FACES = ['whiteface', 'auguste', 'hobo'] as const;
export type Face = (typeof FACES)[number];
export const CHARACTERS = ['fireman', 'police', 'baker', 'butcher'] as const;
export type Character = (typeof CHARACTERS)[number];

/** A smile from x0 to x1 dipping `depth` pixels, `w` thick. */
function smile(p: Pixels, x0: number, x1: number, y: number, depth: number, col: number, w = 2): void {
  const mid = (x0 + x1) / 2;
  const half = (x1 - x0) / 2;
  for (let x = x0; x <= x1; x++) p.rect(x, y + Math.round(depth * (1 - ((x - mid) / half) ** 2)), 1, w, col);
}

/** A clown's face, 40 x 40, drawn over `bg` (two blocks square of its own sky). */
export function clownFace(bg: Pixels, face: Face, c: C): Pixels {
  const p = bg;
  const ink = c('ink', 0);
  if (face === 'whiteface') {
    // a ruffled collar, the white face, a cone hat with a pompom
    for (let x = 6; x < 36; x += 5) p.disc(x, 37, 4, c('paint', 2)).ring(x, 37, 4, c('blue', 2));
    p.disc(20, 21, 12, c('paint', 3));
    for (let y = 0; y < 11; y++) p.rect(20 - Math.round(y * 0.7), y + 1, Math.round(y * 1.4) + 1, 1, c('blue', 2));
    p.rect(13, 10, 15, 2, c('yellow', 3)).disc(20, 1, 2, c('red', 2));
    // arched brows, eyes, a small red nose and red lips
    smile(p, 12, 17, 15, -2, ink, 1);
    smile(p, 23, 28, 15, -2, ink, 1);
    p.rect(14, 18, 2, 2, ink).rect(24, 18, 2, 2, ink);
    p.disc(20, 23, 2, c('red', 2)).set(19, 22, c('paint', 3));
    smile(p, 16, 24, 27, 2, c('red', 2));
    return p;
  }
  if (face === 'auguste') {
    // wild orange hair each side, the flesh-tone face, white round the eyes and mouth
    for (const [x, y] of [
      [6, 12],
      [4, 19],
      [7, 26],
      [34, 12],
      [36, 19],
      [33, 26],
    ])
      p.disc(x, y, 4.5, c('orange', 2)).disc(x - 1, y - 1, 2, c('orange', 3));
    p.disc(20, 21, 13, c('peach', 3));
    p.disc(15, 17, 4, c('paint', 3)).disc(25, 17, 4, c('paint', 3));
    p.rect(14, 16, 2, 3, ink).rect(24, 16, 2, 3, ink);
    smile(p, 12, 28, 23, 6, c('paint', 3), 6);
    smile(p, 13, 27, 26, 4, c('red', 2), 2);
    // the big red nose, and a tiny hat with a flower
    p.disc(20, 22, 4, c('red', 2)).disc(18, 20, 1.2, c('paint', 3));
    p.rect(14, 4, 12, 4, c('green', 1)).rect(11, 8, 18, 2, c('green', 0)).disc(24, 5, 2, c('yellow', 3));
    return p;
  }
  // the hobo: a battered brown hat with a patch, a stubbled face, a white mouth, a red nose
  p.disc(20, 22, 12, c('peach', 2));
  for (let y = 24; y < 33; y++) for (let x = 10; x < 31; x++) if ((x * 3 + y * 5) % 4 === 0 && Math.hypot(x - 20, y - 22) < 11.5) p.set(x, y, c('stone', 2));
  smile(p, 13, 27, 24, 5, c('paint', 3), 5);
  smile(p, 15, 25, 27, 2, c('red', 1), 1);
  p.rect(14, 18, 2, 2, ink).rect(24, 18, 2, 2, ink);
  smile(p, 13, 17, 15, -1, ink, 1);
  smile(p, 23, 27, 15, -1, ink, 1);
  p.disc(20, 22, 3, c('red', 2)).set(19, 21, c('paint', 3));
  p.rect(11, 3, 18, 8, c('wood', 1)).rect(7, 10, 26, 3, c('wood', 0)).rect(23, 4, 4, 3, c('wood', 3)).rect(11, 7, 18, 1, c('wood', 2));
  return p;
}

/** A character clown a block tall (a monster picture: 255 is clear), stepping on frame `f`. */
export function characterClown(who: Character, f: number, c: C): Pixels {
  const p = new Pixels(20, 20, 255);
  const ink = c('ink', 0);
  const coat = { fireman: c('yellow', 2), police: c('blue', 1), baker: c('paint', 3), butcher: c('paint', 2) }[who];
  // legs, stepping; the coat; white gloves
  p.rect(f ? 7 : 8, 16, 2, 4, ink).rect(f ? 12 : 11, 16, 2, 4, ink);
  p.rect(6, 11, 9, 6, coat).rect(4, 12, 2, 2, c('paint', 3)).rect(15, 12, 2, 2, c('paint', 3));
  if (who === 'butcher') for (let y = 11; y < 17; y += 2) p.rect(8, y, 5, 1, c('red', 2));
  if (who === 'fireman') p.rect(6, 14, 9, 1, c('metal', 4));
  if (who === 'police') p.set(8, 12, c('gold', 2)).set(8, 13, c('gold', 1));
  // the face: white, a red nose, a smile
  p.disc(10.5, 7, 3.6, c('paint', 3));
  p.set(9, 6, ink).set(12, 6, ink).set(10, 8, c('red', 2)).set(11, 8, c('red', 2));
  p.rect(9, 10, 4, 1, c('red', 1));
  // the hat says who it is
  if (who === 'fireman') p.rect(6, 1, 10, 3, c('red', 2)).rect(5, 4, 12, 1, c('red', 1)).rect(10, 1, 2, 2, c('gold', 3));
  else if (who === 'police') p.rect(7, 1, 8, 3, c('blue', 1)).rect(6, 4, 10, 1, ink).set(10, 2, c('gold', 3)).set(11, 2, c('gold', 3));
  else if (who === 'baker') p.disc(10.5, 1.5, 3.5, c('paint', 3)).rect(7, 2, 8, 2, c('paint', 3)).rect(7, 3, 8, 1, c('paint', 2));
  else p.rect(7, 2, 8, 2, c('paint', 3)).rect(7, 3, 8, 1, c('red', 2));
  return p;
}
