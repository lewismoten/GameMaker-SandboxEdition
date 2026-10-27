// How big a document's pages are shown (readView.ts's views): fitted to the viewer's width (a
// Scroll's own size, and every phone's), a whole page fitted to its height (Pages' own size), the
// page's printed size at 96 CSS pixels an inch (100%), or zoomed in steps from 10% to 300%. The
// bar's size control (sizeControl) picks one, as do Ctrl or Cmd with + and −, Ctrl with the wheel,
// and a pinch (pinchZoom). The choice is kept per browser, beside the view's.
import { h } from '../editor/core/ui';

/** Fit the width, fit a whole page, or a percent of the printed size. */
export type ReadSize = 'width' | 'page' | number;

const KEY = 'gm-read-size';

/** The zoom steps, as percents of the printed size. */
export const STEPS = [10, 15, 25, 33, 50, 67, 75, 90, 100, 110, 125, 150, 175, 200, 250, 300];
const LEAST = STEPS[0];
const MOST = STEPS.at(-1)!;

/** A kept size, or undefined for none (or one not understood). */
export function sizeFrom(saved: string | null | undefined): ReadSize | undefined {
  if (saved === 'width' || saved === 'page') return saved;
  const n = Number(saved);
  return saved && Number.isFinite(n) && n >= LEAST && n <= MOST ? Math.round(n) : undefined;
}

/** The size this browser chose, or undefined (each view then has its own). */
export function readSize(): ReadSize | undefined {
  try {
    return sizeFrom(localStorage.getItem(KEY));
  } catch {
    return undefined;
  }
}

function rememberSize(size: ReadSize): void {
  try {
    localStorage.setItem(KEY, String(size));
  } catch {
    /* no storage: chosen for this document only */
  }
}

/** What fits: the room the page has, its width at 100% and its height over its width. */
export interface Room {
  viewW: number;
  viewH: number;
  /** Its width at its printed size, in CSS pixels. */
  natural: number;
  ratio: number;
  /** The widest Fit width goes, so lines stay a reading length (none: the view's width). */
  most?: number;
}

/** A page's width in CSS pixels at `size`. */
export function widthAt(size: ReadSize, r: Room): number {
  const fitW = Math.min(r.viewW, r.most ?? Infinity);
  const w = size === 'width' ? fitW : size === 'page' ? Math.min(r.viewW, r.viewH / r.ratio) : (r.natural * size) / 100;
  return Math.max(80, Math.round(w));
}

/** The percent of the printed size a width is. */
export const percentOf = (width: number, natural: number) => Math.round((100 * width) / natural);

/** The next zoom step in or out from `percent` (kept between 10% and 300%). */
export function stepFrom(percent: number, dir: 1 | -1): number {
  if (dir > 0) return STEPS.find((s) => s > percent + 0.5) ?? MOST;
  return [...STEPS].reverse().find((s) => s < percent - 0.5) ?? LEAST;
}

/** A pinch's or a wheel's zoom, as a whole percent kept between 10% and 300%. */
export const clampPercent = (percent: number) => Math.round(Math.max(LEAST, Math.min(MOST, percent)));

