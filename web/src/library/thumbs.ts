// The Library cards' pictures: each piece's first sheet, drawn only while its card is near the
// window, one at a time, and kept for the visit (switching the sort or coming back to the page
// draws nothing again). Between pictures the page gets the browser back (scheduler.yield, else a
// zero timeout), so a click or a choice in a list is never kept waiting behind them; a card that
// scrolls away, or is gone because the list changed, is skipped when its turn comes. Like the
// desk's "In the box" list, a sheet is laid out at a readable width and shrunk, so pieces sized
// in pixels look as they do full size. A card with no picture, or one that fails, keeps its icon.
import type { Sheet } from '../manual/printables/kit';

/** The width a sheet is laid out at before it is shrunk into its card (a sheet may name its own, data-layout). */
const LAYOUT = 480;

const drawn = new Map<string, Promise<Sheet | undefined>>();

/** Frames near the window, waiting their turn, in the order they came near it. */
const waiting = new Map<HTMLElement, () => Promise<void>>();
let busy = false;

/** Lets the browser handle input and paint before more work. */
function yieldToBrowser(): Promise<void> {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  return s?.yield ? s.yield() : new Promise((r) => setTimeout(r, 0));
}

async function pump(): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    for (;;) {
      await yieldToBrowser();
      const next = waiting.entries().next();
      if (next.done) return;
      const [frame, job] = next.value;
      waiting.delete(frame);
      if (frame.isConnected) await job();
    }
  } finally {
    busy = false;
  }
}

function draw(key: string, make: () => Promise<Sheet | undefined>): Promise<Sheet | undefined> {
  let p = drawn.get(key);
  if (!p) {
    p = make().catch(() => undefined);
    drawn.set(key, p);
  }
  return p;
}

/** Puts the sheet into its frame, shrunk to fit and centered. */
function place(frame: HTMLElement, s: Sheet): void {
  const fw = frame.clientWidth;
  const fh = frame.clientHeight;
  if (!fw || !fh) return;
  const own = Number(s.el.dataset.layout);
  const layout = own || LAYOUT;
  const scale = Math.min(fw / layout, fh / ((layout * s.h) / s.w));
  if (!own) s.el.style.width = `${LAYOUT}px`;
  s.el.inert = true; // a picture of the piece: nothing in it to reach
  const shrunk = frame.ownerDocument.createElement('span');
  shrunk.className = 'lib-shrunk';
  shrunk.style.transform = `translate(-50%, -50%) scale(${scale})`;
  shrunk.append(s.el);
  frame.replaceChildren(shrunk);
  frame.classList.add('drawn');
}

let watcher: IntersectionObserver | undefined;
const jobs = new WeakMap<Element, () => Promise<void>>();

/** Draws `make`'s sheet into `frame` while the frame is near the window. */
export function lazyThumb(frame: HTMLElement, key: string, make: () => Promise<Sheet | undefined>): void {
  watcher ??= new IntersectionObserver(
    (seen) => {
      for (const e of seen) {
        const el = e.target as HTMLElement;
        const job = jobs.get(el);
        if (!job) continue;
        // near the window: in line for its turn; gone from it before then: out of line again
        if (e.isIntersecting && el.isConnected) waiting.set(el, job);
        else waiting.delete(el);
      }
      if (waiting.size) void pump();
    },
    { rootMargin: '200px 0px' },
  );
  jobs.set(frame, async () => {
    const s = await draw(key, make);
    if (s && frame.isConnected) {
      place(frame, s);
      watcher!.unobserve(frame);
      jobs.delete(frame);
    }
  });
  watcher.observe(frame);
}

/** Lets go of every frame of a list that has been replaced (the sort or a picker changed). */
export function forgetThumbs(frames: Iterable<Element>): void {
  for (const f of frames) {
    watcher?.unobserve(f);
    waiting.delete(f as HTMLElement);
    jobs.delete(f);
  }
}
