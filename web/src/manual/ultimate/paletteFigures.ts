// The palette figures of The Ultimate Owner's Guide, drawn from the games' real files: the same
// blocks under each palette, each beside its full 256-entry palette (8 rows of 32) with the
// entries that differ from the first palette marked underneath and the named ranges outlined,
// and a before → after row of just those ranges. The ranges are where the games' palette
// builders put each ramp (games/<id>/src/art/pal.ts, which match the .PAL files on the disks).
import { h } from '../../editor/core/ui';
import { paintIndexed } from '../../editor/core/draw';
import { fetchGameFile, loadCatalog, withDetails, type CatalogEntry } from '../../project/files';
import { BACKBL, BLEN, parseBlocks } from '../../formats/blocks';
import { MLEN, parseMap } from '../../formats/map';
import { parsePalette, vga8, type Palette } from '../../formats/palette';

/** A run of palette entries with a name, e.g. [11, 17, 'snow']. */
type Range = [from: number, to: number, name: string];

interface Set {
  game: string;
  title: string;
  /** Map window drawn under every palette. */
  map: string;
  bbl: string;
  at: [x: number, y: number, w: number, h: number];
  /** Palette files and what to call them; the first is the one the others are compared with. */
  pals: [file: string, name: string][];
  /** Ranges to outline on every grid. */
  focus: Range[];
}

const SNOWBOUND: Set = {
  game: 'snowbound',
  title: 'Snowbound',
  map: 'gale.map',
  bbl: 'snow.bbl',
  at: [38, 11, 10, 9],
  pals: [
    ['noon.pal', 'noon'],
    ['morning.pal', 'morning'],
    ['dusk.pal', 'dusk'],
    ['night.pal', 'night'],
  ],
  focus: [
    [11, 17, 'snow'],
    [80, 83, 'window glow'],
  ],
};

/** The ranges in Snowbound's before → after rows. */
const SNOW_ROWS: Range[] = [
  [11, 17, 'snow'],
  [32, 36, 'brick'],
  [51, 55, 'pine'],
  [72, 75, 'orange light'],
  [80, 83, 'window glow'],
  [98, 101, 'holiday lights'],
];

const GOAT: Set = {
  game: 'goat',
  title: 'Third Goat from the Left',
  map: 'town.map',
  bbl: 'goat.bbl',
  at: [4, 3, 10, 7],
  pals: [
    ['field.pal', 'field'],
    ['town.pal', 'town'],
    ['caravan.pal', 'caravan'],
    ['stable.pal', 'stable'],
  ],
  focus: [
    [26, 30, 'stone'],
    [104, 114, 'gold, glow and star'],
  ],
};

const LOAF: Set = {
  game: 'loaf',
  title: 'Loaf #13',
  map: 'hill.map',
  bbl: 'loaf.bbl',
  at: [38, 2, 10, 7],
  pals: [
    ['hill.pal', 'noon'],
    ['wicker.pal', 'shade'],
    ['baskets.pal', 'dusk'],
    ['home.pal', 'night'],
  ],
  focus: [
    [9, 14, 'sky'],
    [17, 25, 'crust and crumb'],
    [105, 119, 'sun, gold, lamps, fire'],
  ],
};

const games = new Map<string, Promise<CatalogEntry | undefined>>();
function game(id: string): Promise<CatalogEntry | undefined> {
  let g = games.get(id);
  if (!g) {
    g = loadCatalog()
      .then((list) => list.find((x) => x.id === id))
      .then((x) => (x ? withDetails(x) : undefined))
      .catch(() => undefined);
    games.set(id, g);
  }
  return g;
}

async function files(id: string, names: string[]): Promise<(Uint8Array | undefined)[]> {
  const g = await game(id);
  if (!g) return names.map(() => undefined);
  return Promise.all(names.map((n) => fetchGameFile(g, n).catch(() => undefined)));
}

const same = (a: Palette, b: Palette, i: number) => a[i * 3] === b[i * 3] && a[i * 3 + 1] === b[i * 3 + 1] && a[i * 3 + 2] === b[i * 3 + 2];
const css = (p: Palette, i: number) => `rgb(${vga8(p[i * 3])},${vga8(p[i * 3 + 1])},${vga8(p[i * 3 + 2])})`;