/** The bar's −, size list and +. `pick` hears the new size (already remembered); `shown` the percent now shown. */
export function sizeControl(start: ReadSize, pick: (size: ReadSize) => void) {
  let size = start;
  let percent = 100;
  const select = h('select', { class: 'rv-size', 'aria-label': 'Page size', title: 'Page size' });
  const option = (value: string, label: string) => h('option', { value }, label);
  const fitW = option('width', 'Fit width');
  const fitP = option('page', 'Fit page');
  const other = option('other', '');
  select.append(fitW, fitP, ...STEPS.map((s) => option(String(s), s === 100 ? 'Actual size (100%)' : `${s}%`)), other);
  const choose = (next: ReadSize) => {
    set(next);
    rememberSize(next);
    pick(next);
  };
  select.addEventListener('change', () => choose(sizeFrom(select.value) ?? 'width'));
  const out = h('button', { type: 'button', class: 'rv-zoom', 'aria-label': 'Zoom out', title: 'Zoom out (Ctrl −)', onclick: () => zoom(-1) }, '−');
  const inn = h('button', { type: 'button', class: 'rv-zoom', 'aria-label': 'Zoom in', title: 'Zoom in (Ctrl +)', onclick: () => zoom(1) }, '+');
  const zoom = (dir: 1 | -1) => choose(stepFrom(percent, dir));
  const show = () => {
    fitW.textContent = size === 'width' ? `Fit width (${percent}%)` : 'Fit width';
    fitP.textContent = size === 'page' ? `Fit page (${percent}%)` : 'Fit page';
    const odd = typeof size === 'number' && !STEPS.includes(size);
    other.hidden = !odd;
    other.textContent = odd ? `${size}%` : '';
    select.value = odd ? 'other' : String(size);
    out.disabled = percent <= LEAST;
    inn.disabled = percent >= MOST;
  };
  const set = (next: ReadSize) => {
    size = next;
    if (typeof next === 'number') percent = next;
    show();
  };
  set(start);
  return {
    el: h('span', { class: 'rv-sizes', role: 'group', 'aria-label': 'Page size' }, out, select, inn),
    get size() {
      return size;
    },
    set,
    /** The percent of the printed size the page in view is shown at. */
    shown(p: number) {
      percent = p;
      show();
    },
    zoom,
    choose,
    /** To a percent (a pinch, Ctrl and the wheel). */
    to: (p: number) => choose(clampPercent(p)),
  };
}

export type SizeControl = ReturnType<typeof sizeControl>;

/** Ctrl or Cmd with +, − or 0: zooms the pages rather than the browser. True when it was one. */
export function zoomKey(e: KeyboardEvent, c: SizeControl, reset: ReadSize): boolean {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return false;
  if (e.key === '+' || e.key === '=') c.zoom(1);
  else if (e.key === '-' || e.key === '_') c.zoom(-1);
  else if (e.key === '0') c.choose(reset);
  else return false;
  e.preventDefault();
  return true;
}

/**
 * Ctrl with the wheel and a two-finger pinch on `stage` zoom the pages. While pinching, `preview`
 * is scaled as a picture; on letting go the size is set (`percent` is the one shown now).
 */
export function pinchZoom(stage: HTMLElement, c: SizeControl, percent: () => number, preview: () => HTMLElement | undefined): () => void {
  let start = 0;
  let scale = 1;
  const gap = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const onStart = (e: TouchEvent) => {
    if (e.touches.length !== 2) return;
    start = gap(e.touches);
    scale = 1;
    const el = preview();
    if (el) {
      const mid = (e.touches[0].clientY + e.touches[1].clientY) / 2 - el.getBoundingClientRect().top;
      el.style.transformOrigin = `50% ${mid}px`;
    }
  };
  const onMove = (e: TouchEvent) => {
    if (!start || e.touches.length !== 2) return;
    e.preventDefault();
    scale = gap(e.touches) / start;
    const el = preview();
    if (el) el.style.transform = `scale(${scale})`;
  };
  const onEnd = () => {
    if (!start) return;
    start = 0;
    const el = preview();
    if (el) el.style.transform = '';
    if (Math.abs(scale - 1) > 0.04) c.to(percent() * scale);
  };
  // a trackpad's pinch comes as Ctrl and many small wheel turns: a step for each notch's worth
  let turned = 0;
  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    turned += e.deltaY;
    if (Math.abs(turned) < 50) return;
    c.zoom(turned < 0 ? 1 : -1);
    turned = 0;
  };
  stage.addEventListener('touchstart', onStart, { passive: true });
  stage.addEventListener('touchmove', onMove, { passive: false });
  stage.addEventListener('touchend', onEnd);
  stage.addEventListener('touchcancel', onEnd);
  stage.addEventListener('wheel', onWheel, { passive: false });
  return () => {
    stage.removeEventListener('touchstart', onStart);
    stage.removeEventListener('touchmove', onMove);
    stage.removeEventListener('touchend', onEnd);
    stage.removeEventListener('touchcancel', onEnd);
    stage.removeEventListener('wheel', onWheel);
  };
}
