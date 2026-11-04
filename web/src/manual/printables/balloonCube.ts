// The paper balloon cube: two letter sheets, the square to cut out with its fold lines (mountain dash-dot, valley dashed) and each face's
// art placed on the part of the paper that ends up as that face, then the fold steps drawn as small diagrams. The fold itself is
// balloonCubeModel.ts; this only draws it (the art is drawn once and placed on the sheet and on the cube's faces in the diagrams).
import './balloonCube.css';
import { h } from '../../editor/core/ui';
import { html, sheet, type Sheet } from './kit';
import { CREASES, L, PLACEMENTS, TUCKS, type Frame2, type FaceId, type V2, type V3 } from './balloonCubeModel';
import type { BalloonCubeItem, CubeFace } from './balloonCubeTypes';

const INK = '#1c1630';
const FACE = '#c9f4ee';
const RED = '#c4202c';
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
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One face's art in a 100-unit square centered on 0, y down, the face's up toward -y. */
function faceArt(f: CubeFace, lid: boolean): string {
  const g = 25;
  const grid: Record<number, V2[]> = {
    1: [[0, 0]],
    2: [
      [-g, -g],
      [g, g],
    ],
    3: [
      [-g, -g],
      [0, 0],
      [g, g],
    ],
    4: [
      [-g, -g],
      [g, -g],
      [-g, g],
      [g, g],
    ],
    7: [
      [-g, -g],
      [g, -g],
      [-g, 0],
      [0, 0],
      [g, 0],
      [-g, g],
      [g, g],
    ],
  };
  let out = `<rect x="-50" y="-50" width="100" height="100" fill="${FACE}"/>`;
  if (lid) {
    // the 0: a ring with the blow hole in the middle, the caption ringed round it
    out += `<circle r="21" fill="none" stroke="${INK}" stroke-width="9"/><circle r="5" fill="${INK}"/>`;
    if (f.caption) {
      // one letter at a time round the hole (a text path would break where the art is placed in a transformed group)
      const ring = `${f.caption} · ${f.caption} · `;
      const turn = 360 / ring.length;
      out += [...ring]
        .map(
          (ch, i) =>
            `<text transform="rotate(${(i * turn).toFixed(2)}) translate(0,-38.5)" font-size="8.6" font-weight="700" text-anchor="middle" fill="${INK}" font-family="Arial,sans-serif">${esc(ch)}</text>`,
        )
        .join('');
    }
  } else {
    const dots = grid[f.pips] ?? [];
    dots.forEach(([x, y], i) => {
      const dead = f.dead && i === dots.length - 1;
      out += dead
        ? `<circle cx="${x}" cy="${y * 0.9 - 3}" r="8.5" fill="#fff" stroke="${RED}" stroke-width="3"/><path d="M${x - 5},${y * 0.9 - 8}L${x + 5},${y * 0.9 + 2}M${x + 5},${y * 0.9 - 8}L${x - 5},${y * 0.9 + 2}" stroke="${RED}" stroke-width="2.6"/>`
        : `<circle cx="${x}" cy="${y * 0.9 - 3}" r="8.5" fill="${INK}"/>`;
    });
    if (f.caption)
      out += `<text y="44" font-size="8.4" font-weight="700" text-anchor="middle" fill="${INK}" font-family="Arial,sans-serif">${esc(f.caption)}</text>`;
  }
  return out + `<rect x="-49" y="-49" width="98" height="98" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
}

/** The svg matrix that puts the 100-unit art on a sheet frame (art 100 = one cube edge). */
function sheetMatrix(fr: Frame2): string {
  const k = (L / 100) * SHEET;
  const [ox, oy] = px(fr.o);
  return `matrix(${(k * fr.right[0]).toFixed(5)} ${(-k * fr.right[1]).toFixed(5)} ${(-k * fr.up[0]).toFixed(5)} ${(k * fr.up[1]).toFixed(5)} ${ox.toFixed(3)} ${oy.toFixed(3)})`;
}

const dash = { mountain: '14 5 3 5', valley: '8 6' };

/** The sheet: faces with their art, the tucks (hatched), the crease lines, the cut line. `plain` leaves the art off (the little step diagrams). */
function sheetSvg(it: BalloonCubeItem, o: { plain?: boolean; arrows?: boolean; width: number }): string {
  const clips = PLACEMENTS.map((p, i) => `<clipPath id="bc${i}${o.plain ? 'p' : ''}${o.width}"><polygon points="${pts(p.clip)}"/></clipPath>`).join('');
  const faces = PLACEMENTS.map((p, i) =>
    o.plain
      ? `<polygon points="${pts(p.clip)}" fill="${FACE}"/>`
      : `<g clip-path="url(#bc${i}${o.width})"><g transform="${sheetMatrix(p.sheet)}">${faceArt(it.faces[p.face], p.face === 'top')}</g></g>`,
  ).join('');
  const tucks = TUCKS.map((t) => `<polygon points="${pts(t)}" fill="url(#hatch${o.width})" stroke="none"/>`).join('');
  const lines = CREASES.map(
    (c) =>
      `<line x1="${px(c.a)[0]}" y1="${px(c.a)[1]}" x2="${px(c.b)[0]}" y2="${px(c.b)[1]}" stroke="${c.kind === 'mountain' ? INK : RED}" stroke-width="${o.plain ? 5 : 2.6}" stroke-dasharray="${dash[c.kind]}"/>`,
  ).join('');
  const arrows = o.arrows
    ? TUCKS.map((t) => {
        const c = px([
          (t[0][0] * 2 + t[1][0] + t[2][0]) / 4 + Math.sign(t[1][0] + t[2][0]) * 0.03,
          (t[0][1] * 2 + t[1][1] + t[2][1]) / 4 + Math.sign(t[1][1] + t[2][1]) * 0.03,
        ]);
        return `<circle cx="${c[0]}" cy="${c[1]}" r="22" fill="#fff" stroke="${RED}" stroke-width="5"/>`;
      }).join('')
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 ${SHEET + 24} ${SHEET + 24}" role="img" aria-label="The square sheet with its fold lines and faces">` +
    `<defs>${clips}<pattern id="hatch${o.width}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#ece8dc"/><line x1="0" y1="0" x2="0" y2="14" stroke="#9a948a" stroke-width="3"/></pattern></defs>` +
    `<rect x="0" y="0" width="${SHEET}" height="${SHEET}" fill="#fff"/>${tucks}${faces}${lines}${arrows}` +
    `<rect x="0" y="0" width="${SHEET}" height="${SHEET}" fill="none" stroke="#000" stroke-width="3"/></svg>`
  );
}

