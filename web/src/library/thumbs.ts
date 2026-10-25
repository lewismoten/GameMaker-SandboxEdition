// The Library cards' pictures: each piece's first sheet, drawn only when its card scrolls into
// view, one at a time, and kept for the visit (switching the sort or coming back to the page
// draws nothing again). Like the desk's "In the box" list, a sheet is laid out at a readable
// width and shrunk, so pieces sized in pixels look as they do full size. A card with no picture,
// or one that fails, keeps its icon.
import type { Sheet } from '../manual/printables/kit';

/** The width a sheet is laid out at before it is shrunk into its card. */
const LAYOUT = 480;

const drawn = new Map<string, Promise<Sheet | undefined>>();
const queue: (() => Promise<void>)[] = [];
let busy = false;

async function pump(): Promise<void> {
  if (busy) return;
  busy = true;
  while (queue.length) await queue.shift()!();
  busy = false;
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
  const scale = Math.min(fw / LAYOUT, fh / ((LAYOUT * s.h) / s.w));
  s.el.style.width = `${LAYOUT}px`;
  s.el.inert = true; // a picture of the piece: nothing in it to reach
  const shrunk = frame.ownerDocument.createElement('span');
  shrunk.className = 'lib-shrunk';
  shrunk.style.transform = `translate(-50%, -50%) scale(${scale})`;
  shrunk.append(s.el);
  frame.replaceChildren(shrunk);
  frame.classList.add('drawn');
}

let watcher: IntersectionObserver | undefined;
const pending = new WeakMap<Element, () => void>();

/** Draws `make`'s sheet into `frame` once the frame comes near the window. */
export function lazyThumb(frame: HTMLElement, key: string, make: () => Promise<Sheet | undefined>): void {
  watcher ??= new IntersectionObserver(
    (seen) => {
      for (const e of seen) {
        if (!e.isIntersecting) continue;
        watcher!.unobserve(e.target);
        pending.get(e.target)?.();
        pending.delete(e.target);
      }
    },
    { rootMargin: '200px 0px' },
  );
  pending.set(frame, () => {
    queue.push(async () => {
      if (!frame.isConnected) return; // the page moved on before its turn
      const s = await draw(key, make);
      if (s && frame.isConnected) place(frame, s);
    });
    void pump();
  });
  watcher.observe(frame);
}