/** Entries that differ, as runs: "9–71, 76–79". */
export function runs(list: number[]): string {
  const out: string[] = [];
  for (let k = 0; k < list.length;) {
    let e = k;
    while (e + 1 < list.length && list[e + 1] === list[e] + 1) e++;
    out.push(e === k ? `${list[k]}` : `${list[k]}–${list[e]}`);
    k = e + 1;
  }
  return out.join(', ');
}

/** The highest entry that isn't black: the rest of the palette is unused. */
const lastUsed = (p: Palette) => {
  let u = 0;
  for (let i = 0; i < 256; i++) if (p[i * 3] | p[i * 3 + 1] | p[i * 3 + 2]) u = i;
  return u;
};

const COLS = 32;
const CW = 10; // a swatch 9 wide and a gap
const RH = 14; // a swatch 9 high, a 3 pixel mark under it, a gap

/** The whole palette, 8 rows of 32; a mark under each entry that differs from `ref`; `focus` outlined. */
function grid(p: Palette, ref: Palette | undefined, focus: Range[], alt: string): HTMLImageElement {
  const c = document.createElement('canvas');
  c.width = COLS * CW + 3;
  c.height = 8 * RH + 3;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fffdf4';
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 256; i++) {
    const x = 2 + (i % COLS) * CW;
    const y = 2 + Math.floor(i / COLS) * RH;
    g.fillStyle = css(p, i);
    g.fillRect(x, y, 9, 9);
    if (ref && !same(p, ref, i)) {
      g.fillStyle = '#18150f';
      g.fillRect(x, y + 10, 9, 2);
    }
  }
  g.strokeStyle = '#d81e1e';
  g.lineWidth = 2;
  for (const [from, to] of focus)
    for (let row = Math.floor(from / COLS); row <= Math.floor(to / COLS); row++) {
      const a = Math.max(from, row * COLS) % COLS;
      const b = Math.min(to, row * COLS + COLS - 1) % COLS;
      g.strokeRect(1 + a * CW, 1 + row * RH, (b - a + 1) * CW + 1, 11);
    }
  return h('img', { src: c.toDataURL(), alt, width: c.width, height: c.height, class: 'ug-pix ug-palgrid' });
}

/** A strip of swatches for entries from..to. */
function strip(p: Palette, [from, to]: Range, alt: string): HTMLImageElement {
  const c = document.createElement('canvas');
  c.width = (to - from + 1) * 10;
  c.height = 10;
  const g = c.getContext('2d')!;
  for (let i = from; i <= to; i++) {
    g.fillStyle = css(p, i);
    g.fillRect((i - from) * 10, 0, 10, 10);
  }
  return h('img', { src: c.toDataURL(), alt, width: c.width, height: c.height, class: 'ug-pix ug-strip-sw' });
}

function windowPixels(map: Uint8Array, bbl: Uint8Array, [x, y, w, hh]: Set['at']): Uint8Array {
  const m = parseMap(map);
  const blocks = parseBlocks(bbl, BACKBL);
  const px = new Uint8Array(w * BLEN * hh * BLEN);
  for (let by = 0; by < hh; by++)
    for (let bx = 0; bx < w; bx++) {
      const b = blocks[m.blocks[(y + by) * MLEN + x + bx]];
      if (b) for (let j = 0; j < BLEN; j++) px.set(b.pixels.subarray(j * BLEN, j * BLEN + BLEN), (by * BLEN + j) * w * BLEN + bx * BLEN);
    }
  return px;
}

const key = (focus: Range[]) =>
  h(
    'p',
    { class: 'ug-palkey' },
    'Red outlines: ',
    focus.map(([a, b, n]) => `colors ${a}–${b}, ${n}`).join('; '),
    '. A bar under a color: it differs from the reference. The black rows are unused colors.',
  );

/** The set's palettes loaded, with the window's pixels; undefined when a file is missing. */
async function load(s: Set) {
  const got = await files(s.game, [s.map, s.bbl, ...s.pals.map(([f]) => f)]);
  if (got.some((b) => !b)) return undefined;
  const [map, bbl, ...pals] = got as Uint8Array[];
  return { px: windowPixels(map, bbl, s.at), pals: pals.map(parsePalette) };
}

