// The palette editor's Color vision tab (loaded the first time it is opened): a level's map in
// this palette as seen normally, in grayscale and with protanopia, deuteranopia or tritanopia
// (colorVision.ts, after Machado et al. 2009); the colors that become hard to tell apart there
// (visionWarnings.ts), each showing where on the map when clicked; and a one-click fix where one
// is safe. A fix only changes palette colors, so it saves like any other edit and undoes with ↶.
import { h, clear, toast } from '../../core/ui';
import { BLEN, TRANSPARENT } from '../../../formats/blocks';
import { MLEN, MWID } from '../../../formats/map';
import { paletteCss, paletteToRGBA, type Palette } from '../../../formats/palette';
import { normalize } from '../../../project/files';
import type { Project } from '../../core/project';
import { scenesOf, type SceneData } from '../../check/sceneData';
import { pictures } from '../../check/checks/monsterChecks';
import { arrival } from '../integrator/board';
import { unlockAchievement } from '../../../achievements';
import { VIEWS, simulate, type View } from './colorVision';
import { analyze, fixFor, warnings, whereTouch, type Analysis, type Warning } from './visionWarnings';

export interface VisionContext {
  project: Project;
  file: string;
  pal: Palette;
  /** Selects a color in the palette (so it can be edited). */
  select: (i: number) => void;
  remember: () => void;
  changed: () => void;
  undo: () => void;
}

const COLS = 12;
const ROWS = 7;
/** Warnings shown before "Show more". */
const FIRST = 6;
const SHORT: Record<View, string> = { normal: 'Normal', gray: 'Gray', protan: 'Protan', deutan: 'Deutan', tritan: 'Tritan' };
const viewList = (vs: View[]) => vs.map((v) => SHORT[v]).join(', ');

/** COLS x ROWS blocks of a level's map around `center`, with its placed monsters, as palette indices. */
function mapPixels(d: SceneData, center: number): Uint8Array {
  const W = COLS * BLEN;
  const out = new Uint8Array(W * ROWS * BLEN);
  const x0 = Math.max(0, Math.min(MLEN - COLS, (center % MLEN) - Math.floor(COLS / 2)));
  const y0 = Math.max(0, Math.min(MWID - ROWS, Math.floor(center / MLEN) - Math.floor(ROWS / 2)));
  const paint = (px: Uint8Array | undefined, bx: number, by: number, sprite: boolean) => {
    if (!px) return;
    for (let y = 0; y < BLEN; y++)
      for (let x = 0; x < BLEN; x++) {
        const c = px[y * BLEN + x];
        if (!sprite || c !== TRANSPARENT) out[(by * BLEN + y) * W + bx * BLEN + x] = c;
      }
  };
  for (let by = 0; by < ROWS; by++) for (let bx = 0; bx < COLS; bx++) paint(d.bbl[d.map.blocks[(y0 + by) * MLEN + x0 + bx]]?.pixels, bx, by, false);
  for (const p of d.map.monsters) {
    const m = d.mon[p.monnum];
    if (!m || p.curx < x0 || p.cury < y0 || p.curx >= x0 + COLS || p.cury >= y0 + ROWS) continue;
    paint(d.mbl[pictures(m)[0]]?.pixels, p.curx - x0, p.cury - y0, true);
  }
  return out;
}

