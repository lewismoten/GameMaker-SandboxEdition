// The Face Dial's nine faces as vector line art, for the printed dial (and the desk's on-screen one): each face
// is a list of shapes drawn in a 48 by 48 box, centered on x = 24, so its top half (y 0 to 24) rides the big disc
// and its bottom half (y 24 to 48) the small one, and the two join under the arrow. A shape is an SVG path, a
// fill (a letter from faceColors.ts FILL_COLORS, or '' for none), a line width (0: no outline) and optionally a
// line color. faces.ts (pixel rows) stays what the game's DOS screens draw; this is the same nine friendly
// faces, at print resolution. printables.json carries a copy with the fills resolved to colors
// (web/src/manual/printables/teddyDecoder.test.ts checks they match).
import { FILL_COLORS } from './faceColors';

export type Shape = [d: string, fill: string, width?: number, line?: string];

const ell = (cx: number, cy: number, rx: number, ry = rx): string => `M${cx - rx},${cy}a${rx},${ry} 0 1 0 ${2 * rx},0a${rx},${ry} 0 1 0 ${-2 * rx},0z`;
/** The same shape on both sides of the middle: f(s) draws with x = 24 + s * dx. */
const pair = (f: (x: (dx: number) => number, s: number) => Shape[]): Shape[] => [-1, 1].flatMap((s) => f((dx) => 24 + s * dx, s));
const INK = '#2a2016';
const NAVY = '#26324d';
const SHADE = '#3a3a4a';

