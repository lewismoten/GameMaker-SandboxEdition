// Pictures for the Library's room (libraryRoom.ts), drawn here as SVG: the aisle of stacks in
// one-point perspective, and the small object icons (card catalog, copier, notebook, trash can,
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

/** One wall of stacks as books in perspective; `flip` mirrors it for the right-hand wall. */
function wall(flip: boolean, seed: number): string {
  const rand = rng(seed);
  const levels = 5;
  const out: string[] = [];
  const x = (t: number) => (flip ? 1000 - t * 400 : t * 400); // t 0 = near the viewer, 1 = far end
  const top = (t: number) => 0 + 62 * t;
  const bottom = (t: number) => 240 - 92 * t;
  out.push(`<polygon points="${x(0)},${top(0)} ${x(1)},${top(1)} ${x(1)},${bottom(1)} ${x(0)},${bottom(0)}" fill="var(--wood-back)"/>`);
  for (let j = 0; j < levels; j++) {
    const at = (t: number, k: number) => top(t) + ((bottom(t) - top(t)) * k) / levels;
    let t = 0.01;
    while (t < 0.985) {
      const w = 0.012 + rand() * 0.02;
      const t2 = Math.min(0.99, t + w);
      const h = 0.62 + rand() * 0.3;
      const base = at(t, j + 1) - 3 * (1 - t);
      const base2 = at(t2, j + 1) - 3 * (1 - t2);
      const rise = (at(t, j + 1) - at(t, j)) * h;
      const rise2 = (at(t2, j + 1) - at(t2, j)) * h;
      const c = SPINES[Math.floor(rand() * SPINES.length)];
      out.push(
        `<polygon points="${x(t)},${base - rise} ${x(t2)},${base2 - rise2} ${x(t2)},${base2} ${x(t)},${base}" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>`,
      );
      t = t2 + (rand() < 0.12 ? 0.02 : 0.002);
    }
    // the board under this level
    out.push(
      `<polygon points="${x(0)},${at(0, j + 1)} ${x(1)},${at(1, j + 1)} ${x(1)},${at(1, j + 1) + 2} ${x(0)},${at(0, j + 1) + 7}" fill="var(--wood)" stroke="var(--wood-dark)" stroke-width=".8"/>`,
    );
  }
  // the end panel nearest the viewer
  out.push(`<rect x="${flip ? 980 : 0}" y="0" width="20" height="240" fill="var(--wood-lo)"/>`);
  return out.join('');
}

/** The aisle: ceiling, back wall, floor with a runner and a stack of books at each side. */
export function aisle(): SVGSVGElement {
  const lights = [0.2, 0.45, 0.68, 0.85]
    .map((t) => {
      const y = 62 * t * 0.35 + 4 * (1 - t);
      const w = 120 * (1 - t) + 30;
      return `<rect x="${500 - w / 2}" y="${y * 0.5}" width="${w}" height="${4 * (1 - t) + 1.5}" fill="#fff6c9" opacity=".85"/>`;
    })
    .join('');
  return svgOf(
    `<svg viewBox="0 0 1000 240" preserveAspectRatio="none" class="lib-room-bg">` +
      `<rect width="1000" height="240" fill="var(--room-wall)"/>` +
      `<polygon points="0,0 1000,0 600,62 400,62" fill="var(--room-ceiling)"/>` +
      lights +
      `<polygon points="0,240 400,148 600,148 1000,240" fill="var(--room-floor)"/>` +
      `<polygon points="250,240 440,148 560,148 750,240" fill="var(--room-runner)"/>` +
      wall(false, 7) +
      wall(true, 19) +
      `<rect x="400" y="62" width="200" height="86" fill="var(--room-back)"/>` +
      `<rect x="458" y="76" width="84" height="46" fill="var(--room-window)" stroke="var(--wood-dark)" stroke-width="3"/>` +
      `<path d="M500 76v46M458 99h84" stroke="var(--wood-dark)" stroke-width="2"/>` +
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
