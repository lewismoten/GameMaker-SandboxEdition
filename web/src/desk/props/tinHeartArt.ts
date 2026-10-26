// The tin heart as the games draw it (games/kit/tinHeart.ts), for the room: the clock heart
// (clockHeart.ts). The dev server can't load games/, so this is a copy of the kit's 20x20
// drawing; tinHeartArt.test.ts keeps the two the same. Drawn as crisp SVG pixels in tin grays.

/** Each pixel's part: 0 outside, 1 outline, 2..4 tin dark to light, 5 glint and clock face, 6 hands and rivet shadows. */
export function tinHeartParts(frame = 0): Uint8Array {
  const px = new Uint8Array(400);
  const set = (x: number, y: number, c: number) => x >= 0 && y >= 0 && x < 20 && y < 20 && (px[y * 20 + x] = c);
  const inside = (x: number, y: number): boolean => {
    const cx = x + 0.5;
    const cy = y + 0.5;
    if (Math.hypot(cx - 6.3, cy - 6.6) <= 3.9 || Math.hypot(cx - 13.7, cy - 6.6) <= 3.9) return true;
    if (cy >= 6.6 && cy <= 17.4) return Math.abs(cx - 10) <= 7.6 * (1 - (cy - 6.6) / 10.8);
    return false;
  };
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < 20 && y < 20 && inside(x, y);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (at(x, y)) {
        const shade = (x - 10) * 0.08 + (y - 9) * 0.1;
        set(x, y, shade < -0.55 ? 4 : shade > 0.5 ? 2 : 3);
      } else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) set(x, y, 1);
    }
  for (const [x, y] of [
    [3, 6],
    [6, 3],
    [13, 3],
    [16, 6],
    [14, 11],
    [5, 11],
  ]) {
    set(x, y, 4);
    if (at(x + 1, y + 1)) set(x + 1, y + 1, 6);
  }
  set(5, 5, 5);
  set(6, 5, 4);
  set(5, 6, 4);
  // the little clock face, its hands at ten past ten (the kit's Pixels.disc)
  const disc = (cx: number, cy: number, r: number, c: number) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y, c);
  };
  disc(10, 9.5, 2.4, 1);
  disc(10, 9.5, 1.6, 5);
  set(10, 9, 6);
  set(10, 8, 6);
  set(11, 9, 6);
  if (frame > 0) {
    const gx = [0, 5, 9, 14][frame] ?? 14;
    const gy = [0, 9, 13, 8][frame] ?? 8;
    for (const [x, y] of [
      [gx, gy],
      [gx - 1, gy],
      [gx + 1, gy],
      [gx, gy - 1],
      [gx, gy + 1],
    ])
      if (at(x, y)) set(x, y, x === gx && y === gy ? 5 : 4);
  }
  return px;
}

const COLORS = ['', '#24272c', '#6d757d', '#a7afb7', '#dde2e6', '#ffffff', '#3c4248'];

/** The heart as an SVG (20x20 pixels drawn at `size` CSS pixels), its shine at `frame` (0..3). */
export function tinHeartSvg(size: number, frame = 0): SVGSVGElement {
  const parts = tinHeartParts(frame);
  const rects: string[] = [];
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const c = parts[y * 20 + x];
      if (c) rects.push(`<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${COLORS[c]}"/>`);
    }
  const box = document.createElement('span');
  box.innerHTML = `<svg viewBox="0 1 20 18" width="${size}" height="${Math.round((size * 18) / 20)}" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
  return box.firstElementChild as SVGSVGElement;
}
