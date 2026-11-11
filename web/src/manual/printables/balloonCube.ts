// The paper balloon cube (the wrong-number die): a first page to watch it fold, then two letter sheets: the square to cut out, with its
// pre-creases (mountain dash-dot, valley dashed) and each face's art on the part of the paper that ends up as that face, and the fold
// steps as pictures. The fold is the traditional paper balloon (the waterbomb), worked out in balloonCubeModel.ts; the art is drawn
// once (balloonCubeArt.ts) and placed on the sheet by the frames that model gives each face region.
import './balloonCube.css';
import { h } from '../../editor/core/ui';
import { html, sheet, type Sheet } from './kit';
import { INK, RED, faceArt } from './balloonCubeArt';
import { L, PLACEMENTS, PRECREASES, TUCKS, type Frame2, type V2 } from './balloonCubeModel';
import { sceneSvg, type SceneSize } from './balloonCubeScene';
import type { BalloonCubeItem } from './balloonCubeTypes';

const SHEET = 600; // the sheet in svg units
const px = (p: V2): V2 => [SHEET / 2 + p[0] * SHEET, SHEET / 2 - p[1] * SHEET];
const pts = (poly: V2[]) =>
  poly
    .map((p) =>
      px(p)
        .map((v) => +v.toFixed(2))
        .join(','),
    )
    .join(' ');

/** The svg matrix that puts the 100-unit art on a sheet frame (art 100 = one cube edge). */
function sheetMatrix(fr: Frame2): string {
  const k = (L / 100) * SHEET;
  const [ox, oy] = px(fr.o);
  return `matrix(${(k * fr.right[0]).toFixed(5)} ${(-k * fr.right[1]).toFixed(5)} ${(-k * fr.up[0]).toFixed(5)} ${(k * fr.up[1]).toFixed(5)} ${ox.toFixed(3)} ${oy.toFixed(3)})`;
}

const dash = { mountain: '14 5 3 5', valley: '8 6' };
const TUCK_DASH = '6 4';

/** The square to cut out: the face regions with their art, the four tucks (plain: they end up hidden), the pre-creases, the cut line. */
function sheetSvg(it: BalloonCubeItem): string {
  const clips = PLACEMENTS.map((p, i) => `<clipPath id="bc${i}"><polygon points="${pts(p.clip)}"/></clipPath>`).join('');
  const faces = PLACEMENTS.map(
    (p, i) => `<g clip-path="url(#bc${i})"><g transform="${sheetMatrix(p.sheet)}">${faceArt(it.faces[p.face], p.face === 'top')}</g></g>`,
  ).join('');
  const tucks = TUCKS.map((t) => {
    // the word along the long edge, upright, beside the diagonal crease that runs through the corner
    const [k, e1, e2] = t;
    const m: V2 = [k[0] * 0.45 + ((e1[0] + e2[0]) / 2) * 0.55, k[1] * 0.45 + ((e1[1] + e2[1]) / 2) * 0.55];
    const along = Math.hypot(e1[0] - e2[0], e1[1] - e2[1]);
    const c = px([m[0] + ((e1[0] - e2[0]) / along) * 0.05, m[1] + ((e1[1] - e2[1]) / along) * 0.05]);
    let turn = (Math.atan2(-(e1[1] - e2[1]), e1[0] - e2[0]) * 180) / Math.PI;
    if (turn > 90) turn -= 180;
    if (turn <= -90) turn += 180;
    return (
      `<polygon points="${pts(t)}" fill="none" stroke="#8b857b" stroke-width="1.6" stroke-dasharray="${TUCK_DASH}"/>` +
      `<text transform="translate(${c[0].toFixed(1)},${c[1].toFixed(1)}) rotate(${turn})" dy="4" font-size="13" font-weight="700" text-anchor="middle" fill="#8b857b" font-family="Arial,sans-serif">TUCK</text>`
    );
  }).join('');
  const lines = PRECREASES.map(
    (c) =>
      `<line x1="${px(c.a)[0]}" y1="${px(c.a)[1]}" x2="${px(c.b)[0]}" y2="${px(c.b)[1]}" stroke="${c.kind === 'mountain' ? INK : RED}" stroke-width="2.4" stroke-dasharray="${dash[c.kind]}"/>`,
  ).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 ${SHEET + 24} ${SHEET + 24}" role="img" aria-label="The square sheet with its fold lines and the six faces' art">` +
    `<defs>${clips}</defs><rect x="0" y="0" width="${SHEET}" height="${SHEET}" fill="#fff"/>${faces}${tucks}${lines}` +
    `<rect x="0" y="0" width="${SHEET}" height="${SHEET}" fill="none" stroke="#000" stroke-width="3"/></svg>`
  );
}