/** Pictures with their palettes: two columns (`wide`) or four. */
async function scenes(s: Set, num: string, caption: string, wide: boolean): Promise<HTMLElement | undefined> {
  const got = await load(s);
  if (!got) return undefined;
  const [, , w, hh] = s.at;
  const ref = got.pals[0];
  const first = s.pals[0][1];
  return h(
    'figure',
    { class: `ug-palset ${wide ? 'ug-two' : 'ug-four'}` },
    h(
      'div',
      { class: 'ug-palcols' },
      ...s.pals.map(([, name], i) => {
        const p = got.pals[i];
        const changed = Array.from({ length: 256 }, (_, k) => k).filter((k) => !same(p, ref, k));
        const unused = lastUsed(p) + 1;
        const note = i === 0 ? `the palette the others are compared with` : `differs from ${first} in colors ${runs(changed)}`;
        const pic = document.createElement('canvas');
        paintIndexed(pic, got.px, w * BLEN, hh * BLEN, p);
        return h(
          'div',
          { class: 'ug-palcol' },
          h('img', { src: pic.toDataURL(), alt: `${s.title}, the same blocks in the ${name} palette`, width: w * BLEN, height: hh * BLEN, class: 'ug-pix' }),
          grid(p, i ? ref : undefined, s.focus, `${s.title}’s ${name} palette, all 256 colors in rows of 32: ${note}; colors ${unused}–255 are unused`),
          h('b', null, name),
          h('small', null, i === 0 ? 'the reference' : `changed: ${runs(changed)}`),
        );
      }),
    ),
    key(s.focus),
    h('figcaption', null, `Figure ${num}. ${caption}`),
  );
}

/** Snowbound's before → after rows: noon and night, for each named range. */
async function beforeAfter(num: string): Promise<HTMLElement | undefined> {
  const got = await files('snowbound', ['noon.pal', 'night.pal']);
  if (got.some((b) => !b)) return undefined;
  const [noon, night] = (got as Uint8Array[]).map(parsePalette);
  return h(
    'figure',
    { class: 'ug-before' },
    h(
      'table',
      null,
      h('tr', null, h('th', null, 'Colors'), h('th', null, 'Noon'), h('th', { 'aria-hidden': 'true' }), h('th', null, 'Night')),
      ...SNOW_ROWS.map((r) =>
        h(
          'tr',
          null,
          h('th', { scope: 'row' }, `${r[0]}–${r[1]}: ${r[2]}`),
          h('td', null, strip(noon, r, `${r[2]} at noon`)),
          h('td', { 'aria-hidden': 'true' }, '→'),
          h('td', null, strip(night, r, `${r[2]} at night`)),
        ),
      ),
    ),
    h(
      'figcaption',
      null,
      `Figure ${num}. Before → after: Snowbound’s ramps at noon and at night. Night darkens every ramp and pulls it toward blue, but the glowing ones (orange light, window glow, the holiday lights) come out brighter than at noon.`,
    ),
  );
}

export const PALETTE_FIGURES: Record<string, () => Promise<HTMLElement | undefined>> = {
  moods: () =>
    scenes(
      SNOWBOUND,
      '1-1',
      'One corner of Snowbound’s Gale Street, the same map and the same blocks, under four palettes, each with its whole palette beneath it. Noon is the reference: the bars show which colors each other palette changes. The window glow (80–83) is the same in the morning and at dusk; only night changes it, to shine brighter.',
      true,
    ),
  compare: () => beforeAfter('1-2'),
  goat: () =>
    scenes(
      GOAT,
      '1-3',
      'Third Goat from the Left: one block set, four places. Every ramp from 9 to 103 is relit for each place, while the gold, lamp glow and star (104–114) stay exactly the same, so the lit windows and the star shine everywhere.',
      true,
    ),
  loaf: () =>
    scenes(
      LOAF,
      '1-4',
      'Loaf #13 from noon to night. The sky (9–14) and most ramps change with the light. The loaf’s crust and crumbs (17–25) keep their own gold until night, when even the loaf dims a little; the sun, gold, lamps and fire (105–119) never change.',
      true,
    ),
};
