// The map editor's Generate dialog: choose a kind (dungeon, castle, forest, home or shop) and where (the whole map or the
// selection), see four real renders from a seed, pick one. The layouts only ever write ordinary cells,
// as one undo step. The dialog fits a 375 by 812 phone without scrolling: two rows of previews,
// and the Missing roles panel folds away when everything needed is set.
import { h, modal } from '../../../core/ui';
import type { Project } from '../../../core/project';
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { KINDS, MIN_SIDE, checkNeeds, kindInfo, type GenKind, type GenResult, type Rect } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { readRoles } from '../../blocks/blockRoles';
import { loadBrushes } from '../tools/brushStore';
import type { Terrain } from '../tools/autotile';
import type { MapSelection } from '../tools/selection';
import { missingRoles } from './missingRoles';
import { WHOLE, offers, usableMonsters, type Offer } from './place';
import { NOT_CHECKED } from './verifyOffer';
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
  /** The block set's blocks (for the reach check) and the scene's monsters (for placing some). */
  blockSet: () => Block[];
  monsters: () => Monster[];
  /** Puts the chosen layout into the map as one undo step; `withMonsters` is the result whose monsters to place too. */
  apply: (blocks: Uint8Array, what: string, withMonsters?: GenResult) => void;
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
  let kind: GenKind = KINDS.find((k) => checkNeeds(k.id, roles).ok)?.id ?? 'dungeon';
  let inSelection = canUseSel;
  let seed = Math.floor(Math.random() * 1e6);
  let chosen = 0;
  const monsterIds = usableMonsters(host.monsters());
  let addMonsters = monsterIds.length > 0;
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
      if (monRow) monRow.hidden = !n.ok;
      current = n.ok ? offers(host.blocks(), roles, terrains, kind, seed, r, { monsters: addMonsters ? monsterIds : undefined, bg: host.blockSet() }) : [];
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
              'aria-label': `Layout ${i + 1} ${o.check?.verified ? 'Verified' : 'Not proven'}, seed ${o.seed}`,
              onclick: () => {
                chosen = i;
                pick();
              },
            },
            c,
            h(
              'small',
              { class: 'gen-cap' },
              `Layout ${i + 1} `,
              h('span', { class: `gen-chip ${o.check?.verified ? 'ok' : 'warn'}` }, o.check?.verified ? 'Verified' : 'Not proven'),
            ),
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
      const furnished = res.furniture.length > 0 || kind === 'home' || kind === 'shop';
      const has = [
        res.furniture.filter((f) => !f.open).length ? `${res.furniture.filter((f) => !f.open).length} pieces of furniture` : '',
        res.shopkeeper !== undefined ? `shopkeeper could stand at ${cellText(res.rect, res.shopkeeper)}` : '',
        res.locks.length ? `${res.locks.length} locked door${res.locks.length > 1 ? 's' : ''}` : '',
        res.monsters.length ? `${res.monsters.length} monsters` : '',
      ].filter(Boolean);
      note.textContent = [
        `Seed ${o.seed}: hero could start at ${cellText(res.rect, res.entry)}, ${furnished ? 'door' : 'exit'} at ${cellText(res.rect, res.exit)}; nothing is linked.${has.length ? ` ${has.join(', ')}.` : ''}`,
        ...res.notes,
        o.check?.verified
          ? `Verified: ${furnished ? 'every open cell and piece of furniture can be reached from the door' : 'keys, treasure and exit can be reached in order'}. ${NOT_CHECKED}`
          : `Not proven: ${o.check?.problems.join(' ')} ${NOT_CHECKED}`,
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
      host.apply(o.blocks, `${kindInfo(kind).label} layout`, addMonsters && o.outcome.ok ? o.outcome.result : undefined);
      close(undefined);
    });
    const monBox = h('input', { type: 'checkbox', checked: addMonsters, 'aria-label': 'Add monsters' });
    monBox.addEventListener('change', () => ((addMonsters = monBox.checked), refresh()));
    const monRow = monsterIds.length ? h('label', { class: 'gen-check' }, monBox, h('span', null, 'Add monsters (replaces those in the area)')) : null;
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
      monRow,
      grid,
      note,
      h('div', { class: 'toolbar' }, use, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel')),
    );
  });
}
