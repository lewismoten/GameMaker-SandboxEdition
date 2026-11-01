// Pictures for the Library's room (libraryRoom.ts), drawn here as SVG: the octagonal room in
// perspective, and the small object icons (card catalog, copier, notebook, trash can,
// stacks). Plain drawings made for this site; the fills use the Library's wood and brass colors.

const NS = 'http://www.w3.org/2000/svg';
const SPINES = ['#8c2f2a', '#2f5d8c', '#3f7a4a', '#c8a23a', '#6a4a8c', '#b5632c', '#2b6f6f', '#a33d5f', '#58606b'];

/** Parses a fixed piece of SVG markup into an element. */
export function svgOf(markup: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(markup.replace('<svg ', `<svg xmlns="${NS}" aria-hidden="true" focusable="false" `), 'image/svg+xml');
  return document.importNode(doc.documentElement, true) as unknown as SVGSVGElement;
}

/** Deterministic little number stream, so the books are the same every visit. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

type Pt = [number, number];
const mirror = (n: number, flip: boolean) => (flip ? 1000 - n : n);

/**
 * One wall of the octagon as a quad in perspective: it runs from x `xa` (top `ta`, bottom `ba`) to x `xb`
 * (`tb`, `bb`). Shelves of books fill it below `plain` (a fraction of its height kept bare for a window).
 * `flip` mirrors it onto the right-hand side. `shade` darkens the walls turned away from the lamp.
 */
function wall(
  flip: boolean,
  seed: number,
  [xa, ta, ba]: [number, number, number],
  [xb, tb, bb]: [number, number, number],
  levels: number,
  plain: number,
  shade: number,
): string {
  const rand = rng(seed);
  const X = (t: number) => mirror(xa + (xb - xa) * t, flip);
  const T = (t: number) => ta + (tb - ta) * t;
  const B = (t: number) => ba + (bb - ba) * t;
  const shelfTop = (t: number) => T(t) + (B(t) - T(t)) * plain;
  const at = (t: number, k: number) => shelfTop(t) + ((B(t) - shelfTop(t)) * k) / levels;
  const q = (pts: Pt[]) => pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  const out: string[] = [
    `<polygon points="${q([
      [X(0), T(0)],
      [X(1), T(1)],
      [X(1), B(1)],
      [X(0), B(0)],
    ])}" fill="var(--room-wall-wood)"/>`,
  ];
  out.push(
    `<polygon points="${q([
      [X(0), shelfTop(0)],
      [X(1), shelfTop(1)],
      [X(1), B(1)],
      [X(0), B(0)],
    ])}" fill="var(--room-shelf-back)"/>`,
  );
  const span = Math.abs(xb - xa);
  for (let j = 0; j < levels; j++) {
    let t = 0.01;
    while (t < 0.985) {
      const t2 = Math.min(0.99, t + (3.5 + rand() * 5) / span);
      const h = 0.6 + rand() * 0.32;
      const base = (u: number) => at(u, j + 1) - 1.5;
      const rise = (u: number) => (at(u, j + 1) - at(u, j)) * h;
      const c = SPINES[Math.floor(rand() * SPINES.length)];
      out.push(
        `<polygon points="${q([
          [X(t), base(t) - rise(t)],
          [X(t2), base(t2) - rise(t2)],
          [X(t2), base(t2)],
          [X(t), base(t)],
        ])}" fill="${c}" stroke="rgba(0,0,0,.4)" stroke-width=".5"/>`,
      );
      t = t2 + (rand() < 0.1 ? 0.03 : 0.003);
    }
    out.push(
      `<polygon points="${q([
        [X(0), at(0, j + 1) - 1],
        [X(1), at(1, j + 1) - 1],
        [X(1), at(1, j + 1) + 2],
        [X(0), at(0, j + 1) + 4],
      ])}" fill="var(--room-board)" stroke="rgba(0,0,0,.5)" stroke-width=".6"/>`,
    );
  }
  out.push(
    `<polygon points="${q([
      [X(0), T(0)],
      [X(1), T(1)],
      [X(1), B(1)],
      [X(0), B(0)],
    ])}" fill="#000" opacity="${shade}"/>`,
  );
  return out.join('');
}

/** The small high window on the right-hand wall, with a slice of daylight falling from it. */
function windowAndDaylight(): string {
  // right-hand mid wall runs x 610 to 785; the window is in its bare strip below the ceiling
  const x0 = 650;
  const x1 = 730;
  const top = (x: number) => 74 - ((x - 610) / 175) * 30;
  const bot = (x: number) => top(x) + 20 - ((x - 610) / 175) * 4;
  const pane = `${x0},${top(x0) + 4} ${x1},${top(x1) + 4} ${x1},${bot(x1)} ${x0},${bot(x0)}`;
  const beam = `${x0},${bot(x0)} ${x1},${bot(x1)} ${x1 - 150},232 ${x0 - 170},232`;
  return (
    `<polygon points="${beam}" fill="url(#lr-day)"/>` +
    `<polygon points="${pane}" fill="#cfe3e8" stroke="#2c1d10" stroke-width="3"/>` +
    `<path d="M${(x0 + x1) / 2} ${(top(x0) + top(x1)) / 2 + 4}V${(bot(x0) + bot(x1)) / 2}" stroke="#2c1d10" stroke-width="2"/>`
  );
}

