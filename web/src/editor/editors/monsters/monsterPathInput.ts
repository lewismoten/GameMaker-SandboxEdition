// Drawing a monster's path with the pointer and keys: click a block to add a corner, drag a
// corner to move it, click one to open its popup; the arrow keys pick a corner and change its
// speed, R and S turn and mirror its picture, Delete and Backspace remove, Space plays.
import { toast } from '../../core/ui';
import { MLEN, MWID } from '../../../formats/map';
import { MAXMARCH } from '../../../formats/monster';
import { addCorner, corners, firstCorner, mirrorOrient, moveCorner, pathLength, removeCorner, rotateOrient, type Corner } from './monsterPath';
import { MAX_SPEED } from './monsterPathView';
import { kind, mon, path, type PathEd } from './monsterPathState';
import { deleteSelected, hidePop, showPop } from './monsterPathCorner';
import { togglePlay } from './monsterPathToolbar';

export function pathInput(ed: PathEd): void {
  const { canvas, readout } = ed;

  function cellAt(e: PointerEvent | MouseEvent): { x: number; y: number } {
    const r = canvas.getBoundingClientRect();
    const b = ed.viewRect;
    const x = Math.floor(((e.clientX - r.left) / r.width) * b.w);
    const y = Math.floor(((e.clientY - r.top) / r.height) * b.h);
    return { x: Math.max(0, Math.min(b.w - 1, x)) + b.x0, y: Math.max(0, Math.min(b.h - 1, y)) + b.y0 };
  }

  function cornerAt(spot: { x: number; y: number }): Corner | undefined {
    const here = corners(path(ed), kind(ed)).filter((c) => c.x === spot.x && c.y === spot.y);
    if (!here.length) return undefined;
    // Several corners on one block: each click picks the next.
    const at = here.findIndex((c) => c.i === ed.selected);
    return here[(at + 1) % here.length];
  }

  let drag: { i: number; moved: boolean; added: boolean; from: { x: number; y: number } } | undefined;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (ed.tab === 1 && mon(ed).activate === 0) return;
    canvas.focus();
    hidePop(ed);
    const spot = cellAt(e);
    const hit = cornerAt(spot);
    if (hit) {
      ed.selected = hit.i;
      drag = { i: hit.i, moved: false, added: false, from: spot };
      ed.renderSide();
      ed.dirty = true;
    } else {
      const i = addCorner(path(ed), kind(ed), spot.x, spot.y);
      if (i < 0) {
        toast(`A path has at most ${MAXMARCH - firstCorner(kind(ed))} corners. Drag one to move it, or delete one first.`);
        return;
      }
      ed.selected = i;
      drag = { i, moved: false, added: true, from: spot };
      ed.changed();
    }
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    const spot = cellAt(e);
    const { hover, start } = ed;
    if (!hover || hover.x !== spot.x || hover.y !== spot.y) {
      ed.hover = spot;
      ed.dirty = true;
      const mx = (((start.x + spot.x) % MLEN) + MLEN) % MLEN;
      const my = (((start.y + spot.y) % MWID) + MWID) % MWID;
      readout.textContent = `${spot.x >= 0 ? '+' : ''}${spot.x}, ${spot.y >= 0 ? '+' : ''}${spot.y} blocks from ${kind(ed) === 'chase' ? 'the character' : 'the start'} · map block (${mx}, ${my})`;
    }
    if (!drag) return;
    if (spot.x === drag.from.x && spot.y === drag.from.y && !drag.moved) return;
    drag.moved = true;
    moveCorner(path(ed), kind(ed), drag.i, spot.x, spot.y);
    ed.changed(false);
  });

  const endDrag = (e: PointerEvent) => {
    if (!drag) return;
    const d = drag;
    drag = undefined;
    if (d.moved) ed.restartWalker();
    else if (!d.added) showPop(ed, d.i);
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => {
    ed.hover = undefined;
    ed.dirty = true;
  });

  canvas.addEventListener('keydown', (e) => {
    const list = corners(path(ed), kind(ed));
    const at = list.findIndex((c) => c.i === ed.selected);
    const cur = path(ed)[ed.selected];
    let handled = true;
    switch (e.key) {
      case 'Backspace':
        if (list.length) {
          removeCorner(path(ed), kind(ed), list[list.length - 1].i);
          ed.selected = Math.min(ed.selected, pathLength(path(ed)) - 1);
          ed.changed();
        }
        break;
      case 'Delete':
        if (at >= 0) deleteSelected(ed);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        if (list.length) ed.selected = list[(Math.max(0, at) + (e.key === 'ArrowLeft' ? list.length - 1 : 1)) % list.length].i;
        ed.renderSide();
        ed.dirty = true;
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        if (at >= 0) {
          cur.pic = Math.max(1, Math.min(MAX_SPEED, cur.pic + (e.key === 'ArrowUp' ? 1 : -1)));
          ed.changed();
        }
        break;
      case 'r':
      case 'R':
        if (at >= 0) ((cur.orient = rotateOrient(cur.orient)), ed.changed());
        break;
      case 's':
      case 'S':
        if (at >= 0) ((cur.orient = mirrorOrient(cur.orient)), ed.changed());
        break;
      case ' ':
        togglePlay(ed);
        break;
      case 'Escape':
        hidePop(ed);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  });
}
