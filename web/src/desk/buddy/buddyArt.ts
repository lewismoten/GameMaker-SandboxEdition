// Scoot, drawn: a palm-size gray LCD toy on its kickstand, and on its two-tone green screen a
// little round courier with a satchel. Each pose is a 16 x 16 one-bit picture, so the same
// frames could light an e-ink or CYD face later. Unlit cells show faintly, as on a real LCD.

import type { Pose } from './buddyLines';

const W = 16;
/** The courier standing: round head, a strap across, the satchel at its right side, two feet. */
const BASE = [
  '................',
  '.....######.....',
  '....#......#....',
  '...#........#...',
  '...#..#..#..#...',
  '...#..#..#..#...',
  '...#........#...',
  '...#.#....#.#...',
  '....#.####.#....',
  '.....######.....',
  '....#.#....#....',
  '....#..#...####.',
  '....#...#..#..#.',
  '....#....#.####.',
  '.....######.....',
  '.....##..##.....',
];

/** Rows that change for each pose (row index -> row). */
const POSES: Record<Pose | 'blink', Record<number, string>> = {
  idle: {},
  blink: { 4: '...#........#...', 5: '...#.##..##.#...' },
  // looking left, toward the monitor
  look: { 4: '...#.#..#...#...', 5: '...#.#..#...#...' },
  // eyes smiling
  happy: { 5: '...#.#.##.#.#...' },
  // one arm up, waving
  wave: { 7: '.#.#.#....#.#...', 8: '.#..#.####.#....', 9: '.##..######.....', 10: '..###.#....#....' },
  // both arms up, eyes smiling
  cheer: {
    5: '...#.#.##.#.#...',
    6: '.#.#........#.#.',
    7: '.#.#.#....#.#.#.',
    8: '.##.#.####.#.##.',
    9: '..##.######.##..',
  },
  // eyes shut, a small z drifting up
  sleep: {
    0: '.............###',
    1: '.....######...#.',
    2: '....#......#.###',
    4: '...#........#...',
    5: '...#.##..##.#...',
    7: '...#........#...',
    8: '....#..##..#....',
  },
};

/** The 16 rows of a pose. */
function poseRows(pose: Pose | 'blink'): string[] {
  const p = POSES[pose];
  return BASE.map((row, i) => p[i] ?? row);
}

/** The whole toy as SVG markup (viewBox 64 x 80). */
export function buddySvg(pose: Pose | 'blink'): string {
  const px = 2.5;
  const ox = 12;
  const oy = 11;
  let lit = '';
  let ghost = '';
  poseRows(pose).forEach((row, y) => {
    for (let x = 0; x < W; x++) {
      const r = `<rect x="${ox + x * px}" y="${oy + y * px}" width="${px - 0.3}" height="${px - 0.3}"/>`;
      if (row[x] === '#') lit += r;
      else ghost += r;
    }
  });
  return `<svg viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
<defs><linearGradient id="bdy-shell" x1="0" x2="1"><stop offset="0" stop-color="#d9d6cc"/><stop offset=".5" stop-color="#c3bfb2"/><stop offset="1" stop-color="#a8a495"/></linearGradient></defs>
<path d="M14 70 L10 80 H54 L50 70Z" fill="#6e6a60"/>
<rect x="2" y="2" width="60" height="72" rx="9" fill="url(#bdy-shell)" stroke="#7d796d" stroke-width="1.2" shape-rendering="geometricPrecision"/>
<rect x="7" y="6" width="50" height="50" rx="3" fill="#55584c" shape-rendering="geometricPrecision"/>
<rect x="10" y="9" width="44" height="44" fill="#a7b98a"/>
<g fill="#93a678">${ghost}</g>
<g fill="#28321f">${lit}</g>
<g fill="#5b574d" shape-rendering="geometricPrecision"><circle cx="20" cy="65" r="3.2"/><circle cx="32" cy="65" r="3.2"/><circle cx="44" cy="65" r="3.2"/></g>
</svg>`;
}