/** The ceiling: planks, beams converging on a ring around the lamp fixture. */
function ceiling(): string {
  const tops: Pt[] = [
    [40, 14],
    [215, 44],
    [390, 74],
    [610, 74],
    [785, 44],
    [960, 14],
  ];
  const hub: Pt = [500, 24];
  const ring = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((i) => `${(hub[0] + Math.cos((i * Math.PI) / 4) * 70).toFixed(1)},${(hub[1] + Math.sin((i * Math.PI) / 4) * 11).toFixed(1)}`)
    .join(' ');
  const planks = [0.2, 0.4, 0.6, 0.8].map((k) => `<path d="M0 ${(k * 70).toFixed(0)}H1000" stroke="rgba(0,0,0,.22)" stroke-width="1"/>`).join('');
  return (
    `<polygon points="0,0 1000,0 960,14 785,44 610,74 390,74 215,44 40,14" fill="var(--room-ceiling)"/>` +
    planks +
    tops.map(([x, y]) => `<path d="M${hub[0]} ${hub[1]}L${x} ${y}" stroke="var(--room-beam)" stroke-width="7" stroke-linecap="round"/>`).join('') +
    `<path d="M${hub[0]} ${hub[1]}L0 2M${hub[0]} ${hub[1]}L1000 2" stroke="var(--room-beam)" stroke-width="7"/>` +
    `<polygon points="${ring}" fill="none" stroke="var(--room-beam)" stroke-width="6" stroke-linejoin="round"/>` +
    // the ceiling fixture: a brass dome with a glowing lamp under it
    `<ellipse cx="500" cy="26" rx="150" ry="40" fill="url(#lr-lamp)"/>` +
    `<path d="M480 22q20-14 40 0z" fill="#6b4a1c" stroke="#2c1d10" stroke-width="1.5"/>` +
    `<ellipse cx="500" cy="24" rx="14" ry="4" fill="#ffe7a8"/>`
  );
}

/** The octagon: five walls of stacks seen from just inside the door, a beamed ceiling and a dim, warm light. */
export function aisle(): SVGSVGElement {
  const rug = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((i) => `${(500 + Math.cos((i * Math.PI) / 4 + Math.PI / 8) * 230).toFixed(1)},${(198 + Math.sin((i * Math.PI) / 4 + Math.PI / 8) * 30).toFixed(1)}`)
    .join(' ');
  return svgOf(
    `<svg viewBox="0 0 1000 240" preserveAspectRatio="none" class="lib-room-bg">` +
      `<defs>` +
      `<radialGradient id="lr-lamp" gradientUnits="userSpaceOnUse" cx="500" cy="26" r="150"><stop offset="0" stop-color="#ffd98a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="lr-pool" gradientUnits="userSpaceOnUse" cx="500" cy="168" r="190" gradientTransform="translate(0 168) scale(1 .55) translate(0 -168)"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".7"/><stop offset=".6" stop-color="#ffb85a" stop-opacity=".25"/><stop offset="1" stop-color="#ffb85a" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="lr-dim" gradientUnits="userSpaceOnUse" cx="500" cy="150" r="600" gradientTransform="translate(0 150) scale(1 .5) translate(0 -150)"><stop offset=".25" stop-color="#0c0602" stop-opacity="0"/><stop offset=".7" stop-color="#0c0602" stop-opacity=".45"/><stop offset="1" stop-color="#0c0602" stop-opacity=".85"/></radialGradient>` +
      `<linearGradient id="lr-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c0" stop-opacity=".4"/><stop offset="1" stop-color="#fff0c0" stop-opacity=".05"/></linearGradient>` +
      `</defs>` +
      `<rect width="1000" height="240" fill="var(--room-floor)"/>` +
      `<polygon points="${rug}" fill="var(--room-runner)" stroke="rgba(0,0,0,.4)" stroke-width="2"/>` +
      // far wall, the two walls beside it, and the two nearest the door
      wall(false, 7, [40, 14, 228], [215, 44, 196], 5, 0.12, 0.38) +
      wall(true, 19, [40, 14, 228], [215, 44, 196], 5, 0.12, 0.38) +
      wall(false, 31, [215, 44, 196], [390, 74, 168], 4, 0.25, 0.16) +
      wall(true, 43, [215, 44, 196], [390, 74, 168], 4, 0.25, 0.16) +
      wall(false, 55, [390, 74, 168], [610, 74, 168], 4, 0.2, 0) +
      ceiling() +
      windowAndDaylight() +
      // the door jambs at the near edges
      `<rect x="0" y="0" width="40" height="240" fill="#120a04"/><rect x="960" y="0" width="40" height="240" fill="#120a04"/>` +
      `<ellipse cx="500" cy="176" rx="230" ry="46" fill="url(#lr-pool)"/>` +
      `<rect width="1000" height="240" fill="url(#lr-dim)" style="opacity:var(--room-dim)"/>` +
      `</svg>`,
  );
}

