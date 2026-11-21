// Extruded Sandbox letter shapes, colors and falling animation.
import {
  add,
  apply,
  clamp01,
  dot,
  fromAxes,
  Hit,
  Lettering,
  Material,
  mix,
  mulM,
  placed,
  rotX,
  rotY,
  scale,
  Shape,
  sub,
  V,
} from '@lewismoten/gamemaker-sandbox-tools/kit/raytrace';
import { DistanceGrid, ExtrudedText, Seg, textStrokes } from '@lewismoten/gamemaker-sandbox-tools/kit/sdftext';
import { DROP_START, DROP_STAGGER, DROP, SWEEP_START, SWEEP, cam, WHITE } from './settings';
import { surface } from './materials';

/** The colors of S A N D B O X as THE SANDBOX BBS shows them (bbsName.ts), made solid. */
const PIECE_COLORS: V[] = [
  [1.0, 0.85, 0.12], // -=  yellow
  [1.0, 0.2, 0.18], // S  light red
  [1.0, 0.88, 0.15], // A  yellow
  [0.22, 0.95, 0.22], // N  light green
  [0.15, 0.88, 0.95], // D  light cyan
  [0.28, 0.32, 1.0], // B  light blue
  [1.0, 0.28, 0.95], // O  light magenta
  [0.78, 0.42, 0.08], // X  brown
  [1.0, 0.85, 0.12], // =-  yellow
];
const PIECES = ['-=', 'S', 'A', 'N', 'D', 'B', 'O', 'X', '=-'];

/** The logo's frame: in front of the camera, leaning back a little. */
export const LOGO_C: V = add(add(cam.eye, scale(cam.fw, 4.3)), scale(cam.up, 1.02));
export const LOGO_ROT = mulM(fromAxes(cam.right, cam.up, cam.fw), rotX(-0.22));
export const LOGO_SIZE = 0.43; // world height of a capital

export const fatter = (segs: Seg[], k: number): Seg[] => segs.map(([a, b, c, d, r]) => [a, b, c, d, r * k]);

interface Piece {
  text: ExtrudedText;
  /** Where its middle sits along the logo, in cap heights. */
  x: number;
}

let pieces: Piece[] | undefined;
export function logo(): { pieces: Piece[] } {
  if (!pieces) {
    const widths: number[] = [];
    const glyphs = PIECES.map((s) => {
      const segs = fatter(textStrokes(s, 1, -0.5, 0.06), 1.3);
      const xs = segs.flatMap(([x0, , x1, , r]) => [x0 - r, x1 + r]);
      widths.push(Math.max(...xs) - Math.min(...xs));
      return segs;
    });
    const gap = 0.24;
    const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
    let pen = -total / 2;
    pieces = glyphs.map((segs, i) => {
      const x = pen + widths[i] / 2;
      pen += widths[i] + gap;
      return { text: new ExtrudedText(new DistanceGrid(segs, 0.01, 0.2), 0.42, 0.07), x };
    });
  }
  return { pieces };
}

/** How far across the logo (world units from its middle) a point is. */
const acrossLogo = (p: V) => dot(sub(p, LOGO_C), cam.right);

function bandGlow(p: V, band: number | undefined): number {
  if (band === undefined) return 0;
  const k = acrossLogo(p) + 0.6 * dot(sub(p, LOGO_C), cam.up);
  return Math.exp(-(((k - band) / 0.35) ** 2)) * 0.9;
}

/** Glossy candy plastic for a piece: lighter toward the top, a sweep of light when it passes. */
function pieceMaterial(color: V, band: number | undefined): Material {
  return (h: Hit) => {
    const t = clamp01(h.local[1] + 0.5);
    const c = mix(scale(color, 0.85), mix(color, WHITE, 0.3), t);
    const g = bandGlow(h.p, band);
    return surface(c, { kd: 0.95, ks: 0.9, shine: 40, mirror: 0.16, glow: scale(mix(color, WHITE, 0.6), g) });
  };
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** The pieces in the air or landed at frame f (none before they start falling). */
export function logoShapes(f: number, glow = true): { key: string; shape: Shape }[] {
  const { pieces: ps } = logo();
  const band = glow && f >= SWEEP_START && f < SWEEP_START + SWEEP ? -3.4 + (6.8 * (f - SWEEP_START)) / (SWEEP - 1) : undefined;
  const out: { key: string; shape: Shape }[] = [];
  ps.forEach((p, i) => {
    const t = (f - (DROP_START + i * DROP_STAGGER)) / DROP;
    if (t <= 0) return;
    const k = Math.min(1, t);
    const e = easeOut(k);
    // falls from above with a little bounce, spinning about its upright
    const bounce = k < 1 ? Math.sin(Math.PI * Math.min(1, k * 1.25)) * (1 - k) * 0.6 : 0;
    const drop = (1 - e) * 5.5 + bounce;
    const spin = (1 - e) * Math.PI * 2;
    const rot = mulM(LOGO_ROT, rotY(spin));
    const pos = add(LOGO_C, apply(LOGO_ROT, [p.x * LOGO_SIZE, drop * LOGO_SIZE, 0]));
    out.push({ key: `piece${i}`, shape: new Lettering(p.text, placed(pos, rot, LOGO_SIZE), pieceMaterial(PIECE_COLORS[i], band)) });
  });
  return out;
}
