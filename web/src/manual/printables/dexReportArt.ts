// Pencil drawing helpers for Dex Dynamo's science report (dexReport.ts): each returns SVG markup in
// "cell" units, one unit = one square of the graph paper, so the sketches follow the grid.

/** An inline sketch: w x h cells. `label` is its text alternative. */
export function sk(w: number, h: number, label: string, body: string, cls = ''): string {
  return (
    `<svg class="dr-sk ${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label.replace(/"/g, '&quot;')}">` +
    `<defs><filter id="dr-rough" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="4"/>` +
    `<feDisplacementMap in="SourceGraphic" scale="0.09"/></filter></defs><g filter="url(#dr-rough)">${body}</g></svg>`
  );
}

const n = (v: number): string => String(Math.round(v * 100) / 100);

/** A path; `c` adds a color class: cr (red pencil), cb (blue), cg (green), th (thick). */
export const P = (d: string, c = ''): string => `<path class="pn ${c}" d="${d}"/>`;
export const L = (x1: number, y1: number, x2: number, y2: number, c = ''): string => P(`M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`, c);
/** A polyline through points [x, y, x, y, ...]. */
export function PL(pts: number[], c = ''): string {
  let d = '';
  for (let i = 0; i < pts.length; i += 2) d += (i ? 'L' : 'M') + n(pts[i]) + ' ' + n(pts[i + 1]);
  return P(d, c);
}
export const T = (x: number, y: number, s: string, size = 0.85, anchor: 'start' | 'middle' | 'end' = 'start', c = ''): string =>
  `<text class="${c}" x="${n(x)}" y="${n(y)}" font-size="${size}" text-anchor="${anchor}">${s}</text>`;
export const RECT = (x: number, y: number, w: number, h: number, c = ''): string => P(`M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`, c);
/** A labeled box; label lines are split on "|". */
export function BOX(x: number, y: number, w: number, h: number, label: string, size = 0.8, c = ''): string {
  const lines = label.split('|');
  const y0 = y + h / 2 - ((lines.length - 1) * size * 0.55) / 2 + size * 0.3;
  return RECT(x, y, w, h, c) + lines.map((s, i) => T(x + w / 2, y0 + i * size * 1.05, s, size, 'middle')).join('');
}
export function ARROW(x1: number, y1: number, x2: number, y2: number, c = ''): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = (d: number): string => `${n(x2 - 0.35 * Math.cos(a + d))} ${n(y2 - 0.35 * Math.sin(a + d))}`;
  return L(x1, y1, x2, y2, c) + P(`M${h(0.45)}L${n(x2)} ${n(y2)}L${h(-0.45)}`, c);
}
/** Horizontal resistor from (x, y), 3 cells long. */
export const RES = (x: number, y: number): string => P(`M${n(x)} ${n(y)}h.5l.25-.45l.4.9l.4-.9l.4.9l.4-.9l.25.45h.4`);
/** Vertical resistor from (x, y) going down, 3 cells long. */
export const RESV = (x: number, y: number): string => P(`M${n(x)} ${n(y)}v.5l-.45.25l.9.4l-.9.4l.9.4l-.9.4l.45.25v.4`);
/** Capacitor in a horizontal wire: leads either side of two plates at (x, y). */
export const CAP = (x: number, y: number): string =>
  L(x - 1, y, x - 0.15, y) + L(x - 0.15, y - 0.6, x - 0.15, y + 0.6) + L(x + 0.15, y - 0.6, x + 0.15, y + 0.6) + L(x + 0.15, y, x + 1, y);
/** Capacitor from (x, y) going down: plates across the wire. */
export const CAPV = (x: number, y: number): string =>
  L(x, y, x, y + 0.85) + L(x - 0.6, y + 0.85, x + 0.6, y + 0.85) + L(x - 0.6, y + 1.15, x + 0.6, y + 1.15) + L(x, y + 1.15, x, y + 2);
export const GND = (x: number, y: number): string =>
  L(x, y, x, y + 0.4) + L(x - 0.6, y + 0.4, x + 0.6, y + 0.4) + L(x - 0.38, y + 0.7, x + 0.38, y + 0.7) + L(x - 0.16, y + 1, x + 0.16, y + 1);
