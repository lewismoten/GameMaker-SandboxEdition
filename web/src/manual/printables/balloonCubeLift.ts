// Intermediate fold view: four faces rise around the middle square; arrows show the motion.
// Coordinates share the cube's isometric orientation, with the rear panels drawn first.
export function balloonCubeLiftSvg(): string {
  const project = ([x, y, z]: number[]) => [120 + (x + y) * 0.68, 98 + (x - y) * 0.34 - z * 0.85];
  const points = (vs: number[][]) =>
    vs
      .map((v) =>
        project(v)
          .map((n) => n.toFixed(1))
          .join(','),
      )
      .join(' ');
  const half = 26;
  const reach = 38;
  const raised = 22;
  const panels = [
    [
      [-half, half, 0],
      [half, half, 0],
      [half, half + reach, raised],
      [-half, half + reach, raised],
    ],
    [
      [-half, -half, 0],
      [-half, half, 0],
      [-half - reach, half, raised],
      [-half - reach, -half, raised],
    ],
    [
      [-half, -half, 0],
      [half, -half, 0],
      [half, half, 0],
      [-half, half, 0],
    ],
    [
      [half, -half, 0],
      [-half, -half, 0],
      [-half, -half - reach, raised],
      [half, -half - reach, raised],
    ],
    [
      [half, half, 0],
      [half, -half, 0],
      [half + reach, -half, raised],
      [half + reach, half, raised],
    ],
  ];
  let out =
    '<rect width="240" height="180" fill="white"/>' +
    [...panels]
      .reverse()
      .map((p, i) => `<polygon points="${points(p)}" fill="${i === 2 ? '#fff9e8' : '#c9f4ee'}" stroke="#1c1630" stroke-width="1.6"/>`)
      .join('');
  const base = panels[2];
  out += `<polygon points="${points(base)}" fill="none" stroke="#c4202c" stroke-dasharray="4 3" stroke-width="2"/>`;
  out +=
    '<g fill="none" stroke="#c4202c" stroke-width="2.4"><path d="M30 104 Q18 80 35 62 M35 62 l-1 12 M35 62 l-12 3"/><path d="M210 104 Q222 80 205 62 M205 62 l1 12 M205 62 l12 3"/></g>';
  out +=
    '<g font-family="sans-serif" font-size="11" text-anchor="middle" fill="#1c1630"><text x="120" y="130">middle stays flat</text><text x="120" y="153">Start lifting the four faces</text><text x="120" y="168">after creasing and unfolding.</text></g>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" role="img" aria-label="Four faces partly lifted around the flat middle square">${out}</svg>`;
}