const legend = (): HTMLElement =>
  html(
    'div',
    'bc-legend',
    `<span><svg viewBox="0 0 80 8"><line x1="0" y1="4" x2="80" y2="4" stroke="${INK}" stroke-width="2.6" stroke-dasharray="${dash.mountain}"/></svg>mountain fold: crease it away from you</span>` +
      `<span><svg viewBox="0 0 80 8"><line x1="0" y1="4" x2="80" y2="4" stroke="${RED}" stroke-width="2.6" stroke-dasharray="${dash.valley}"/></svg>valley fold: crease it toward you</span>` +
      `<span><svg viewBox="0 0 80 8"><line x1="0" y1="4" x2="80" y2="4" stroke="#000" stroke-width="2.6"/></svg>cut line</span>` +
      `<span><svg viewBox="0 0 24 8"><rect x="1" y="1" width="22" height="6" fill="none" stroke="#8b857b" stroke-width="1.4" stroke-dasharray="4 2"/></svg>tucks into a pocket</span>`,
  );

/** The first thing on screen: the 3D fold animation (its own chunk, loaded when the item opens) with a labeled link to the printable sheets. */
async function watchSheet(it: BalloonCubeItem): Promise<Sheet> {
  const { foldViewer } = await import('./balloonCubeFoldView');
  const toPrint = h('button', { type: 'button', class: 'bc-live-open' }, 'Printable sheet to cut out');
  toPrint.addEventListener('click', () => {
    const next = toPrint.closest('.pp-paper')?.nextElementSibling;
    if (!(next instanceof HTMLElement)) return;
    next.setAttribute('tabindex', '-1');
    next.scrollIntoView({ block: 'start' });
    next.focus({ preventScroll: true });
  });
  return sheet(
    8.5,
    11,
    'ballooncube balloonwatch',
    h('h2', null, `${it.heading ?? it.title}: watch it fold`),
    h('p', { class: 'bc-intro' }, 'Step through the folds one at a time, or press Play. The printable square and the picture steps are on the next pages.'),
    h('div', { class: 'bc-live' }, foldViewer(it)),
    h('div', { class: 'bc-live' }, toPrint),
  );
}

/** The fold steps as printed pictures: the moment drawn, how to draw it (arrows for the next step's folds, the pocket close-up, the art), the words. */
const PRINTED_STEPS: [number, Partial<SceneSize>, string][] = [
  [0, {}, 'Cut out the square along its solid edge.'],
  [1, {}, 'Printing up, fold each diagonal away from you (dash-dot, mountain) and the middle line toward you (red dashes, valley). Crease hard and open flat.'],
  [2, {}, 'Push the middles of the left and right edges in. The top half folds down behind and the square collapses into a triangle.'],
  [2, { arrows: 3 }, 'Fold the bottom corners of the front flaps up to the top point. The front becomes a diamond.'],
  [3, { arrows: 4 }, 'Fold the diamond’s left and right points in to the center line.'],
  [
    5,
    { arrows: 6, focus: 1 },
    'Fold the two small top flaps down (outlined), then slide each one into the pocket along the top edge of the side triangle next to it. This tuck is the lock.',
  ],
  [10, {}, 'Turn it over and do the same on the back: corners up, points in, flaps down and tucked.'],
  [11, { art: true }, 'Blow hard into the small hole at the bottom point and press out the corners. The face with the hole is the 0.'],
];

/** The balloon cube's sheets: watch it fold, the square to cut out, then the steps. */
export async function balloonCubeSheets(it: BalloonCubeItem): Promise<Sheet[]> {
  const step = (n: number, text: string, svg: string): HTMLElement =>
    h('li', { class: 'bc-step' }, html('div', 'bc-pic', svg), h('p', null, h('b', null, `${n}. `), text));
  const side = Math.round(L * 7.5 * 100) / 100;
  return [
    await watchSheet(it),
    sheet(
      8.5,
      11,
      'ballooncube',
      h('h2', null, it.heading ?? it.title),
      it.intro ? h('p', { class: 'bc-intro' }, it.intro) : null,
      legend(),
      html('div', 'bc-sheet', sheetSvg(it)),
      h(
        'p',
        { class: 'bc-foot' },
        `Print at full size (no scaling). The square is 7.5 inches; the cube comes out about ${side} inches on a side. Thin paper is easiest to blow up.`,
      ),
    ),
    sheet(
      8.5,
      11,
      'ballooncube',
      h('h2', null, 'How to fold it'),
      h(
        'ol',
        { class: 'bc-steps' },
        ...PRINTED_STEPS.map(([pos, o, text], i) => step(i + 1, text, sceneSvg(o.art ? it : null, pos, `bcp${i}`, { w: 300, h: 250, art: false, ...o }, text))),
      ),
      it.foot ? h('p', { class: 'bc-foot' }, it.foot) : null,
    ),
  ];
}
