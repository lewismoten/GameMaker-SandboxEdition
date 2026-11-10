// Home's real demo (including its file inspection) waits for a painted, visible picture and
// an idle browser. Interaction can start sooner; data-saving visitors must click Watch demo.
export const mayStartHomeDemo = (): boolean =>
  !document.documentElement.classList.contains('tour-on') &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !matchMedia('(prefers-reduced-data: reduce)').matches &&
  !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

/** Returns cleanup for a replaced game or page. Rechecks visibility and preferences at startup. */
export function deferHomeDemo(el: Element, picture: Promise<unknown>, allowed: () => boolean, start: () => void): () => void {
  let ended = false;
  let seen = false;
  let painted = false;
  let frame = 0;
  let timer = 0;
  let idle: number | undefined;
  const cancelPending = () => {
    clearTimeout(timer);
    if (idle !== undefined) window.cancelIdleCallback(idle);
    idle = undefined;
  };
  const cleanup = () => {
    ended = true;
    cancelPending();
    cancelAnimationFrame(frame);
    observer.disconnect();
    for (const event of ['pointerenter', 'pointerdown', 'focusin']) el.removeEventListener(event, interest);
    document.removeEventListener('visibilitychange', schedule);
  };
  const go = () => {
    if (ended || !el.isConnected || document.hidden || !allowed()) return;
    cleanup();
    start();
  };
  const interest = () => go();
  const schedule = () => {
    cancelPending();
    if (ended || !painted || !seen || document.hidden || !allowed()) return;
    timer = window.setTimeout(() => {
      const run = () => {
        if (seen) go();
      };
      if (window.requestIdleCallback) idle = window.requestIdleCallback(run, { timeout: 3000 });
      else run();
    }, 2500);
  };
  const observer = new IntersectionObserver((entries) => {
    seen = entries.some((entry) => entry.isIntersecting);
    schedule();
  });
  observer.observe(el);
  for (const event of ['pointerenter', 'pointerdown', 'focusin']) el.addEventListener(event, interest);
  document.addEventListener('visibilitychange', schedule);
  void picture
    .catch(() => undefined)
    .then(() => {
      if (ended) return;
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          painted = true;
          schedule();
        });
      });
    });
  return cleanup;
}
