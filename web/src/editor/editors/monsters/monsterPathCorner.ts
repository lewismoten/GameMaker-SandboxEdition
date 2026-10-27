// One corner of a monster's path: the monster's picture in each orientation, the picture and
// speed controls (in the popup on the map and the side panel), and adding or deleting a corner.
import { h, clear, toast } from '../../core/ui';
import { paintBlock } from '../../core/draw';
import { BLEN, MONBL } from '../../../formats/blocks';
import { MAXMARCH } from '../../../formats/monster';
import { corners, firstCorner, insertCorner, removeCorner } from './monsterPath';
import { MAX_SPEED, ORIENTS } from './monsterPathView';
import { kind, mon, path, type PathEd } from './monsterPathState';

/** A monster picture turned to `orient`, drawn once and kept. */
export function sprite(ed: PathEd, pic: number, orient: number): HTMLCanvasElement | undefined {
  const blocks = ed.o.mblk();
  if (pic < 0 || pic >= MONBL || !blocks[pic]) return undefined;
  const key = `${pic}:${orient}`;
  let c = ed.spriteCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    paintBlock(c, blocks[pic].pixels, ed.o.palette(), { transparent: true, orient });
    ed.spriteCache.set(key, c);
  }
  return c;
}

/** The monster's first picture (the one shown at each corner), or -1. */
export const firstPic = (ed: PathEd) => {
  const p = mon(ed).pic[0][0];
  return p >= 0 && p < MONBL ? p : -1;
};

export function pictureCanvas(ed: PathEd, orient: number, size = 40): HTMLCanvasElement {
  const c = h('canvas', { class: 'pixel checker', width: BLEN, height: BLEN, style: `width:${size}px;height:${size}px` });
  const s = sprite(ed, firstPic(ed), orient);
  if (s) c.getContext('2d')!.drawImage(s, 0, 0);
  return c;
}

export function orientPicker(ed: PathEd, i: number, after?: () => void): HTMLElement {
  const c = path(ed)[i];
  return h(
    'div',
    { class: 'mpath-orients', role: 'radiogroup', 'aria-label': 'Picture while heading to this corner' },
    ...ORIENTS.map(([v, label]) =>
      h(
        'button',
        {
          class: c.orient === v ? 'selected' : '',
          title: label,
          role: 'radio',
          'aria-checked': String(c.orient === v),
          onclick: () => {
            c.orient = v;
            ed.changed();
            after?.();
          },
        },
        pictureCanvas(ed, v, 32),
      ),
    ),
  );
}

export function speedControl(ed: PathEd, i: number): HTMLElement {
  const c = path(ed)[i];
  const out = h('output', null, String(c.pic));
  const range = h('input', { type: 'range', min: 1, max: Math.max(MAX_SPEED, c.pic), value: String(c.pic), 'aria-label': 'Speed in pixels per tick' });
  range.addEventListener('input', () => {
    c.pic = Number(range.value);
    out.textContent = range.value;
    ed.o.onEdit();
    ed.restartWalker();
    ed.renderNumbers();
  });
  return h('label', { class: 'mpath-speed' }, h('span', null, 'Speed'), range, out, h('small', null, 'pixels per tick'));
}

/** The picture and speed popup beside a corner on the map. */
export function showPop(ed: PathEd, i: number): void {
  const { pop } = ed;
  const list = corners(path(ed), kind(ed));
  const c = list.find((x) => x.i === i);
  if (!c) return;
  const b = ed.viewRect;
  const left = ((c.x - b.x0 + 1) / b.w) * 100;
  const top = ((c.y - b.y0 + 1) / b.h) * 100;
  clear(
    pop,
    h(
      'div',
      { class: 'mpath-pop-head' },
      h('strong', null, `Corner ${list.indexOf(c) + 1}`),
      h('button', { class: 'modal-close', 'aria-label': 'Close', onclick: () => hidePop(ed) }, '×'),
    ),
    h('div', { class: 'meta' }, 'Picture on the way here'),
    orientPicker(ed, i, () => showPop(ed, i)),
    speedControl(ed, i),
    h(
      'div',
      { class: 'mpath-pop-actions' },
      h('button', { onclick: () => (insertHere(ed, i), hidePop(ed)) }, '+ Corner before'),
      h('button', { class: 'danger', onclick: () => deleteSelected(ed) }, 'Delete'),
    ),
  );
  pop.hidden = false;
  pop.style.left = left > 60 ? '' : `${left}%`;
  pop.style.right = left > 60 ? `${100 - left + 100 / b.w}%` : '';
  pop.style.top = top > 55 ? '' : `${top}%`;
  pop.style.bottom = top > 55 ? `${100 - top + 100 / b.h}%` : '';
}

export function hidePop(ed: PathEd): void {
  ed.pop.hidden = true;
}

export function deleteSelected(ed: PathEd): void {
  const list = corners(path(ed), kind(ed));
  const at = list.findIndex((c) => c.i === ed.selected);
  if (at < 0) return;
  removeCorner(path(ed), kind(ed), ed.selected);
  const left = corners(path(ed), kind(ed));
  ed.selected = left.length ? left[Math.min(at, left.length - 1)].i : -1;
  hidePop(ed);
  ed.changed();
}

/** A new corner before corner `i`. */
export function insertHere(ed: PathEd, i: number): void {
  const n = insertCorner(path(ed), kind(ed), i);
  if (n < 0) toast(`A path has at most ${MAXMARCH - firstCorner(kind(ed))} corners.`);
  else {
    ed.selected = n;
    ed.changed();
  }
}
