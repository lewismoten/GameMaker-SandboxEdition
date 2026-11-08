// Draws the disk labels' level strips only for labels on screen, one at a time and a task apart,
// in the order they came into view, so opening the disk box doesn't read every game's zip at once.

const waiting: (() => Promise<void>)[] = [];
let draining = false;

/** Draws the queued strips one at a time, a task apart (each is a zip to read and a picture to paint). */
async function drain(): Promise<void> {
  if (draining) return;
  draining = true;
  while (waiting.length) {
    await new Promise((r) => setTimeout(r, 0));
    await waiting.shift()!();
  }
  draining = false;
}

/** Calls `draw` once the strip is on screen, after the strips that came into view before it. */
export function whenShown(strip: Element, draw: () => Promise<void>): void {
  const queue = () => {
    waiting.push(async () => {
      if (strip.isConnected) await draw();
    });
    void drain();
  };
  if (typeof IntersectionObserver === 'undefined') return queue();
  const seen = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    seen.disconnect();
    queue();
  });
  seen.observe(strip);
}