const STROKE = 'stroke="var(--wood-dark)" stroke-width="2" stroke-linejoin="round"';

/** The icon for each object in the room, a viewBox of 80 x 80 (the card catalog is taller than wide). */
export const ICONS = {
  stacks: `<svg viewBox="0 0 80 80"><rect x="6" y="6" width="68" height="68" rx="3" fill="var(--wood)" ${STROKE}/>${[0, 1, 2]
    .map(
      (r) =>
        `<rect x="10" y="${10 + r * 21}" width="60" height="18" fill="var(--wood-back)"/>` +
        [0, 1, 2, 3, 4, 5, 6]
          .map((i) => `<rect x="${12 + i * 8}" y="${14 + r * 21 + (i % 3)}" width="6" height="${14 - (i % 3)}" fill="${SPINES[(i + r * 3) % SPINES.length]}"/>`)
          .join(''),
    )
    .join('')}</svg>`,
  catalog: `<svg viewBox="0 0 80 80"><rect x="8" y="6" width="64" height="70" rx="3" fill="var(--wood)" ${STROKE}/>${[0, 1, 2]
    .flatMap((r) =>
      [0, 1].map(
        (c) =>
          `<rect x="${13 + c * 29}" y="${11 + r * 21}" width="25" height="17" rx="1.5" fill="var(--wood-hi)" ${STROKE}/><rect x="${18 + c * 29}" y="${14 + r * 21}" width="15" height="6" fill="var(--paper)"/><rect x="${22 + c * 29}" y="${23 + r * 21}" width="7" height="2.5" rx="1" fill="var(--brass)"/>`,
      ),
    )
    .join('')}</svg>`,
  copier: `<svg viewBox="0 0 80 80"><rect x="6" y="22" width="68" height="50" rx="4" fill="#d8ceb2" ${STROKE}/><rect x="6" y="22" width="68" height="10" rx="3" fill="#b9ad8c" ${STROKE}/><rect x="14" y="36" width="30" height="8" fill="#31413a"/><rect x="14" y="36" width="12" height="8" fill="#6fd08a"/><rect x="50" y="36" width="18" height="12" rx="2" fill="#2f6f45" ${STROKE}/><rect x="16" y="56" width="48" height="10" rx="1" fill="#8d8363" ${STROKE}/><rect x="22" y="48" width="36" height="12" fill="#fff" ${STROKE}/><path d="M12 22 L24 8 H58 L68 22Z" fill="#c9bfa0" ${STROKE}/></svg>`,
  notebook: `<svg viewBox="0 0 80 80"><rect x="14" y="6" width="52" height="68" rx="3" fill="#25252b" ${STROKE}/><rect x="14" y="6" width="9" height="68" rx="3" fill="#111" /><rect x="28" y="16" width="32" height="26" fill="#f4f1e6" stroke="#25252b" stroke-width="1.5"/><path d="M32 24h24M32 30h24M32 36h16" stroke="#6b6b73" stroke-width="2"/><path d="M26 56h36" stroke="#f4f1e6" stroke-width="2" opacity=".5"/></svg>`,
} as const;

/** The trash can, with crumpled reviews sticking out of it when it has any. */
export const trashIcon = (full: boolean) =>
  `<svg viewBox="0 0 80 80"><path d="M22 28 L26 72 H54 L58 28Z" fill="#8f98a3" ${STROKE}/><path d="M32 34v32M40 34v32M48 34v32" stroke="#69727d" stroke-width="2"/>${full ? '<g fill="#f6edd2" stroke="#4d2f16" stroke-width="1.5" stroke-linejoin="round"><path d="M26 28 L30 10 L42 14 L38 28Z"/><path d="M40 28 L44 8 L56 14 L52 28Z"/><path d="M33 28 L38 14 L48 18 L44 28Z" fill="#fffaf0"/></g><path d="M32 16l7 2M46 14l6 2" stroke="#9b8d6d" stroke-width="1.5"/>' : ''}<path d="M16 28h48" stroke="var(--wood-dark)" stroke-width="5" stroke-linecap="round"/></svg>`;
