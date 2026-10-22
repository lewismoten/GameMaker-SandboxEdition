// Buildings painted in a three-quarter view (roof seen from above, front wall from the
// front), with the light from the top left and a soft shadow to the bottom right: cottages,
// towers, castle walls. The same painters draw the little ones on the world map and the big
// ones in town, which are then cut into blocks.
import { Canvas, type RGB, mix, clamp01, tnoise, speck } from './rgb';

export interface HouseStyle {
  roof: RGB[]; // dark, mid, light
  wall: RGB[];
  trim: RGB;
  door: RGB;
  /** Thatch, tile or slate texture on the roof. */
  roofKind?: 'thatch' | 'tile' | 'slate';
  chimney?: boolean;
  windows?: number;
}

export const STYLE = {
  thatch: { roof: [[120, 88, 40], [176, 136, 70], [216, 182, 108]], wall: [[150, 130, 104], [214, 198, 168], [236, 226, 204]], trim: [[96, 64, 36]][0], door: [92, 56, 30], roofKind: 'thatch', chimney: true } as HouseStyle,
  redTile: { roof: [[110, 34, 26], [170, 60, 40], [214, 104, 72]], wall: [[156, 140, 120], [222, 210, 188], [244, 236, 220]], trim: [80, 56, 40], door: [70, 46, 30], roofKind: 'tile', chimney: true } as HouseStyle,
  blueSlate: { roof: [[40, 52, 84], [64, 84, 124], [110, 132, 170]], wall: [[150, 136, 118], [214, 202, 182], [238, 230, 214]], trim: [76, 56, 42], door: [60, 40, 28], roofKind: 'slate' } as HouseStyle,
  greenTile: { roof: [[34, 74, 50], [54, 112, 70], [96, 156, 98]], wall: [[150, 136, 118], [218, 206, 186], [240, 232, 216]], trim: [80, 60, 40], door: [74, 50, 32], roofKind: 'tile', chimney: true } as HouseStyle,
  stone: { roof: [[70, 66, 70], [110, 104, 108], [150, 146, 148]], wall: [[100, 96, 92], [150, 144, 136], [190, 184, 174]], trim: [60, 56, 54], door: [70, 46, 30], roofKind: 'slate' } as HouseStyle,
};

/** Soft drop shadow of a rectangle (down and right), painted onto what's already there. */
export function shadow(cv: Canvas, x: number, y: number, w: number, h: number, k = 0.45, off = 2.5): void {
  cv.fillSdf(
    (px, py) => {
      const qx = Math.abs(px - (x + off + w / 2)) - w / 2;
      const qy = Math.abs(py - (y + off + h / 2)) - h / 2;
      return Math.max(qx, qy);
    },
    (px, py) => mix(cv.get(Math.min(cv.w - 1, Math.max(0, Math.floor(px))), Math.min(cv.h - 1, Math.max(0, Math.floor(py)))), [20, 26, 18], k),
  );
}

/**
 * A cottage: roof on top (its ridge running left to right), the front wall below with a door
 * and windows. (x, y) is the top-left of the roof; w x h the whole footprint.
 */
export function house(cv: Canvas, x: number, y: number, w: number, h: number, st: HouseStyle, seed = 1): { door: [number, number] } {
  const roofH = Math.round(h * 0.58);
  const wallH = h - roofH;
  shadow(cv, x + 1, y + 2, w - 1, h - 2);
  // front wall
  cv.rect(x + 1, y + roofH, w - 2, wallH, (px, py) => {
    const n = tnoise(px, py, 2.5, 20, seed);
    const shade = 1 - (py - (y + roofH)) / (wallH * 3);
    return mix(st.wall[0], st.wall[1], clamp01(0.55 + n * 0.4) * shade);
  });
  // timber frame
  cv.rect(x + 1, y + roofH, w - 2, 1, st.trim);
  cv.rect(x + 1, y + h - 1.2, w - 2, 1.2, mix(st.trim, [40, 30, 20], 0.4));
  const dw = Math.max(3, Math.round(w * 0.18));
  const dx = x + Math.round(w / 2 - dw / 2);
  const dh = Math.min(wallH - 1, Math.max(4, Math.round(wallH * 0.75)));
  cv.rrect(dx, y + h - dh, dw, dh, 1, st.door);
  cv.rect(dx + dw - 1.4, y + h - dh * 0.5, 0.8, 0.8, [210, 180, 90]);
  const nWin = st.windows ?? (w >= 16 ? 2 : 1);
  for (let k = 0; k < nWin; k++) {
    const wx = nWin === 1 ? (dx - x > w / 2 ? x + 2.5 : x + w - 5.5) : k === 0 ? x + 2.5 : x + w - 5.5;
    if (wx + 3 > dx && wx < dx + dw) continue;
    const wy = y + roofH + Math.max(1.5, wallH * 0.25);
    cv.rect(wx - 0.5, wy - 0.5, 4, 3.6, st.trim);
    cv.rect(wx, wy, 3, 2.6, (px, py) => mix([250, 220, 120], [120, 150, 190], clamp01((py - wy) / 2.6 + (px - wx) * 0.05)));
    cv.rect(wx + 1.3, wy, 0.5, 2.6, st.trim);
  }
  // roof: lit on the upper slope, darker toward the eaves
  const ridge = y + roofH * 0.42;
  cv.poly(
    [
      [x - 0.5, y + roofH + 0.5],
      [x + 1.5, y],
      [x + w - 1.5, y],
      [x + w + 0.5, y + roofH + 0.5],
    ],
    (px, py) => {
      const up = py < ridge;
      const t = up ? (py - y) / (ridge - y) : (py - ridge) / (y + roofH - ridge);
      let c = up ? mix(st.roof[2], st.roof[1], t * 0.6) : mix(st.roof[1], st.roof[0], t);
      if (st.roofKind === 'thatch') c = mix(c, st.roof[0], speck(Math.floor(px), Math.floor(py * 0.5), 20, seed) * 0.35);
      else if (st.roofKind === 'tile') {
        const row = Math.floor((py - y) / 2);
        const cx = (px - x + (row % 2) * 1.5) % 3;
        if ((py - y) % 2 < 0.6 || cx < 0.5) c = mix(c, st.roof[0], 0.5);
      } else if (st.roofKind === 'slate') {
        if ((py - y) % 2.5 < 0.6) c = mix(c, st.roof[0], 0.4);
      }
      return c;
    },
  );
  cv.line(x + 1.5, ridge, x + w - 1.5, ridge, 0.9, mix(st.roof[2], [255, 255, 255], 0.2));
  if (st.chimney) {
    const cx = x + w * 0.72;
    cv.rect(cx, y - 2, 2.6, 4, [120, 70, 56]);
    cv.rect(cx - 0.3, y - 2.6, 3.2, 1, [150, 100, 80]);
  }
  return { door: [dx + dw / 2, y + h] };
}