// ---- the cube in three dimensions (little isometric views) ----
type Poly = { pts: V3[]; n: V3; art?: { f: CubeFace; lid: boolean; right: V3; up: V3; o: V3 }; seams?: boolean };
const AZ = (-45 * Math.PI) / 180;
const EL = (32 * Math.PI) / 180;
const cam: V3 = [Math.cos(EL) * Math.cos(AZ), Math.cos(EL) * Math.sin(AZ), Math.sin(EL)];
const R3: V3 = [-Math.sin(AZ), Math.cos(AZ), 0];
const U3: V3 = [-Math.sin(EL) * Math.cos(AZ), -Math.sin(EL) * Math.sin(AZ), Math.cos(EL)];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scr = (p: V3, k: number): V2 => [dot(p, R3) * k, -dot(p, U3) * k];

/** The cube drawn with its four lid flaps `t` radians from standing up (0) to closed (pi/2); `ink` puts the art on the visible faces. */
function cubeSvg(it: BalloonCubeItem, t: number, ink: boolean): string {
  const h2 = L / 2;
  const k = 330;
  const c: V3[][] = [
    [
      [h2, -h2, 0],
      [h2, h2, 0],
      [h2, h2, L],
      [h2, -h2, L],
    ], // +x = ne
    [
      [-h2, -h2, 0],
      [h2, -h2, 0],
      [h2, -h2, L],
      [-h2, -h2, L],
    ], // -y = nw
    [
      [-h2, h2, 0],
      [-h2, -h2, 0],
      [-h2, -h2, L],
      [-h2, h2, L],
    ], // -x = sw
    [
      [h2, h2, 0],
      [-h2, h2, 0],
      [-h2, h2, L],
      [h2, h2, L],
    ], // +y = se
  ];
  const faces: [FaceId, V3, V3, V3, V3][] = [
    ['ne', [1, 0, 0], [h2, 0, h2], [0, 1, 0], [0, 0, 1]],
    ['nw', [0, -1, 0], [0, -h2, h2], [1, 0, 0], [0, 0, 1]],
    ['sw', [-1, 0, 0], [-h2, 0, h2], [0, -1, 0], [0, 0, 1]],
    ['se', [0, 1, 0], [0, h2, h2], [-1, 0, 0], [0, 0, 1]],
  ];
  const polys: Poly[] = faces.map(([id, n, o, right, up], i) => ({ pts: c[i], n, art: { f: it.faces[id], lid: false, right, up, o } }));
  // the flaps: a right triangle hinged on each top edge, its tip swinging from straight up to the lid's middle
  polys.push(
    ...faces.map(([, n], i) => {
      const [a, b] = [c[i][3], c[i][2]];
      const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, L];
      const tip: V3 = [0, 1, 2].map((j) => mid[j] + (L / 2) * (Math.cos(t) * (j === 2 ? 1 : 0) - Math.sin(t) * n[j])) as V3;
      const nn: V3 = [0, 1, 2].map((j) => Math.cos(t) * n[j] + Math.sin(t) * (j === 2 ? 1 : 0)) as V3;
      return { pts: [a, b, tip], n: nn, seams: t > 1.5 };
    }),
  );
  polys.sort((p, q) => {
    const d = (x: Poly) =>
      dot(
        x.pts.reduce((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]] as V3, [0, 0, 0] as V3),
        cam,
      );
    return d(p) - d(q);
  });
  let out = '';
  for (const p of polys) {
    const front = dot(p.n, cam) > 0;
    const d = p.pts
      .map((v) =>
        scr(v, k)
          .map((x) => x.toFixed(1))
          .join(','),
      )
      .join(' ');
    out += `<polygon points="${d}" fill="${front ? FACE : '#fbf8ee'}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    if (ink && front && p.art) {
      const { right, up, o } = p.art;
      const kk = (L / 100) * k;
      const [ox, oy] = scr(o, k);
      const [rx, ry] = scr(right, kk);
      const [ux, uy] = scr(up, -kk); // art y is down: up is -y
      out += `<g clip-path="url(#fc${ox.toFixed(0)}${oy.toFixed(0)})"><clipPath id="fc${ox.toFixed(0)}${oy.toFixed(0)}"><polygon points="${d}"/></clipPath><g transform="matrix(${rx.toFixed(4)} ${ry.toFixed(4)} ${ux.toFixed(4)} ${uy.toFixed(4)} ${ox.toFixed(2)} ${oy.toFixed(2)})">${faceArt(p.art.f, false)}</g></g>`;
    }
  }
  // the lid, when the flaps meet over it: it is a flat square of art (the four flaps' own art) with a seam cross and the hole
  if (t > 1.5) {
    const lidPts: V3[] = [
      [h2, -h2, L],
      [h2, h2, L],
      [-h2, h2, L],
      [-h2, -h2, L],
    ];
    const d = lidPts
      .map((v) =>
        scr(v, k)
          .map((x) => x.toFixed(1))
          .join(','),
      )
      .join(' ');
    const lk = (L / 100) * k;
    const [ox, oy] = scr([0, 0, L], k);
    const [rx, ry] = scr([0, -1, 0], lk);
    const [ux, uy] = scr([1, 0, 0], -lk);
    out += `<polygon points="${d}" fill="${FACE}" stroke="${INK}" stroke-width="2"/>`;
    out += ink
      ? `<g transform="matrix(${rx.toFixed(4)} ${ry.toFixed(4)} ${ux.toFixed(4)} ${uy.toFixed(4)} ${ox.toFixed(2)} ${oy.toFixed(2)})">${faceArt(it.faces.top, true)}</g>`
      : `<ellipse cx="${ox}" cy="${oy}" rx="9" ry="5" fill="${INK}"/>`;
    for (const q of lidPts)
      out += `<line x1="${ox}" y1="${oy}" x2="${scr(q, k)[0]}" y2="${scr(q, k)[1]}" stroke="${INK}" stroke-width="1.4" stroke-dasharray="4 3"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-120 -165 240 255" role="img" aria-label="The cube">${out}</svg>`;
}

