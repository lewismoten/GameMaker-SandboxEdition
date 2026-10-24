// The slide show editor's pointer and keys: dragging media from the bin onto the timeline,
// clips along it (or back onto the bin to remove them), a clip's edge to set its seconds,
// a tap to select or add, and the arrow, Delete and Enter keys on the timeline. slideShow.ts
// owns the list and the drawing; this reads and changes them through a TimelineInput.
import { h, toast } from '../../core/ui';
import type { SlideEntry } from '../../../formats/graphicScripts';
import { clipWidth, moveEntry, secondsForWidth, type ClipFacts, type ClipTiming } from './slideTimeline';

/** What the timeline's pointer and keys need from the slide show editor. */
export interface TimelineInput {
  /** The editor's element: marked while something is being dragged. */
  host: HTMLElement;
  /** The scrolling timeline, its lane of clips and the drop marker. */
  track: HTMLElement;
  lane: HTMLElement;
  marker: HTMLElement;
  /** The media bin's grid, and the whole bin box (a clip dropped on it is removed). */
  bin: HTMLElement;
  binBox(): HTMLElement;
  /** The clips' elements, in order (kept up to date by the editor). */
  clipEls: HTMLElement[];
  entries(): SlideEntry[];
  selected(): number;
  /** Zoom: pixels a second. */
  pps(): number;
  /** Width of a clip that is a whole thumbnail. */
  thumbWidth: number;
  timing(e: SlideEntry): ClipTiming;
  facts(name: string): ClipFacts;
  badgeText(e: SlideEntry, t: ClipTiming): string;
  select(i: number, scroll?: boolean): void;
  insert(name: string, at: number): void;
  remove(i: number): void;
  commit(next: SlideEntry[], sel?: number): void;
  play(from: number): void;
  save(): void;
  renderLane(): void;
  renderInspector(): void;
}