export const FACE_ART: Record<string, Shape[]> = {
  Teddy: [
    ...pair((x) => [
      [`M${x(7)},19Q${x(8)},6 ${x(13)},3Q${x(18)},6 ${x(17)},20Z`, 'a'],
      [`M${x(10)},17Q${x(11)},10 ${x(13)},7Q${x(15)},10 ${x(14)},17Z`, 'p', 0],
    ]),
    ['M9,28Q9,14 24,14Q39,14 39,28Q39,42 24,43Q9,42 9,28Z', 'a'],
    ['M21,14.5L27,14.5L26,28L22,28Z', 'm', 0],
    [ell(24, 36, 9, 6.5), 'm', 0],
    ...pair((x) => [[ell(x(7.5), 26.5, 1.7), '#2a2016', 0] as Shape, [ell(x(7), 25.9, 0.5), 'w', 0] as Shape]),
    [ell(24, 31.5, 3.2, 2.4), '#2a2016', 0],
    ['M24,33.5L24,35.5', '', 1.4],
    ...pair((x) => [[`M${x(0)},35.5Q${x(3)},39 ${x(5.5)},36.5`, '', 1.4] as Shape]),
    ['M21.5,37.5Q24,45 26.5,37.5Z', 'p', 1.1],
  ],
  Gwinn: [
    ['M11,24L6,2Q15,7 19,14Z', 'n'],
    ['M12,20L9,7Q14,9 17,14Z', 'p', 0],
    ['M33,16Q43,13 43.5,29Q43,38 38,33Q40,25 34,23Z', 'd'],
    ['M10,28L8,24L11,21L9,16L14,16L15,11L19,14L22,9L25,14L29,11L31,15L36,14L35,19L39,21L37,25L40,29L36,33L37,38Q24,47 11,38L12,33Z', 'n'],
    [ell(17.5, 26, 3.2, 2.8), 'w', 1.2],
    [ell(30.5, 26, 3.2, 2.8), 'w', 1.2],
    [ell(18, 26.4, 1.4), '#2a2016', 0],
    [ell(31, 26.4, 1.4), '#2a2016', 0],
    [ell(24, 35, 8, 6), 'a', 0],
    ['M20,36.5Q24,35 28,36.5Q27.5,44 24,44.5Q20.5,44 20,36.5Z', 'r', 1.2],
    [ell(24, 41.5, 2.6, 2.2), 'p', 0],
    [ell(24, 32, 3.4, 2.3), '#2a2016', 0],
  ],
  'Doc Leo': [
    ['M2,48L3,43Q10,41 17,43L18,48Z', '#1f2f5a'],
    ['M46,48L45,43Q38,41 31,43L30,48Z', '#1f2f5a'],
    ['M15,43L24,46.5L33,43L33,48L15,48Z', 'u'],
    ['M22.3,46L25.7,46L27,48L21,48Z', 'g', 1],
    ['M12,19Q12,40 24,42.5Q36,40 36,19Z', 'w'],
    ...pair((x) => [
      [ell(x(6), 27, 3, 2.3), 'w', 1.2] as Shape,
      [ell(x(6), 27.2, 1.2), '#2a2016', 0] as Shape,
      [`M${x(9.5)},22.5Q${x(6)},19.8 ${x(2.5)},22.5`, '', 1.5, '#2f6fd6'] as Shape,
    ]),
    [ell(24, 32, 4.4, 4.2), 'r', 1.2],
    [ell(22.7, 30.6, 1.2, 0.9), 'w', 0],
    ['M16,36.5Q24,45 32,36.5Q24,40 16,36.5Z', 'r', 1.2],
    ['M14,14Q13,3 20,2L24,5L28,2Q35,3 34,14Z', 'd'],
    ['M14,11.5L34,11.5L34,14.5L14,14.5Z', '#2a2016', 0],
    ['M3,20Q9,14.5 14,14.5L34,14.5Q39,14.5 45,20L43,22L41,20.5L38,23L35,20.5L13,20.5L10,23L7.5,20.5L5.5,22.5Z', 'd'],
    ['M20,6.5L22,9', '', 1],
  ],
  Juggles: [
    ...[
      [10, 11, 'r'],
      [16, 7, 'y'],
      [24, 5.5, 'g'],
      [32, 7, 'b'],
      [38, 11, 'u'],
      [8.5, 20, 'o'],
      [39.5, 20, 'p'],
      [9.6, 28, 'y'],
      [38.4, 28, 'r'],
    ].map(([cx, cy, c]) => [ell(cx as number, cy as number, 4.6), c as string] as Shape),
    [ell(24, 28, 13, 14.5), 'w'],
    ...pair((x) => [
      [ell(x(6), 24.5, 3, 3.4), 'w', 1.2] as Shape,
      [ell(x(6), 25, 1.5), '#2a2016', 0] as Shape,
      [`M${x(9.5)},21Q${x(6)},18 ${x(2.5)},21`, '', 1.5, '#2f6fd6'] as Shape,
      [ell(x(10), 31, 2.6, 2), 'p', 0] as Shape,
    ]),
    [ell(24, 30, 3.7), 'r', 1.2],
    ['M13,34.5Q24,49 35,34.5Q24,39 13,34.5Z', 'r', 1.3],
    ...[10, 17, 24, 31, 38].map((cx) => [ell(cx, 44.6, 4.2, 3.3), cx % 2 ? 'y' : 'p'] as Shape),
  ],
  Honker: [
    ['M11,21Q11,42 24,43.5Q37,42 37,21Z', 's'],
    ...pair((x) => [[ell(x(7), 27, 1.7), '#2a2016', 0] as Shape, [`M${x(10)},23Q${x(7)},21 ${x(4)},23`, '', 1.5] as Shape]),
    [ell(24, 31, 3.8, 3.4), 'r', 1.2],
    ['M18,41.5Q24,45 30,41.5', '', 1.4],
    ['M7,35Q12,29 24,34Q36,29 41,35Q39,42 33,39.5Q28,36 24,37Q20,36 15,39.5Q9,42 7,35Z', 'd', 1.3],
    ['M13,17Q13,3 24,3Q35,3 35,17Z', SHADE],
    ['M13,12.5L35,12.5L35,16.5L13,16.5Z', 'r', 1.2],
    ['M6,19Q24,14 42,19Q43,22.5 39,22.5L9,22.5Q5,22.5 6,19Z', SHADE],
    ['M18,6Q20,4.5 23,4.5', '', 1.2, '#ffffff'],
  ],
  Pratfall: [
    ['M12,19Q12,42 24,43.5Q36,42 36,19Z', 's'],
    [ell(17.5, 29, 5.2), 'c', 1.5],
    [ell(30.5, 29, 5.2), 'c', 1.5],
    ['M22.7,28.5L25.3,28.5', '', 1.4],
    [ell(17.5, 29.2, 1.4), '#2a2016', 0],
    [ell(30.5, 29.2, 1.4), '#2a2016', 0],
    ['M24,31Q22.4,35 25,35', '', 1.1],
    ['M19,39Q24,42 29,39', '', 1.4],
    ['M24,45.5L16.5,42.5L16.5,48.5Z', 'r', 1.2],
    ['M24,45.5L31.5,42.5L31.5,48.5Z', 'r', 1.2],
    [ell(24, 45.5, 2), 'r', 1.2],
    ['M14,15L14,22Q24,26 34,22L34,15L24,19Z', NAVY],
    ['M3,12L24,4.5L45,12L24,19.5Z', NAVY],
    ['M24,12L40,13.5L40,22', '', 1.2, '#ffd23a'],
    ['M38.4,22L41.6,22L42.4,27.5L37.6,27.5Z', 'y', 1],
  ],
  Crier: [
    ['M13,17Q13,39 24,41Q35,39 35,17Z', 's'],
    ['M31,13Q43,9 44,1Q41,12 31.5,16Z', 'g', 1.2],
    ['M11,27Q8,45 24,47.5Q40,45 37,27Q31,34 24,32Q17,34 11,27Z', 'f', 1.4],
    ['M17,41Q20,44 23,41M25,41Q28,44 31,41', '', 1],
    ...pair((x) => [[ell(x(6), 25, 1.7), '#2a2016', 0] as Shape, [`M${x(9.5)},21.5Q${x(6)},19 ${x(2.5)},21.5`, '', 2.2, '#e6e9ee'] as Shape]),
    [ell(24, 29.5, 3.3, 2.9), 'p', 1.1],
    [ell(24, 35, 3.2, 1.5), 'r', 0.9],
    ['M15,15.5L17,2.5Q24,0.5 31,2.5L33,15.5Z', 'b'],
    ['M15.3,12L32.7,12L33,15.5L15,15.5Z', 'y', 1],
    ['M9,16Q24,13 39,16Q40,20 36.5,19L11.5,19Q8,20 9,16Z', 'b'],
  ],
  Goose: [
    ['M15,34Q16,26 18,23L30,23Q32,26 33,34Q37,44 24,46.5Q11,44 15,34Z', 'f'],
    ['M18,41L21,44L24,41L27,44L30,41', '', 1],
    ['M12,16Q12,6 24,5.5Q36,6 36,16Q36,28 24,29Q12,28 12,16Z', 'f'],
    ['M22,6Q21,1 25,1.5Q24.5,4 26,6', 'f', 1.2],
    ...pair((x) => [
      [ell(x(7), 15.5, 3.3), 'w', 1.2] as Shape,
      [ell(x(6.5), 16, 1.8), '#2a2016', 0] as Shape,
      [ell(x(7.2), 15.2, 0.6), 'w', 0] as Shape,
      [`M${x(10.5)},11Q${x(7)},9.5 ${x(3.5)},11`, '', 1.3] as Shape,
    ]),
    ['M15,21Q24,17 33,21Q35,32 24,37.5Q13,32 15,21Z', 'o', 1.4],
    [ell(21.5, 24, 0.9, 0.7), '#2a2016', 0],
    [ell(26.5, 24, 0.9, 0.7), '#2a2016', 0],
    ['M17,29.5Q24,32.5 31,29.5', '', 1.2],
  ],
  Poodle: [
    [ell(24, 6, 6.2, 5.4), 'p'],
    [ell(9.6, 23, 5.6, 8.2), 'p'],
    [ell(38.4, 23, 5.6, 8.2), 'p'],
    [ell(24, 24, 12.5, 12), 'p'],
    [ell(24, 35.5, 8.2, 6.8), 'w'],
    ...pair((x) => [
      [ell(x(6.5), 22, 1.8), '#2a2016', 0] as Shape,
      [ell(x(6), 21.3, 0.55), 'w', 0] as Shape,
      [`M${x(8.5)},16.5Q${x(5.5)},14.5 ${x(2.8)},16`, '', 1.2, '#ffffff'] as Shape,
      [`M${x(0)},35.5Q${x(3)},39.5 ${x(5.5)},37`, '', 1.4] as Shape,
    ]),
    ['M3.5,17Q4.5,14 7,13.5', '', 1.3, '#ffffff'],
    ['M44.5,17Q43.5,14 41,13.5', '', 1.3, '#ffffff'],
    [ell(24, 32, 3.3, 2.4), '#2a2016', 0],
    ['M24,34.5L24,36.5', '', 1.4],
    [ell(24, 45, 4, 3), 'y', 1.2],
    ['M20.5,41.5L24,45L27.5,41.5', '', 1],
  ],
};

/** FACE_ART with each fill letter turned into its color, as printables.json carries it. */
export function resolvedFaceArt(): Record<string, [string, string, number, string][]> {
  return Object.fromEntries(
    Object.entries(FACE_ART).map(([name, shapes]) => [
      name,
      shapes.map(([d, f, w = 1.5, line = INK]) => [d, f.startsWith('#') ? f : (FILL_COLORS[f] ?? ''), w, line] as [string, string, number, string]),
    ]),
  );
}
