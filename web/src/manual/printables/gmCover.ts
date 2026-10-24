// The front cover of the Game-Maker SE Owner's Guide: a blueprint (white grid and drafting
// lines on blue: a block drawn pixel by pixel, a joystick, a diskette)
// with the title, a red technical support sticker, and the bottom of the sheet peeled back
// to show a real game screen underneath, one of the Sandbox games made with Game-Maker.
// One SVG on a 550 x 850 sheet (5.5 x 8.5 inches), so it scales with the page and prints; it
// is shown as an image so its ids stay its own when the page is copied for print.
import './paper.css'; // first: this piece's own styles build on the paper's
import './gmCover.css';

export const COVER_W = 550;
export const COVER_H = 850;

type Pt = [number, number];

/**
 * The peeled-back bottom: the fold runs from `a` (left edge) to `b` (right edge); what was
 * under it turns over and curls back up, `curl` of the way (1 = folded flat).
 * Returns the sheet still lying flat and the turned-over flap, as polygons.
 */
export function peel(a: Pt, b: Pt, curl: number): { sheet: Pt[]; flap: Pt[] } {
  const [ux, uy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(ux, uy);
  const u: Pt = [ux / len, uy / len];
  const turn = (p: Pt): Pt => {
    const d = (p[0] - a[0]) * u[0] + (p[1] - a[1]) * u[1];
    const f: Pt = [a[0] + d * u[0], a[1] + d * u[1]];
    const mirror: Pt = [2 * f[0] - p[0], 2 * f[1] - p[1]];
    return [f[0] + curl * (mirror[0] - f[0]), f[1] + curl * (mirror[1] - f[1])];
  };
  const r = (p: Pt): Pt => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
  return {
    sheet: ([[0, 0], [COVER_W, 0], b, a] as Pt[]).map(r),
    flap: [a, b, turn([COVER_W, COVER_H]), turn([0, COVER_H])].map(r),
  };
}

/** The SVG's own styles (it is shown as an image, so it carries them). */
const STYLE = `
.gmc-game {
  image-rendering: pixelated;
}

.gmc-minor {
  fill: none;
  stroke: rgba(255, 255, 255, 0.13);
  stroke-width: 0.6;
}

.gmc-major {
  fill: none;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1;
}

.gmc-border {
  fill: none;
  stroke: rgba(255, 255, 255, 0.75);
  stroke-width: 1.5;
}

.gmc-ink {
  fill: none;
  stroke: rgba(255, 255, 255, 0.7);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.gmc-faint {
  stroke: rgba(255, 255, 255, 0.38);
}

.gmc-thin {
  stroke-width: 0.8;
}

.gmc-fill {
  fill: rgba(255, 255, 255, 0.45);
  stroke: none;
}

.gmc-dim {
  stroke-width: 0.9;
}

text {
  stroke: none;
  fill: #fff;
  font-family: Helvetica, Arial, sans-serif;
}

.gmc-label {
  font-size: 9px;
  letter-spacing: 0.08em;
  fill: rgba(255, 255, 255, 0.85);
}

.gmc-hand {
  font: italic 15px 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive;
  fill: rgba(255, 255, 255, 0.78);
}

.gmc-kicker {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.32em;
}

.gmc-title {
  font: 900 172px/1 Impact, Haettenschweiler, 'Arial Narrow Bold', 'Arial Black', sans-serif;
  fill: url(#gmc-chrome);
  stroke: #0c2550;
  stroke-width: 3;
  paint-order: stroke;
  filter: drop-shadow(4px 6px 0 rgba(6, 20, 50, 0.55));
}

.gmc-se-ring {
  fill: #fff;
  stroke: #0c2550;
  stroke-width: 3;
}

.gmc-se {
  font: 900 46px/1 Impact, 'Arial Black', sans-serif;
  fill: #1f4f9a;
}

.gmc-edition {
  font: italic 700 38px/1 Georgia, 'Times New Roman', serif;
}

.gmc-version {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.gmc-rule {
  stroke: #fff;
  stroke-width: 2;
}

.gmc-block {
  fill: none;
  stroke: rgba(255, 255, 255, 0.8);
  stroke-width: 1;
}

.gmc-block text {
  font-size: 10px;
  letter-spacing: 0.06em;
}

.gmc-fork {
  font: italic 12.5px Georgia, 'Times New Roman', serif;
  fill: rgba(255, 255, 255, 0.92);
}

.gmc-owner {
  font: 900 30px/1 'Arial Black', Arial, sans-serif;
  letter-spacing: 0.08em;
  stroke: #000;
  stroke-width: 5;
  paint-order: stroke;
}

.gmc-sticker .gmc-st-arc {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.gmc-sticker .gmc-st-num {
  font-size: 13px;
  font-weight: 800;
}

.gmc-sticker .gmc-st-small {
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
`;

const pts = (p: Pt[]) => p.map(([x, y]) => `${x},${y}`).join(' ');

/** A dimension line with arrowheads and a label in the middle. */
function dim(x1: number, y1: number, x2: number, y2: number, label: string, side = -6): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const vertical = x1 === x2;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-start="url(#gmc-arrow)" marker-end="url(#gmc-arrow)"/>
    <text class="gmc-label" x="${vertical ? mx + side : mx}" y="${vertical ? my : my + side}" ${vertical ? `transform="rotate(-90 ${mx + side} ${my})"` : ''} text-anchor="middle">${label}</text>`;
}

/** A hero drawn in a 10 x 10 grid, as in the Block Designer (1 = a filled pixel). */
const HERO = ['0001111000', '0011111100', '0011010100', '0001111000', '0000110000', '0111111110', '1001111001', '0001111000', '0011001100', '0110000110'];

function blockDrawing(x: number, y: number, cell: number): string {
  const n = HERO.length;
  const lines: string[] = [];
  for (let i = 0; i <= n; i++) {
    lines.push(`<line x1="${x}" y1="${y + i * cell}" x2="${x + n * cell}" y2="${y + i * cell}"/>`);
    lines.push(`<line x1="${x + i * cell}" y1="${y}" x2="${x + i * cell}" y2="${y + n * cell}"/>`);
  }
  const fill = HERO.flatMap((row, r) =>
    [...row].flatMap((c, k) => (c === '1' ? [`<rect x="${x + k * cell}" y="${y + r * cell}" width="${cell}" height="${cell}"/>`] : [])),
  );
  return `<g class="gmc-thin">${lines.join('')}</g><g class="gmc-fill">${fill.join('')}</g>
    <g class="gmc-dim">${dim(x, y - 12, x + n * cell, y - 12, '20 PIXELS')}${dim(x - 12, y, x - 12, y + n * cell, '20 PIXELS')}</g>`;
}

function drawings(): string {
  return `
  <g class="gmc-ink">
    <!-- a picture block, pixel by pixel -->
    ${blockDrawing(212, 512, 10)}
    <text class="gmc-hand" x="208" y="632">hero.cbl, block 0</text>
    <!-- a joystick -->
    <g transform="translate(440 548) scale(.8)">
      <rect x="-62" y="10" width="124" height="44" rx="10"/>
      <ellipse cx="0" cy="10" rx="30" ry="8"/>
      <line x1="0" y1="10" x2="10" y2="-62"/>
      <circle cx="11" cy="-72" r="13"/>
      <circle cx="-42" cy="26" r="8"/><circle cx="-42" cy="26" r="3"/>
      <line x1="-42" y1="18" x2="-90" y2="-24"/>
      <text class="gmc-label" x="-92" y="-30" text-anchor="middle">FIRE 1</text>
      <path d="M 40 -40 A 46 46 0 0 0 -30 -42" stroke-dasharray="4 4" marker-end="url(#gmc-arrow)"/>
      <text class="gmc-label" x="58" y="-46">8 WAYS</text>
    </g>
    <!-- a 3.5 inch diskette, behind the title -->
    <g transform="translate(372 96) rotate(9)" class="gmc-faint">
      <rect x="0" y="0" width="140" height="146" rx="5"/>
      <rect x="34" y="0" width="74" height="44"/>
      <rect x="80" y="8" width="18" height="30"/>
      <rect x="20" y="70" width="100" height="70"/>
      <line x1="30" y1="86" x2="110" y2="86"/><line x1="30" y1="102" x2="110" y2="102"/>
    </g>
    <!-- a protractor arc and center mark -->
    <g class="gmc-faint">
      <circle cx="120" cy="300" r="96"/>
      <circle cx="120" cy="300" r="70" stroke-dasharray="2 6"/>
      <line x1="10" y1="300" x2="230" y2="300"/><line x1="120" y1="190" x2="120" y2="410"/>
    </g>
    <text class="gmc-hand" x="330" y="618" transform="rotate(-8 330 618)">jump = 3 blocks?</text>
    <text class="gmc-hand" x="36" y="500" transform="rotate(-3 36 500)">320 x 200, 256 colors</text>
  </g>`;
}

/** The red sticker: technical support (a made-up number in the 555-01xx range). */
function sticker(cx: number, cy: number, r: number): string {
  const ar = r * 0.78;
  return `<g class="gmc-sticker" transform="rotate(-16 ${cx} ${cy})">
    <circle cx="${cx + 2}" cy="${cy + 3}" r="${r}" fill="rgba(0,0,0,.35)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gmc-red)"/>
    <path id="gmc-arc" d="M ${cx - ar} ${cy} A ${ar} ${ar} 0 0 1 ${cx + ar} ${cy}" fill="none"/>
    <text class="gmc-st-arc"><textPath href="#gmc-arc" startOffset="50%" text-anchor="middle">TECHNICAL SUPPORT</textPath></text>
    <text class="gmc-st-num" x="${cx}" y="${cy + r * 0.26}" text-anchor="middle">1-800-555-0176</text>
    <text class="gmc-st-small" x="${cx}" y="${cy + r * 0.5}" text-anchor="middle">9 AM–6 PM EASTERN</text>
    <text class="gmc-st-small" x="${cx}" y="${cy + r * 0.68}" text-anchor="middle">MONDAY–FRIDAY</text>
    <ellipse cx="${cx - r * 0.3}" cy="${cy - r * 0.5}" rx="${r * 0.42}" ry="${r * 0.16}" fill="rgba(255,255,255,.22)" transform="rotate(-24 ${cx - r * 0.3} ${cy - r * 0.5})"/>
  </g>`;
}

const COVER_ALT =
  'Owner’s Guide cover: GAME-MAKER, Sandbox Edition, Version 3.0, in white on a blue blueprint of a hero drawn pixel by pixel, a joystick, and a diskette. ' +
  'The bottom of the blueprint is peeled back to show a game made with Game-Maker. A red sticker reads Technical Support, 1-800-555-0176, 9 AM to 6 PM Eastern, Monday to Friday.';

/** The cover. `game` is a 320 x 200 game screen (a data URL) to show under the peeled corner. */
export function gmCover(game?: string, gameTitle?: string): HTMLImageElement {
  const { sheet, flap } = peel([0, 792], [COVER_W, 664], 0.3);
  const [a, b, c, d] = flap;
  // the flap's free edge bows a little, as rolled paper does
  const mid: Pt = [(c[0] + d[0]) / 2 - 6, (c[1] + d[1]) / 2 - 14];
  const flapPath = `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]} Q ${mid[0]} ${mid[1]} ${d[0]} ${d[1]} Z`;
  const gameH = (COVER_W * 200) / 320;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_W} ${COVER_H}" preserveAspectRatio="xMidYMid slice">
  <style>${STYLE}</style>
  <defs>
    <pattern id="gmc-grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 10 0 V 50 M 20 0 V 50 M 30 0 V 50 M 40 0 V 50 M 0 10 H 50 M 0 20 H 50 M 0 30 H 50 M 0 40 H 50" class="gmc-minor"/>
      <path d="M 0 0 V 50 M 0 0 H 50" class="gmc-major"/>
    </pattern>
    <radialGradient id="gmc-blue" cx="45%" cy="35%" r="80%">
      <stop offset="0" stop-color="#2f6cc0"/><stop offset=".6" stop-color="#1f4f9a"/><stop offset="1" stop-color="#143a76"/>
    </radialGradient>
    <linearGradient id="gmc-chrome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e4eefb"/><stop offset=".56" stop-color="#b9cde9"/><stop offset="1" stop-color="#f4f8ff"/>
    </linearGradient>
    <radialGradient id="gmc-red" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#ef3b33"/><stop offset="1" stop-color="#b3121a"/>
    </radialGradient>
    <linearGradient id="gmc-back" gradientUnits="userSpaceOnUse" x1="${(a[0] + b[0]) / 2}" y1="${(a[1] + b[1]) / 2}" x2="${(c[0] + d[0]) / 2}" y2="${(c[1] + d[1]) / 2}">
      <stop offset="0" stop-color="#8ea6c6"/><stop offset=".35" stop-color="#e9eff7"/><stop offset=".7" stop-color="#f7f9fc"/><stop offset="1" stop-color="#b8c8de"/>
    </linearGradient>
    <linearGradient id="gmc-shade" gradientUnits="userSpaceOnUse" x1="${(a[0] + b[0]) / 2}" y1="${(a[1] + b[1]) / 2}" x2="${(a[0] + b[0]) / 2 + 12}" y2="${(a[1] + b[1]) / 2 + 60}">
      <stop offset="0" stop-color="rgba(0,0,0,.55)"/><stop offset="1" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
    <marker id="gmc-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9 z" fill="#fff"/>
    </marker>
    <filter id="gmc-soft" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="-3" dy="-4" stdDeviation="5" flood-color="#000" flood-opacity=".45"/></filter>
    <clipPath id="gmc-sheet"><polygon points="${pts(sheet)}"/></clipPath>
  </defs>
  <!-- under the sheet: a game -->
  <rect width="${COVER_W}" height="${COVER_H}" fill="#000"/>
  ${game ? `<image href="${game}" x="0" y="${COVER_H - gameH}" width="${COVER_W}" height="${gameH}" preserveAspectRatio="none" class="gmc-game"/>` : ''}
  <polygon points="${pts([a, b, [COVER_W, COVER_H], [0, COVER_H]])}" fill="url(#gmc-shade)"/>
  <text class="gmc-owner" x="${COVER_W / 2}" y="${COVER_H - 22}" text-anchor="middle">OWNER’S GUIDE</text>
  <!-- the blueprint -->
  <g clip-path="url(#gmc-sheet)">
    <rect width="${COVER_W}" height="${COVER_H}" fill="url(#gmc-blue)"/>
    <rect width="${COVER_W}" height="${COVER_H}" fill="url(#gmc-grid)"/>
    <rect x="14" y="14" width="${COVER_W - 28}" height="${COVER_H - 28}" class="gmc-border"/>
    ${drawings()}
    <text class="gmc-kicker" x="32" y="52">DESIGN · DRAW · PLAY</text>
    <text class="gmc-title" x="32" y="222" textLength="486" lengthAdjust="spacingAndGlyphs">GAME</text>
    <text class="gmc-title" x="32" y="382" textLength="486" lengthAdjust="spacingAndGlyphs">MAKER</text>
    <text class="gmc-edition" x="32" y="434">Sandbox Edition</text>
    <g transform="rotate(-12 482 418)">
      <circle cx="482" cy="418" r="36" class="gmc-se-ring"/>
      <text class="gmc-se" x="482" y="433" text-anchor="middle">SE</text>
    </g>
    <line x1="32" y1="450" x2="430" y2="450" class="gmc-rule"/>
    <!-- the drawing's title block -->
    <g class="gmc-block" transform="translate(${COVER_W - 222} 26)">
      <rect width="196" height="40"/>
      <line x1="0" y1="20" x2="196" y2="20"/><line x1="112" y1="0" x2="112" y2="20"/>
      <text x="5" y="14">VERSION 3.0</text><text x="117" y="14">SHEET 1 OF 1</text>
      <text x="5" y="34">SCALE: 1 PIXEL = 1 PIXEL</text>
    </g>
    <text class="gmc-fork" x="32" y="472">A new guide for this fork of RSD Game-Maker, not the manual RSD shipped in 1994.</text>
    ${sticker(100, 636, 58)}
  </g>
  <!-- the peeled-back flap: the back of the sheet -->
  <path d="${flapPath}" fill="url(#gmc-back)" filter="url(#gmc-soft)"/>
  <path d="${flapPath}" fill="none" stroke="rgba(30,50,90,.35)" stroke-width="1"/>
</svg>`;
  const img = document.createElement('img');
  img.className = 'gmc';
  img.alt = gameTitle ? `${COVER_ALT} The game is ${gameTitle}.` : COVER_ALT;
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return img;
}