/** A round tower seen from above-front: a cylinder with a cone roof (or battlements). */
export function tower(cv: Canvas, cx: number, top: number, r: number, h: number, wall: RGB[], roof: RGB[] | null, seed = 3): void {
  shadow(cv, cx - r + 1, top + r, r * 2, h, 0.4);
  cv.rect(cx - r, top + r, r * 2, h - r, (px, py) => {
    const u = (px - (cx - r)) / (2 * r);
    const lit = Math.sin(u * Math.PI) * (1 - u * 0.6);
    const brick = (Math.floor(py / 2) % 2 ? Math.floor(px / 3) : Math.floor((px + 1.5) / 3)) * 7 + Math.floor(py / 2);
    const n = speck(brick, 0, 97, seed) * 0.15;
    const mortar = py % 2 < 0.45;
    return mortar ? mix(wall[0], wall[1], 0.3) : mix(wall[0], wall[2], clamp01(lit * 0.9 + n));
  });
  cv.ellipse(cx, top + h, r, r * 0.45, (px) => mix(wall[0], wall[1], (px - (cx - r)) / (2 * r)));
  if (roof) {
    cv.poly(
      [
        [cx - r - 1, top + r + 0.5],
        [cx, top - r * 1.6],
        [cx + r + 1, top + r + 0.5],
      ],
      (px, py) => mix(roof[2], roof[0], clamp01((px - (cx - r)) / (2 * r) * 0.9 + (py - top) * 0.02)),
    );
    cv.ellipse(cx, top + r + 0.5, r + 1, r * 0.4, roof[0]);
  } else {
    cv.ellipse(cx, top + r, r, r * 0.5, wall[1]);
    cv.ellipse(cx, top + r, r * 0.7, r * 0.32, mix(wall[0], [0, 0, 0], 0.3));
    for (let k = -2; k <= 2; k++) cv.rect(cx + k * (r / 2.5) - 0.8, top + r * 0.4 - 1.5 + Math.abs(k) * 0.3, 1.6, 1.8, wall[2]);
  }
}

/** A stretch of stone wall: the walkway on top, the face below, battlements. */
export function wallRun(cv: Canvas, x: number, y: number, w: number, h: number, stone: RGB[], seed = 5): void {
  const topH = Math.min(4, h * 0.35);
  shadow(cv, x, y + 1, w, h, 0.4);
  cv.rect(x, y + topH, w, h - topH, (px, py) => {
    const row = Math.floor((py - y) / 2.5);
    const col = Math.floor((px + (row % 2) * 2) / 4);
    const mortar = (py - y) % 2.5 < 0.5 || (px + (row % 2) * 2) % 4 < 0.5;
    const n = speck(col, row, 61, seed) * 0.25;
    return mortar ? stone[0] : mix(stone[1], stone[2], clamp01(0.3 + n - (py - y - topH) / (h * 2)));
  });
  cv.rect(x, y, w, topH, mix(stone[2], [255, 255, 255], 0.1));
  for (let k = x + 0.5; k < x + w - 1; k += 3) cv.rect(k, y - 1.6, 1.8, 1.8, stone[2]);
}
