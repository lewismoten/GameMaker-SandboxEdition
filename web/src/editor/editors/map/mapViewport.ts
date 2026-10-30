// A bounded or repeating map viewport. Only the visible window is repeated, never huge canvases.
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { h } from '../../core/ui';
import { nativeCell, tileOrigins, visibleCopy, wrapValue } from './mapWrap';
import type { Cell } from './tools/cellOps';

interface ViewportHost {
  scroller: HTMLElement;
  stack: HTMLElement;
  canvas: HTMLCanvasElement;
  overlay: HTMLCanvasElement;
  block(): number;
  moved(): void;
}

export function mapViewport(host: ViewportHost) {
  const { scroller, stack, canvas, overlay } = host;
  const picture = h('canvas');
  const surface = h('div', { style: 'position:relative;width:max-content' }, canvas, overlay);
  stack.replaceChildren(surface);
  let wrapped = false;
  let pending = 0;
  const periods = () => ({ w: MLEN * host.block(), h: MWID * host.block() });
  const phase = () => {
    const { w, h } = periods();
    return { x: wrapped ? wrapValue(scroller.scrollLeft, w) : scroller.scrollLeft, y: wrapped ? wrapValue(scroller.scrollTop, h) : scroller.scrollTop };
  };

  function render(): void {
    const { w, h } = periods();
    const width = wrapped ? Math.max(1, scroller.clientWidth) : w;
    const height = wrapped ? Math.max(1, scroller.clientHeight) : h;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const g = canvas.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, width, height);
    if (!wrapped) {
      if (picture.width && picture.height) g.drawImage(picture, 0, 0);
      return;
    }
    const { x, y } = phase();
    for (const top of tileOrigins(y, h, height))
      for (const left of tileOrigins(x, w, width)) {
        g.drawImage(picture, left, top);
        g.drawImage(overlay, left, top);
      }
  }

  function layout(): void {
    const { w, h } = periods();
    stack.style.width = `${wrapped ? 3 * w + scroller.clientWidth : w}px`;
    stack.style.height = `${wrapped ? 3 * h + scroller.clientHeight : h}px`;
    surface.style.position = wrapped ? 'sticky' : 'relative';
    surface.style.left = wrapped ? '0' : '';
    surface.style.top = wrapped ? '0' : '';
    surface.style.width = `${wrapped ? scroller.clientWidth : w}px`;
    surface.style.height = `${wrapped ? scroller.clientHeight : h}px`;
    overlay.hidden = wrapped;
    render();
  }

  function scroll(): void {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      if (wrapped) {
        const { w, h } = periods(),
          { x, y } = phase();
        if (scroller.scrollLeft < w || scroller.scrollLeft >= 2 * w) scroller.scrollLeft = w + x;
        if (scroller.scrollTop < h || scroller.scrollTop >= 2 * h) scroller.scrollTop = h + y;
        render();
        host.moved();
      }
    });
  }
  scroller.addEventListener('scroll', scroll, { passive: true });
  const resize = new ResizeObserver(() => {
    layout();
    host.moved();
  });
  resize.observe(scroller);

  function at(pointer = { x: scroller.clientWidth / 2, y: scroller.clientHeight / 2 }): Cell {
    const p = phase(),
      s = host.block();
    const cell = { x: (p.x + pointer.x) / s, y: (p.y + pointer.y) / s };
    return wrapped ? nativeCell(cell) : cell;
  }

  function goTo(cell: Cell, pointer = { x: scroller.clientWidth / 2, y: scroller.clientHeight / 2 }): void {
    const s = host.block(),
      { w, h } = periods();
    const left = cell.x * s - pointer.x,
      top = cell.y * s - pointer.y;
    scroller.scrollTo({ left: wrapped ? w + wrapValue(left, w) : left, top: wrapped ? h + wrapValue(top, h) : top });
    render();
    host.moved();
  }

  return {
    picture,
    render,
    layout,
    at,
    goTo,
    get wrapped() {
      return wrapped;
    },
    setWrapped(on: boolean): void {
      if (on === wrapped) return;
      const center = at();
      wrapped = on;
      layout();
      goTo(center);
    },
    cell(e: { clientX: number; clientY: number }): Cell {
      if (!wrapped) {
        const r = canvas.getBoundingClientRect();
        return {
          x: Math.max(0, Math.min(MLEN - 1, Math.floor((e.clientX - r.left) / host.block()))),
          y: Math.max(0, Math.min(MWID - 1, Math.floor((e.clientY - r.top) / host.block()))),
        };
      }
      const r = canvas.getBoundingClientRect();
      const p = at({ x: e.clientX - r.left, y: e.clientY - r.top });
      return { x: Math.floor(p.x), y: Math.floor(p.y) };
    },
    point(cell: Cell): Cell {
      if (!wrapped) return cell;
      const s = host.block(),
        { w, h } = periods(),
        p = phase();
      return {
        x: visibleCopy((cell.x + 0.5) * s, p.x, w, scroller.clientWidth) / s - 0.5,
        y: visibleCopy((cell.y + 0.5) * s, p.y, h, scroller.clientHeight) / s - 0.5,
      };
    },
    dispose(): void {
      cancelAnimationFrame(pending);
      resize.disconnect();
      scroller.removeEventListener('scroll', scroll);
    },
  };
}
