// Keeping a long background job out of the way of a person using the page.
// The box's pictures (stickers, level maps, the world map) are drawn right after it opens, and a press of
// Escape used to wait behind a drawing of a second or more at a 4x slowdown.

/** Gives the browser back between slices of a long job (scheduler.yield, else a zero timeout), so a key or
 * click that came in meanwhile is handled before the next slice instead of after the whole job. */
export function yieldNow(): Promise<void> {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  return s?.yield ? s.yield() : new Promise((r) => setTimeout(r, 0));
}

let lastInput = -Infinity;
let watching = false;

function watchInput(): void {
  if (watching || typeof window === 'undefined') return;
  watching = true;
  for (const type of ['keydown', 'pointerdown', 'wheel', 'touchstart'])
    window.addEventListener(type, () => (lastInput = performance.now()), { capture: true, passive: true });
}

/** Resolves once no key, press or wheel has come in for `ms`, then the browser is idle. The first call counts as
 * an input (the click that opened the box was one), so pictures wait out the person's first moves. */
export async function whenQuiet(ms = 1200): Promise<void> {
  if (!watching) lastInput = performance.now();
  watchInput();
  for (let wait = ms - (performance.now() - lastInput); wait > 0; wait = ms - (performance.now() - lastInput)) await new Promise((r) => setTimeout(r, wait));
  await new Promise<void>((r) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => r(), { timeout: 1000 }) : setTimeout(r, 0)));
}
