// Final Curtain's Stage Box: a plan view of the layers behind the front panel (the order they stand in, front to back) and a
// side view of what sits below the floor. A reading aid for assembly; not a laser file.
import type { Dims } from './stageBoxDims';

export function assemblySvg(d: Dims): string {
  const s = 6; // px per mm
  const W = 760;
  const layers: [string, number, number, string][] = [
    ['P front', -d.t, 0, '#b8884c'],
    ['arm', 0, d.t, '#7a9c5a'],
    ['C dagger bar', d.yC - d.t / 2, d.yC + d.t / 2, '#c0504d'],
    ['D1 front curtain', d.yD1 - d.t / 2, d.yD1 + d.t / 2, '#4d7cc0'],
    ['D2 rear curtain', d.yD2 - d.t / 2, d.yD2 + d.t / 2, '#7a4dc0'],
    ['W backdrop', d.yW, d.yW + d.t, '#555555'],
  ];
  const x0 = 40;
  const y0 = 60;
  const rects = layers
    .map(
      ([n, a, b, c], i) =>
        `<rect x="${x0 + (a + d.t) * s}" y="${y0}" width="${(b - a) * s}" height="120" fill="${c}"/><text x="${x0 + (a + d.t) * s}" y="${y0 - 8 - (i % 2) * 14}" font-size="11" fill="#222">${n}</text>`,
    )
    .join('');
  const fingers = d.fingerY.map((y) => `<rect x="${x0 + (y + d.t) * s}" y="${y0 + 130}" width="${d.fingerW * s}" height="14" fill="#d9a441"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="260" viewBox="0 0 ${W} 260" font-family="sans-serif">
<rect width="${W}" height="260" fill="#fff"/>
<text x="10" y="18" font-size="13" font-weight="bold" fill="#222">Stage Box: the layers behind the front panel, front to back (side view, y across)</text>
<text x="10" y="34" font-size="11" fill="#222">Each plate stands in its own floor slot and slides left. Below the floor, the drawer's comb has a finger in the gap in front of each skirt.</text>
${rects}
<rect x="${x0}" y="${y0 + 120}" width="${(d.Di + 2 * d.t) * s * 0.35}" height="8" fill="#e2be8c"/><text x="${x0}" y="${y0 + 124 + 20}" font-size="11" fill="#222">stage floor (slots) and, below it, the comb fingers:</text>
${fingers}
<text x="${x0}" y="${y0 + 175}" font-size="11" fill="#222">Order: dagger (I, raven) -> front curtain (II, rose) -> rear curtain (III, moon) -> pull the drawer out the back.</text>
</svg>
`;
}
