// The wrong-number die's face art (pips, captions, the 0 with its blow hole), drawn once in a 100-unit square and placed by the printed
// sheet (balloonCube.ts) and the fold pictures (balloonCubeScene.ts).
import type { V2 } from './balloonCubeSim';
import type { CubeFace } from './balloonCubeTypes';

export const INK = '#1c1630';
export const FACE = '#c9f4ee';
export const RED = '#c4202c';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One face's art in a 100-unit square centered on 0, y down, the face's up toward -y. */
export function faceArt(f: CubeFace, lid: boolean): string {
  const g = 25;
  const grid: Record<number, V2[]> = {
    1: [[0, 0]],
    2: [
      [-g, -g],
      [g, g],
    ],
    3: [
      [-g, -g],
      [0, 0],
      [g, g],
    ],
    4: [
      [-g, -g],
      [g, -g],
      [-g, g],
      [g, g],
    ],
    7: [
      [-g, -g],
      [g, -g],
      [-g, 0],
      [0, 0],
      [g, 0],
      [-g, g],
      [g, g],
    ],
  };
  let out = `<rect x="-50" y="-50" width="100" height="100" fill="${FACE}"/>`;
  if (lid) {
    // the 0: a ring with the blow hole in the middle, the caption ringed round it
    out += `<circle r="21" fill="none" stroke="${INK}" stroke-width="9"/><circle r="5" fill="${INK}"/>`;
    if (f.caption) {
      // one letter at a time round the hole (a text path would break where the art is placed in a transformed group)
      const ring = `${f.caption} · ${f.caption} · `;
      const turn = 360 / ring.length;
      out += [...ring]
        .map(
          (ch, i) =>
            `<text transform="rotate(${(i * turn).toFixed(2)}) translate(0,-38.5)" font-size="8.6" font-weight="700" text-anchor="middle" fill="${INK}" font-family="Arial,sans-serif">${esc(ch)}</text>`,
        )
        .join('');
    }
  } else {
    const dots = grid[f.pips] ?? [];
    dots.forEach(([x, y], i) => {
      const dead = f.dead && i === dots.length - 1;
      out += dead
        ? `<circle cx="${x}" cy="${y * 0.9 - 3}" r="8.5" fill="#fff" stroke="${RED}" stroke-width="3"/><path d="M${x - 5},${y * 0.9 - 8}L${x + 5},${y * 0.9 + 2}M${x + 5},${y * 0.9 - 8}L${x - 5},${y * 0.9 + 2}" stroke="${RED}" stroke-width="2.6"/>`
        : `<circle cx="${x}" cy="${y * 0.9 - 3}" r="8.5" fill="${INK}"/>`;
    });
    if (f.caption)
      out += `<text y="44" font-size="8.4" font-weight="700" text-anchor="middle" fill="${INK}" font-family="Arial,sans-serif">${esc(f.caption)}</text>`;
  }
  return out + `<rect x="-49" y="-49" width="98" height="98" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
}