export const DOT = (x: number, y: number): string => `<circle class="pd" cx="${n(x)}" cy="${n(y)}" r=".17"/>`;
/** A sine wave: from (x, y) across w cells, amplitude a, `cycles` of it. */
export function SINE(x: number, y: number, w: number, a: number, cycles: number, c = ''): string {
  const steps = Math.max(24, Math.round(cycles * 24));
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) pts.push(`${n(x + (w * i) / steps)} ${n(y - a * Math.sin((2 * Math.PI * cycles * i) / steps))}`);
  return P('M' + pts.join('L'), c);
}
/** A sampled wave from f(t), t from 0 to 1. */
export function WAVE(x: number, y: number, w: number, f: (t: number) => number, c = ''): string {
  const pts: string[] = [];
  for (let i = 0; i <= 160; i++) pts.push(`${n(x + (w * i) / 160)} ${n(y - f(i / 160))}`);
  return P('M' + pts.join('L'), c);
}

/** Sparky 3000, the robot dog, as a margin doodle: snout, perked ears, wagging antenna tail with a red light. */
export function sparky(x: number, y: number, s = 1): string {
  return (
    `<g transform="translate(${n(x)} ${n(y)}) scale(${s})">` +
    P('M0 0h3.2v2.4h-3.2z') + // head
    P('M.2 0L.4-1.1L1.1 0') +
    P('M2.1 0L2.8-1.1L3 0') + // ears
    P('M3.2 1.1h1v1.1h-1') + // snout
    `<circle class="pn" cx="1" cy="1" r=".28"/><circle class="pn" cx="2.2" cy="1" r=".28"/><circle class="pd" cx="1.05" cy="1.02" r=".1"/><circle class="pd" cx="2.25" cy="1.02" r=".1"/>` +
    P('M0 2.4v1.4M3.2 2.4v1.4M0 3.8h3.2') + // body hint
    P('M-.1 1.2q-1-.1-1.4-1.1') +
    `<circle class="pn cr" cx="-1.5" cy="0" r=".28" style="fill:#c0392b"/>` + // antenna tail with a red light
    P('M3.3 1.8q.5.4 1 0', 'cr') + // tongue
    '</g>'
  );
}

/** The Moon, doodled: a circle with craters, and a little flag. */
export function moon(x: number, y: number, r = 1.4): string {
  return (
    `<circle class="pn" cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>` +
    `<circle class="pn" cx="${n(x - r * 0.3)}" cy="${n(y - r * 0.25)}" r="${n(r * 0.28)}"/>` +
    `<circle class="pn" cx="${n(x + r * 0.35)}" cy="${n(y + r * 0.3)}" r="${n(r * 0.2)}"/>` +
    `<circle class="pn" cx="${n(x + r * 0.45)}" cy="${n(y - r * 0.45)}" r="${n(r * 0.12)}"/>` +
    L(x - r * 0.1, y - r, x - r * 0.1, y - r - 0.9) +
    P(`M${n(x - r * 0.1)} ${n(y - r - 0.9)}l.7.25l-.7.25`, 'cr')
  );
}

/** A 7-segment digit, traced on the grid: (x, y) is its top-left, 3 cells wide and 5 tall. `on` lists the lit segments. */
export function SEG7(x: number, y: number, on: string, c = 'cr'): string {
  const seg: Record<string, [number, number, number, number]> = {
    a: [0.5, 0, 2.5, 0],
    b: [3, 0.5, 3, 2.25],
    c: [3, 2.75, 3, 4.5],
    d: [0.5, 5, 2.5, 5],
    e: [0, 2.75, 0, 4.5],
    f: [0, 0.5, 0, 2.25],
    g: [0.5, 2.5, 2.5, 2.5],
  };
  let out = '';
  for (const k of 'abcdefg') {
    const [a, b, cc, d] = seg[k];
    out += L(x + a, y + b, x + cc, y + d, on.includes(k) ? c + ' th' : 'faint');
  }
  return out + (on.includes('p') ? `<circle class="pd cr" cx="${n(x + 3.5)}" cy="${n(y + 5)}" r=".22"/>` : '');
}