export function visionPanel(c: VisionContext): { el: HTMLElement; refresh: () => void; dispose: () => void } {
  const { project, file, pal } = c;
  const game = project.game();
  const all = scenesOf(game, project.files);
  const mine = all.filter((d) => normalize(d.names.pal ?? '') === file);
  const scenes = mine.length ? mine : all;
  // levels that share a map, blocks and monsters are one check
  const same = (d: SceneData) => [d.names.map, d.names.bbl, d.names.mon, d.names.mbl].join('|');
  const unique = [...new Map(scenes.map((d) => [same(d), d])).values()];
  const analyses = new Map<string, Analysis>();
  const analysisOf = (d: SceneData) => {
    let a = analyses.get(same(d));
    if (!a) analyses.set(same(d), (a = analyze(d)));
    return a;
  };

  let scene = scenes[0];
  let view: View = 'normal';
  let center = scene ? arrivalCell(scene) : 0;
  let marked: number[] | undefined;
  let showAll = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let fixTimer: ReturnType<typeof setTimeout> | undefined;
  let list: Warning[] = [];

  function arrivalCell(d: SceneData): number {
    const at = arrival(game, d.scene);
    return at.y * MLEN + at.x;
  }

  // two levels of one name tell apart by scene number
  const label = (d: SceneData) => (scenes.filter((x) => x.name === d.name).length > 1 ? `${d.name} (scene ${d.scene})` : d.name);
  const sceneSel = h('select', { 'aria-label': 'Level to check' }, ...scenes.map((d) => h('option', { value: String(d.scene) }, label(d))));
  sceneSel.addEventListener('change', () => {
    scene = scenes.find((d) => String(d.scene) === sceneSel.value) ?? scenes[0];
    center = arrivalCell(scene);
    marked = undefined;
    showAll = false;
    update();
  });

  const viewBtns = VIEWS.map((v) =>
    h(
      'button',
      {
        type: 'button',
        class: 'pal-view',
        title: `${v.name}: ${v.about}`,
        'aria-pressed': String(v.id === view),
        onclick: () => {
          view = v.id;
          showAll = false;
          update();
        },
      },
      SHORT[v.id],
    ),
  );
  const canvas = h('canvas', { class: 'pixel pal-vision-shot', role: 'img', 'aria-label': 'The level' });
  const caption = h('figcaption', { class: 'meta' });
  const count = h('p', { class: 'pal-vision-count', role: 'status' });
  const items = h('ul', { class: 'pal-warns' });
  const done = h('p', { class: 'meta pal-vision-done', hidden: true });
  const shot = scene
    ? h('figure', { class: 'pal-vision-fig' }, canvas, caption)
    : h('p', { class: 'meta' }, 'No level uses this palette, so only its ramps are checked.');

  const el = h(
    'div',
    { class: 'pal-vision stack' },
    h(
      'p',
      { class: 'meta' },
      'This palette as players who see colors differently see it, and on a gray screen. Pick a view; the list shows colors that look alike in it.',
    ),
    scenes.length > 1 ? h('label', { class: 'field' }, h('span', null, 'Level'), sceneSel) : null,
    h('div', { class: 'seg pal-views', role: 'group', 'aria-label': 'Show as seen with' }, ...viewBtns),
    shot,
    count,
    done,
    items,
  );

  // with no level: the whole palette's ramps
  const noLevel: Analysis = {
    scene: { map: { blocks: new Uint8Array(0), mons: new Uint8Array(0), monsters: [] }, bbl: [], mbl: [], mon: [] },
    touches: new Map(),
    uses: new Float64Array(256).fill(1),
    monsters: [],
  };
  const current = () => (scene ? analysisOf(scene) : noLevel);

  function draw(): void {
    if (!scene) return;
    const px = mapPixels(scene, center);
    const W = COLS * BLEN;
    const H = ROWS * BLEN;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(W, H);
    const out = new Uint32Array(img.data.buffer);
    // not core/draw's lut: that one is kept per palette object, and this palette changes in place
    const l = paletteToRGBA(view === 'normal' ? pal : simulate(pal, view));
    const keep = marked && new Set(marked);
    for (let i = 0; i < px.length; i++) out[i] = l[px[i]];
    // showing where: every other color washes out to a pale gray, so the colors shown stand out
    if (keep)
      for (let i = 0; i < px.length; i++) {
        if (keep.has(px[i])) continue;
        const v = out[i];
        const wash = (s: number) => Math.round(((v >> s) & 255) * 0.25 + 150) << s;
        out[i] = (0xff000000 | wash(16) | wash(8) | wash(0)) >>> 0;
      }
    ctx.putImageData(img, 0, 0);
    const v = VIEWS.find((x) => x.id === view)!;
    const where = marked ? ` Showing colors ${marked.join(', ')}; the rest is washed out.` : '';
    canvas.setAttribute('aria-label', `${scene.name} as seen ${view === 'normal' ? 'normally' : `with ${v.name.toLowerCase()}`}.${where}`);
    caption.textContent = `${v.name}: ${v.about}.${where}`;
  }

  const swatch = (i: number) => h('span', { class: 'pal-chip', style: `background:${paletteCss(pal, i)}`, 'aria-hidden': 'true' });

  function text(w: Warning): string {
    if (w.kind === 'pair') return `Colors ${w.a} and ${w.b} touch ${w.count.toLocaleString()} times and look alike: ${viewList(w.views)}`;
    if (w.kind === 'monster') return `Monster ${w.n} against color ${w.behind}, where it stands: ${viewList(w.views)} (contrast ${w.ratio.toFixed(1)} : 1)`;
    return `Ramp ${Math.min(...w.ramp)}–${Math.max(...w.ramp)}: steps ${w.step[0]} and ${w.step[1]} too close to see: ${viewList(w.views)}`;
  }

  function show(w: Warning): void {
    if (!w.views.includes(view)) view = w.views[0];
    if (w.kind === 'pair') {
      marked = [w.a, w.b];
      if (scene) center = whereTouch(analysisOf(scene), w.a, w.b);
      c.select(w.a);
    } else if (w.kind === 'monster') {
      marked = [...new Set([...(analysisOf(scene).monsters.find((m) => m.n === w.n)?.colors ?? [w.color]), w.behind])];
      center = w.cell;
      c.select(w.color);
    } else {
      marked = w.ramp;
      c.select(w.step[0]);
    }
    update();
    (scene ? canvas : items).scrollIntoView({ block: 'nearest' });
  }

  function apply(fix: { label: string; pal: Palette }): void {
    c.remember();
    pal.set(fix.pal);
    c.changed();
    unlockAchievement('palette-vision');
    const undo = () => {
      c.undo();
      done.hidden = true;
    };
    clear(done, `${fix.label}: done. `, h('button', { type: 'button', class: 'pal-vision-undo', onclick: undo }, 'Undo'));
    done.hidden = false;
    toast(`${fix.label}. Undo with ↶ or Ctrl+Z.`);
  }

  function update(): void {
    viewBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(VIEWS[i].id === view)));
    draw();
    const found = warnings(pal, current());
    list = view === 'normal' ? found : found.filter((w) => w.views.includes(view));
    const where = view === 'normal' ? 'in any view' : `with ${SHORT[view]}`;
    count.textContent = list.length ? `${list.length} to look at ${where}` : `Nothing to look at ${where}.`;
    const shown = showAll ? list : list.slice(0, FIRST);
    clear(
      items,
      ...shown.map((w) => {
        const colors = w.kind === 'pair' ? [w.a, w.b] : w.kind === 'monster' ? [w.color, w.behind] : w.step;
        return h(
          'li',
          { 'data-id': w.id },
          h(
            'button',
            { type: 'button', class: 'pal-warn-go', title: 'Show where, and select the color', onclick: () => show(w) },
            ...colors.map(swatch),
            h('span', null, text(w)),
          ),
        );
      }),
      list.length > shown.length
        ? h(
            'li',
            null,
            h(
              'button',
              {
                type: 'button',
                class: 'pal-warn-more',
                onclick: () => {
                  showAll = true;
                  update();
                },
              },
              `Show ${list.length - shown.length} more`,
            ),
          )
        : null,
    );
    findFixes(shown);
  }

  /** One warning at a time, so the page stays responsive: a ✨ button where a safe fix exists. */
  function findFixes(shown: Warning[]): void {
    clearTimeout(fixTimer);
    const others = unique.map(analysisOf);
    const todo = [...shown];
    const next = () => {
      const w = todo.shift();
      if (!w) return;
      const fix = fixFor(pal, w, current(), scene ? others : [noLevel]);
      const li = items.querySelector(`li[data-id="${w.id}"]`);
      if (fix && li)
        li.append(
          h('button', { type: 'button', class: 'pal-warn-fix', title: 'Change the palette (Undo puts it back)', onclick: () => apply(fix) }, `✨ ${fix.label}`),
        );
      fixTimer = setTimeout(next, 0);
    };
    fixTimer = setTimeout(next, 0);
  }
  update();
  return {
    el,
    refresh() {
      clearTimeout(timer);
      timer = setTimeout(update, 250);
    },
    dispose() {
      clearTimeout(timer);
      clearTimeout(fixTimer);
    },
  };
}