/** Listens for dragging, taps and keys on the timeline and the media bin. `dragging()` is true while something is being dragged. */
export function timelineInput(ctx: TimelineInput): { dragging(): boolean } {
  type Drag = { from: 'media'; name: string } | { from: 'clip'; index: number };
  let pending: { drag: Drag; x: number; y: number; el: HTMLElement; id: number } | undefined;
  let dragging: { drag: Drag; ghost: HTMLElement; at: number } | undefined;

  const dropIndex = (x: number, y: number): number => {
    const r = ctx.track.getBoundingClientRect();
    if (y < r.top - 50 || y > r.bottom + 50 || x < r.left - 20 || x > r.right + 20) return -1;
    for (let i = 0; i < ctx.clipEls.length; i++) {
      const c = ctx.clipEls[i].getBoundingClientRect();
      if (x < c.left + c.width / 2) return i;
    }
    return ctx.entries().length;
  };
  const showMarker = (at: number) => {
    if (at < 0) {
      ctx.marker.hidden = true;
      return;
    }
    const lr = ctx.track.getBoundingClientRect();
    const ref = ctx.clipEls[at]?.getBoundingClientRect();
    const last = ctx.clipEls[ctx.clipEls.length - 1]?.getBoundingClientRect();
    const x = ref ? ref.left - 4 : last ? last.right + 18 : lr.left + 16;
    ctx.marker.hidden = false;
    ctx.marker.style.left = `${x - lr.left + ctx.track.scrollLeft}px`;
  };

  const startDrag = (p: NonNullable<typeof pending>) => {
    const src = p.el.querySelector('img') ?? p.el;
    const ghost = h('div', { class: 'sl-ghost' });
    const bg = src instanceof HTMLImageElement ? src.src : (p.el.style.backgroundImage.match(/url\("?(.*?)"?\)/)?.[1] ?? '');
    if (bg) ghost.style.backgroundImage = `url(${bg})`;
    ghost.textContent = p.drag.from === 'media' ? p.drag.name.toUpperCase() : ctx.entries()[p.drag.index].name.toUpperCase();
    document.body.append(ghost);
    if (p.drag.from === 'clip') ctx.clipEls[p.drag.index]?.classList.add('lifted');
    dragging = { drag: p.drag, ghost, at: -1 };
    ctx.host.classList.add('sl-dragging');
  };

  const onDown = (ev: PointerEvent) => {
    if (ev.button !== 0) return;
    const target = ev.target as HTMLElement;
    const handle = target.closest<HTMLElement>('.sl-handle');
    const clip = target.closest<HTMLElement>('.sl-clip');
    if (handle && clip) return resizeStart(ev, clip, handle.dataset.side === 'left');
    const media = target.closest<HTMLElement>('.sl-media');
    const el = clip ?? media;
    if (!el) return;
    ev.preventDefault();
    el.setPointerCapture(ev.pointerId);
    pending = {
      drag: clip ? { from: 'clip', index: Number(clip.dataset.index) } : { from: 'media', name: media!.dataset.name! },
      x: ev.clientX,
      y: ev.clientY,
      el,
      id: ev.pointerId,
    };
  };
  const onMove = (ev: PointerEvent) => {
    if (pending && !dragging && Math.hypot(ev.clientX - pending.x, ev.clientY - pending.y) > 5) startDrag(pending);
    if (!dragging) return;
    dragging.ghost.style.transform = `translate(${ev.clientX + 8}px, ${ev.clientY + 8}px)`;
    dragging.at = dropIndex(ev.clientX, ev.clientY);
    showMarker(dragging.at);
    // scroll the timeline near its ends
    const r = ctx.track.getBoundingClientRect();
    if (dragging.at >= 0) {
      if (ev.clientX < r.left + 40) ctx.track.scrollLeft -= 12;
      else if (ev.clientX > r.right - 40) ctx.track.scrollLeft += 12;
    }
    const overBin = ctx.binBox().contains(document.elementFromPoint(ev.clientX, ev.clientY));
    dragging.ghost.classList.toggle('removing', dragging.drag.from === 'clip' && overBin);
  };
  const onUp = (ev: PointerEvent) => {
    const p = pending;
    const d = dragging;
    pending = undefined;
    dragging = undefined;
    ctx.marker.hidden = true;
    ctx.host.classList.remove('sl-dragging');
    if (!p) return;
    if (!d) {
      // a tap
      if (p.drag.from === 'clip') ctx.select(p.drag.index);
      else ctx.insert(p.drag.name, ctx.selected() + 1);
      return;
    }
    d.ghost.remove();
    ctx.clipEls.forEach((c) => c.classList.remove('lifted'));
    const overBin = ctx.binBox().contains(document.elementFromPoint(ev.clientX, ev.clientY));
    if (d.drag.from === 'clip' && overBin) return ctx.remove(d.drag.index);
    if (d.at < 0) return;
    if (d.drag.from === 'media') ctx.insert(d.drag.name, d.at);
    else if (d.at !== d.drag.index && d.at !== d.drag.index + 1)
      ctx.commit(moveEntry(ctx.entries(), d.drag.index, d.at), d.at > d.drag.index ? d.at - 1 : d.at);
  };

  /** Dragging a clip's edge: its seconds follow the width. */
  const resizeStart = (ev: PointerEvent, clip: HTMLElement, left: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    const i = Number(clip.dataset.index);
    const e = ctx.entries()[i];
    const t0 = ctx.timing(e);
    if (t0.ignored) return toast('A slide show inside a slide show keeps its own timing.');
    if (!ctx.facts(e.name).exists) return;
    clip.setPointerCapture(ev.pointerId);
    ctx.select(i, false);
    const startW = clip.getBoundingClientRect().width;
    const startX = ev.clientX;
    let lastW = startW;
    clip.classList.add('resizing');
    const move = (m: PointerEvent) => {
      const dx = m.clientX - startX;
      const want = Math.max(20, startW + (left ? -dx : dx));
      e.pause = secondsForWidth(want, { ...t0, then: 'seconds' }, ctx.pps());
      const t = ctx.timing(e);
      const w = clipWidth(t, ctx.pps(), ctx.thumbWidth);
      clip.style.width = `${w}px`;
      clip.classList.add('timed');
      // growing to the left: keep the left edge under the pointer
      if (left) ctx.track.scrollLeft += w - lastW;
      lastW = w;
      const badge = clip.querySelector('.sl-badge') ?? clip.appendChild(h('span', { class: 'sl-badge' }));
      badge.textContent = ctx.badgeText(e, t);
    };
    const up = () => {
      clip.removeEventListener('pointermove', move);
      clip.removeEventListener('pointerup', up);
      clip.removeEventListener('pointercancel', up);
      clip.classList.remove('resizing');
      ctx.save();
      ctx.renderLane();
      ctx.renderInspector();
    };
    clip.addEventListener('pointermove', move);
    clip.addEventListener('pointerup', up);
    clip.addEventListener('pointercancel', up);
  };

  for (const el of [ctx.lane, ctx.bin]) {
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  }
  ctx.bin.addEventListener('keydown', (ev) => {
    const m = (ev.target as HTMLElement).closest<HTMLElement>('.sl-media');
    if (m && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      ctx.insert(m.dataset.name!, ctx.selected() + 1);
    }
  });
  ctx.track.addEventListener('keydown', (ev) => {
    if (!ctx.entries().length) return;
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      ev.preventDefault();
      const d = ev.key === 'ArrowLeft' ? -1 : 1;
      const to = Math.max(0, Math.min(ctx.entries().length - 1, ctx.selected() + d));
      if (ev.altKey && to !== ctx.selected()) ctx.commit(moveEntry(ctx.entries(), ctx.selected(), d < 0 ? to : to + 1), to);
      else ctx.select(to);
    } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      ctx.remove(ctx.selected());
    } else if (ev.key === 'Enter') ctx.play(ctx.selected());
  });

  return { dragging: () => !!dragging };
}
