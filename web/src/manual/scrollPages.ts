// The Scroll view's column (readView.ts): every page of a document stacked top to bottom in the
// viewer's scrolling stage, each with its number above it. A page is drawn only as it nears the
// view and let go of again once far off, keeping its place at its size (from its shape before it
// is first drawn), so a guide of a hundred pages scrolls as lightly as one. The page most in view
// is told to the viewer, for its "Page N of M" and its Chapters list.
import './readView.css';
import { h } from '../editor/core/ui';

export interface ScrollPagesOptions {
  /** The scrolling element the column sits in. */
  root: HTMLElement;
  count: number;
  /** A page's height over its width, for its place before it is drawn. */
  ratio(i: number): number;
  /** Draws page `i`, fresh, at the column's width. */
  page(i: number): HTMLElement;
  /** The words above page `i` ('Page 3'). */
  label(i: number): string;
  /** The page most in view changed as the reader scrolled (not on scrollTo). */
  showing(i: number): void;
}

export interface ScrollPages {
  el: HTMLElement;
  /** Scrolls page `i` to the top of the view. */
  scrollTo(i: number): void;
  dispose(): void;
}

/** The page most in view: the one showing the most of itself on screen (the first, on a tie). */
export function pageInView(visible: ReadonlyMap<number, number>): number | undefined {
  let best: number | undefined;
  let most = 0;
  for (const [i, px] of visible)
    if (px > 0 && (px > most || (px === most && i < best!))) {
      best = i;
      most = px;
    }
  return best;
}

/** How near (in screen heights) a page is drawn, and how far off it is let go of. */
const DRAW_AT = '150%';
const FREE_AT = '500%';

export function scrollPages(o: ScrollPagesOptions): ScrollPages {
  const holders: HTMLElement[] = [];
  const slots = Array.from({ length: o.count }, (_, i) => {
    const holder = h('div', { class: 'rv-page rv-empty', style: `aspect-ratio: 1 / ${o.ratio(i)}` });
    holders.push(holder);
    return h('div', { class: 'rv-slot', dataset: { page: String(i) } }, h('p', { class: 'rv-folio' }, o.label(i)), holder);
  });
  const el = h('div', { class: 'rv-column' }, ...slots);
  // the page in view: how much of each slot is on screen
  const visible = new Map<number, number>();
  let current = -1;
  // a page scrolled to stays the one shown until the reader scrolls away from where it put
  // the column (a short last page can't reach the top)
  let held: number | undefined;
  let heldTop = 0;
  const drawn = new Set<number>();
  // the page being read stays put while a page above it is drawn at a height its shape didn't
  // foretell (a phone's flowing magazine page)
  const keepPlace = (i: number, change: () => void) => {
    const was = holders[i].offsetHeight;
    change();
    const anchor = held ?? current;
    if (anchor >= 0 && i < anchor) {
      o.root.scrollTop += holders[i].offsetHeight - was;
      heldTop = o.root.scrollTop;
    }
  };
  const draw = (i: number) => {
    if (drawn.has(i)) return;
    drawn.add(i);
    const holder = holders[i];
    keepPlace(i, () => {
      holder.replaceChildren(o.page(i));
      holder.classList.remove('rv-empty');
      holder.style.aspectRatio = '';
    });
  };
  const free = (i: number) => {
    if (!drawn.has(i)) return;
    const holder = holders[i];
    const { width, height } = holder.getBoundingClientRect();
    if (!width || !height) return;
    drawn.delete(i);
    holder.replaceChildren();
    holder.classList.add('rv-empty');
    holder.style.aspectRatio = `${width} / ${height}`; // its own size, so nothing below it moves
  };
  const at = (e: IntersectionObserverEntry) => Number((e.target as HTMLElement).dataset.page);
  const near = new IntersectionObserver((list) => list.forEach((e) => e.isIntersecting && draw(at(e))), {
    root: o.root,
    rootMargin: `${DRAW_AT} 0px`,
  });
  const far = new IntersectionObserver((list) => list.forEach((e) => !e.isIntersecting && free(at(e))), {
    root: o.root,
    rootMargin: `${FREE_AT} 0px`,
  });
  const seen = new IntersectionObserver(
    (list) => {
      for (const e of list) {
        if (e.isIntersecting) visible.set(at(e), e.intersectionRect.height);
        else visible.delete(at(e));
      }
      const i = held !== undefined && visible.has(held) ? held : pageInView(visible);
      if (i !== undefined && i !== current) o.showing((current = i));
    },
    { root: o.root, threshold: Array.from({ length: 21 }, (_, k) => k / 20) },
  );
  for (const s of slots) (near.observe(s), far.observe(s), seen.observe(s));
  const letGo = () => {
    if (held !== undefined && Math.abs(o.root.scrollTop - heldTop) > 2) held = undefined;
  };
  o.root.addEventListener('scroll', letGo, { passive: true });

  return {
    el,
    scrollTo(i) {
      const slot = slots[Math.max(0, Math.min(o.count - 1, i))];
      if (!slot) return;
      held = Number(slot.dataset.page);
      const top = slot.getBoundingClientRect().top - o.root.getBoundingClientRect().top;
      o.root.scrollTop += top - parseFloat(getComputedStyle(o.root).paddingTop || '0');
      heldTop = o.root.scrollTop;
      current = held;
    },
    dispose() {
      near.disconnect();
      far.disconnect();
      seen.disconnect();
      o.root.removeEventListener('scroll', letGo);
    },
  };
}