const legend = (): HTMLElement =>
  html(
    'div',
    'bc-legend',
    `<span><svg viewBox="0 0 80 8"><line x1="0" y1="4" x2="80" y2="4" stroke="${INK}" stroke-width="2.6" stroke-dasharray="${dash.mountain}"/></svg>mountain fold: crease it away from you</span>` +
      `<span><svg viewBox="0 0 80 8"><line x1="0" y1="4" x2="80" y2="4" stroke="${RED}" stroke-width="2.6" stroke-dasharray="${dash.valley}"/></svg>valley fold: crease it toward you</span>` +
      `<span><svg viewBox="0 0 80 8"><line x1="0" y1="4" x2="80" y2="4" stroke="#000" stroke-width="2.6"/></svg>cut line</span>` +
      `<span><svg viewBox="0 0 24 8"><rect width="24" height="8" fill="#ece8dc"/><path d="M0,8L8,0M8,8L16,0M16,8L24,0" stroke="#9a948a" stroke-width="1.6"/></svg>tucks inside</span>`,
  );

/** The balloon cube's two letter sheets: the square to cut out and fold, then the steps. */
export async function balloonCubeSheets(it: BalloonCubeItem): Promise<Sheet[]> {
  const step = (n: number, text: string, svg: string): HTMLElement =>
    h('li', { class: 'bc-step' }, html('div', 'bc-pic', svg), h('p', null, h('b', null, `${n}. `), text));
  const side = Math.round(L * 7.5 * 100) / 100;
  return [
    sheet(
      8.5,
      11,
      'ballooncube',
      h('h2', null, it.heading ?? it.title),
      it.intro ? h('p', { class: 'bc-intro' }, it.intro) : null,
      legend(),
      html('div', 'bc-sheet', sheetSvg(it, { width: 900 })),
      h(
        'p',
        { class: 'bc-foot' },
        `Print at full size (no scaling). The square is 7.5 inches; the cube comes out ${side} inches on a side. Any sheet of paper works: lighter is easier to blow up.`,
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
        step(1, 'Cut out the square along its solid edge.', sheetSvg(it, { plain: true, width: 100 })),
        step(
          2,
          'Fold every dashed and dash-dot line the way the legend says, then unfold it, so each crease is sharp.',
          sheetSvg(it, { plain: true, width: 101 }),
        ),
        step(
          3,
          'Fold the four faces up and away from you, around the middle square (it stays facing you, so the printing ends up outside). As they rise, push each gray tuck in along its dashed line so it folds in half inside.',
          cubeSvg(it, 0, false),
        ),
        step(
          4,
          'Fold the four corner triangles over the top, along the dash-dot lines, so their right angles meet in the middle of the lid.',
          cubeSvg(it, 0.85, false),
        ),
        step(5, 'The corners now meet at a small hole, with a seam to each corner of the lid. Blow gently into it.', cubeSvg(it, Math.PI / 2, false)),
        step(6, 'Press out the corners. It is a die, and the lid is the 0. Roll it to pick a booth.', cubeSvg(it, Math.PI / 2, true)),
      ),
      it.foot ? h('p', { class: 'bc-foot' }, it.foot) : null,
    ),
  ];
}
