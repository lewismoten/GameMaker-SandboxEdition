// The Library room's AV cart (libraryRoom.ts): a black school cart of open shelves, a little narrower at the top,
// on casters, with a deep, boxy 1990s CRT TV on top (a 4:3 tube, wider than tall) and a VCR on the middle shelf whose vacuum fluorescent display blinks 12:00. Drawn in
// roomGeo.ts's perspective with roomObjects.ts's helpers. The TV is the room's button for videos and walkthroughs.
import { box, proj, pts, type Pt } from './roomGeo';
import { faces, footprint, onFront, rect, spot, type Spot } from './roomObjects';

/** Where the cart stands (meters): in front of the stools, in the gap between the card catalog and the desk, where it hides no button. */
const AV_CART = { x0: -1.82, x1: -1.26, z0: -1.5, z1: -1.05 };

const BLACK = '#1b1b1f';
const EDGE = '#4a4a52';
const SHELF_TOP = 0.88;

/** How far the frame is drawn in at height y: the cart tapers toward the top. */
const taper = (y: number) => (y / SHELF_TOP) * 0.045;

export function avCartArt(): Spot {
  const { x0, x1, z0, z1 } = AV_CART;
  const at = (y: number, grow = 0) => [x0 + taper(y) - grow, x1 - taper(y) + grow, z0 + taper(y) - grow, z1 - taper(y) + grow] as const;
  const slab = (y: number, th = 0.03) => {
    const [a, b, c, d] = at(y);
    return box(a, b, c, d, y, y + th);
  };
  const post = (x: number, z: number) => {
    const [bx, by] = proj(x + (x < (x0 + x1) / 2 ? 1 : -1) * taper(0.1), 0.1, z + (z < (z0 + z1) / 2 ? 1 : -1) * taper(0.1));
    const [tx, ty] = proj(x + (x < (x0 + x1) / 2 ? 1 : -1) * taper(SHELF_TOP), SHELF_TOP, z + (z < (z0 + z1) / 2 ? 1 : -1) * taper(SHELF_TOP));
    return `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${BLACK}" stroke-width="3.2" stroke-linecap="round"/><line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${EDGE}" stroke-width=".7" stroke-linecap="round" opacity=".7"/>`;
  };
  const caster = (x: number, z: number) => faces(box(x - 0.035, x + 0.035, z - 0.035, z + 0.035, 0, 0.1), '#0e0e10', '#2a2a2e');
  const casters = [caster(x0 + 0.05, z1 - 0.05), caster(x1 - 0.05, z1 - 0.05), caster(x0 + 0.05, z0 + 0.05), caster(x1 - 0.05, z0 + 0.05)];

  const low = slab(0.16);
  const mid = slab(0.5);
  const topShelf = slab(SHELF_TOP, 0.04);
  const shelfFaces = (f: ReturnType<typeof slab>) => faces(f, BLACK, '#2c2c32', '#141417');

  // the VCR on the middle shelf: charcoal body, a tape door, a cyan-blue vacuum fluorescent display and two little buttons
  const mx = (x0 + x1) / 2;
  const vcr = box(mx - 0.29, mx + 0.29, z0 + 0.06, z1 - 0.06, 0.53, 0.65);
  const door = rect(onFront(vcr, 0.06, 0.2, 0.55, 0.8), 'rx="1" fill="#0c0c0e" stroke="#555" stroke-width=".6"');
  const lcd = onFront(vcr, 0.6, 0.3, 0.88, 0.75);
  const display =
    `<defs><filter id="av-vfd" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` +
    rect(lcd, 'fill="#031116" stroke="#0a2a33" stroke-width=".6"') +
    `<text class="av-blink" x="${(lcd.x + lcd.w / 2).toFixed(1)}" y="${(lcd.y + lcd.h * 0.78).toFixed(1)}" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-weight="700" font-size="${(lcd.h * 0.8).toFixed(1)}" fill="#6ef4ff" filter="url(#av-vfd)">12:00</text>`;
  const vcrArt = faces(vcr, '#35353b', '#44444b', '#232328') + door + display;

  // the CRT TV: a wide front box (a 20-inch set, wider than tall) with a 4:3 tube and knobs, and a deep tapering back for the tube
  const ty = SHELF_TOP + 0.04;
  const [ta, tb, tc] = at(ty);
  const tvFront = box(ta - 0.04, tb + 0.04, tc, z1 - 0.2, ty, ty + 0.38);
  const tvBack = box(ta + 0.05, tb - 0.05, z1 - 0.2, z1 + 0.04, ty + 0.05, ty + 0.33);
  const area = onFront(tvFront, 0.08, 0.12, 0.7, 0.88);
  // the tube is 4:3 in the picture whatever the perspective does to the cabinet
  const scr = { x: area.x, y: area.y + (area.h - area.w * 0.75) / 2, w: area.w, h: area.w * 0.75 };
  const screen =
    `<defs><radialGradient id="av-glow" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#2f6f9a" stop-opacity=".55"/><stop offset="1" stop-color="#0b1620" stop-opacity="1"/></radialGradient></defs>` +
    rect(scr, 'rx="11" fill="#0b1620" stroke="#050607" stroke-width="1.5"') +
    rect({ x: scr.x + 1, y: scr.y + 1, w: scr.w - 2, h: scr.h - 2 }, 'rx="11" fill="url(#av-glow)"') +
    `<polygon points="${pts([
      [scr.x + scr.w * 0.1, scr.y + scr.h * 0.1],
      [scr.x + scr.w * 0.45, scr.y + scr.h * 0.1],
      [scr.x + scr.w * 0.15, scr.y + scr.h * 0.55],
      [scr.x + scr.w * 0.1, scr.y + scr.h * 0.5],
    ])}" fill="#fff" opacity=".16"/>`;
  const knob = (k: number) => {
    const p = onFront(tvFront, 0.78, 0.62 - k * 0.26, 0.9, 0.82 - k * 0.26);
    return `<ellipse cx="${(p.x + p.w / 2).toFixed(1)}" cy="${(p.y + p.h / 2).toFixed(1)}" rx="${(p.w / 2).toFixed(1)}" ry="${(p.w / 2).toFixed(1)}" fill="#2e2e33" stroke="#6a6a72" stroke-width=".7"/>`;
  };
  const grille = [0, 1, 2]
    .map((k) => {
      const g = onFront(tvFront, 0.77, 0.2 - k * 0.04 + 0.04, 0.92, 0.22 - k * 0.04 + 0.04);
      return rect(g, 'fill="#08080a"');
    })
    .join('');
  const tvArt = faces(tvBack, '#202024', '#2c2c31', '#18181b') + faces(tvFront, '#2a2a30', '#3a3a41', '#1c1c20') + screen + knob(0) + knob(1) + grille;

  // a power cable looping from the TV's back down to the floor
  const [c0x, c0y] = proj(x1 - 0.14, ty + 0.1, z1 - 0.05);
  const [c1x, c1y] = proj(x1 - 0.05, 0.12, z1 + 0.02);
  const [c2x, c2y] = proj(x1 + 0.18, 0, z1 + 0.18);
  const cable = `<path d="M${c0x.toFixed(1)} ${c0y.toFixed(1)}Q${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)}" fill="none" stroke="#0a0a0c" stroke-width="1.8" stroke-linecap="round"/>`;

  const frame = [
    ...low.front,
    ...(mid.top ?? []),
    ...(topShelf.top ?? []),
    ...tvFront.front,
    ...(tvFront.top ?? []),
    ...(tvFront.side ?? []),
    ...(vcr.top ?? []),
  ] as Pt[];
  return spot(
    casters.join('') +
      post(x0, z1) +
      post(x1, z1) +
      cable +
      shelfFaces(low) +
      shelfFaces(mid) +
      vcrArt +
      post(x0, z0) +
      post(x1, z0) +
      shelfFaces(topShelf) +
      tvArt,
    frame,
    footprint(x0, x1, z0, z1),
  );
}
