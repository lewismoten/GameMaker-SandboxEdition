// The map editor's Generate dialog: choose a kind (dungeon or forest) and where (the whole map or the
// selection), see four real renders from a seed, pick one. The layouts only ever write ordinary cells,
// as one undo step. The dialog fits a 375 by 812 phone without scrolling: two rows of previews,
// and the Missing roles panel folds away when everything needed is set.
import { h, modal } from '../../../core/ui';
import type { Project } from '../../../core/project';
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { KINDS, MIN_SIDE, checkNeeds, kindInfo, type GenKind, type Rect } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { readRoles } from '../../blocks/blockRoles';
import { loadBrushes } from '../tools/brushStore';
import type { Terrain } from '../tools/autotile';
import type { MapSelection } from '../tools/selection';
import { missingRoles } from './missingRoles';
import { WHOLE, offers, type Offer } from './place';
import './generate.css';

export interface GenerateHost {
  project: Project;
  /** The block set's file name. */
  bbl: string;
  blockCount: number;
  /** The map's blocks now. */
  blocks: () => Uint8Array;
  /** The pictures of the blocks, by number. */
  images: () => HTMLCanvasElement[];
  selection: () => MapSelection | undefined;
  /** Puts the chosen layout into the map as one undo step. */
  apply: (blocks: Uint8Array, what: string) => void;
}

/** A selection's bounding rectangle kept inside the map. */
function selectionRect(s: MapSelection | undefined): Rect | undefined {
  if (!s || s.wrap) return undefined;
  const x = Math.max(0, s.x),
    y = Math.max(0, s.y);
  return { x, y, w: Math.min(s.x + s.w, MLEN) - x, h: Math.min(s.y + s.h, MLEN) - y };
}

function drawOffer(canvas: HTMLCanvasElement, blocks: Uint8Array, rect: Rect, imgs: HTMLCanvasElement[]): void {
  const s = Math.max(1, Math.min(4, Math.floor(240 / Math.max(rect.w, rect.h))));
  canvas.width = rect.w * s;
  canvas.height = rect.h * s;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < rect.h; y++)
    for (let x = 0; x < rect.w; x++) {
      const img = imgs[blocks[(rect.y + y) * MLEN + rect.x + x]];
      if (img) ctx.drawImage(img, 0, 0, BLEN, BLEN, x * s, y * s, s, s);
    }
}

const cellText = (rect: Rect, i: number) => `(${rect.x + (i % rect.w)}, ${rect.y + Math.floor(i / rect.w)})`;

export async function generateDialog(host: GenerateHost): Promise<void> {
  const roles = readRoles(host.project, host.bbl, host.blockCount);
  const terrains = loadBrushes<Terrain>(host.project, host.bbl, 'terrains');
  const sel = selectionRect(host.selection());
  const canUseSel = !!sel && sel.w >= MIN_SIDE && sel.h >= MIN_SIDE;
  let kind: GenKind = 'dungeon';
  let inSelection = canUseSel;
  let seed = Math.floor(Math.random() * 1e6);
  let chosen = 0;
  let current: Offer[] = [];

  await modal<void>('Generate a layout', (close) => {
    const rect = () => (inSelection && sel ? sel : WHOLE);
    const usesHref = `#/p/${host.project.id}/${encodeURIComponent(host.bbl)}?tab=uses`;
    const kindSel = h('select', { 'aria-label': 'Kind of layout' }, ...KINDS.map((k) => h('option', { value: k.id, selected: k.id === kind }, k.label)));
    const areaSel = h(
      'select',
      { 'aria-label': 'Where to draw' },
      h('option', { value: 'whole', selected: !inSelection }, 'The whole map'),
      canUseSel && sel ? h('option', { value: 'sel', selected: inSelection }, `Selection (${sel.w} by ${sel.h})`) : null,
    );
    const seedIn = h('input', { type: 'number', min: 0, max: 4294967295, value: String(seed), 'aria-label': 'Seed number' });
    const blurb = h('p', { class: 'meta' });
    const needs = h('div');
    const grid = h('div', { class: 'gen-offers', role: 'group', 'aria-label': 'Four layouts to pick from' });
    const note = h('p', { class: 'meta gen-note', role: 'status' });
    const use = h('button', { class: 'primary', type: 'button' }, 'Use this layout');
    const buttons: HTMLButtonElement[] = [];

    function refresh(): void {
      const r = rect();
      blurb.textContent = kindInfo(kind).blurb;
      needs.replaceChildren(missingRoles({ kind, roles, usesHref }));
      const n = checkNeeds(kind, roles);
      current = n.ok ? offers(host.blocks(), roles, terrains, kind, seed, r) : [];
      chosen = Math.min(chosen, 3);
      grid.replaceChildren();
      buttons.length = 0;
      if (!n.ok) {
        grid.append(h('p', { class: 'meta' }, n.message));
      } else if (!current[0].outcome.ok) {
        grid.append(h('p', { class: 'meta' }, current[0].outcome.message));
      } else {
        current.forEach((o, i) => {
          const c = h('canvas', { class: 'pixel', 'aria-hidden': 'true' });
          drawOffer(c, o.blocks!, r, host.images());
          const b = h(
            'button',
            {
              type: 'button',
              class: 'gen-offer',
              'aria-pressed': String(i === chosen),
              'aria-label': `Layout ${i + 1}, seed ${o.seed}`,
              onclick: () => {
                chosen = i;
                pick();
              },
            },
            c,
            h('small', null, `Layout ${i + 1}`),
          );
          buttons.push(b);
          grid.append(b);
        });
      }
      pick();
    }
    function pick(): void {
      buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === chosen)));
      const o = current[chosen];
      const ok = !!o?.outcome.ok;
      use.disabled = !ok;
      if (!ok || !o.outcome.ok) return void (note.textContent = '');
      const res = o.outcome.result;
      note.textContent = [
        `Seed ${o.seed}. The hero could start at ${cellText(res.rect, res.entry)} and an exit at ${cellText(res.rect, res.exit)}; nothing is linked for you.`,
        ...res.notes,
      ].join(' ');
    }
    kindSel.addEventListener('change', () => ((kind = kindSel.value as GenKind), refresh()));
    areaSel.addEventListener('change', () => ((inSelection = areaSel.value === 'sel'), refresh()));
    seedIn.addEventListener('change', () => {
      const v = Math.floor(Number(seedIn.value));
      seed = Number.isFinite(v) && v >= 0 ? v >>> 0 : seed;
      seedIn.value = String(seed);
      refresh();
    });
    use.addEventListener('click', () => {
      const o = current[chosen];
      if (!o?.blocks) return;
      host.apply(o.blocks, `${kindInfo(kind).label} layout`);
      close(undefined);
    });
    const another = h(
      'button',
      {
        type: 'button',
        onclick: () => {
          seed = (seed + 4) >>> 0;
          seedIn.value = String(seed);
          refresh();
        },
      },
      'Four more',
    );
    refresh();
    return h(
      'div',
      { class: 'stack gen-dialog' },
      h(
        'div',
        { class: 'gen-row' },
        h('label', { class: 'field' }, h('span', null, 'Kind'), kindSel),
        h('label', { class: 'field' }, h('span', null, 'Where'), areaSel),
      ),
      blurb,
      h('div', { class: 'gen-row' }, h('label', { class: 'field' }, h('span', null, 'Seed'), seedIn), another),
      needs,
      grid,
      note,
      h('div', { class: 'toolbar' }, use, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel')),
    );
  });
}
