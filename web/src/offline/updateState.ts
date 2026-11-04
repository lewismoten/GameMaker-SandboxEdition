// The new version waiting for a Reload, shared by the notice (offline.ts) and the Settings menu's
// "New version ready" item (settingsMenu.ts), so pressing Later or the notice fading never loses it.
// It holds and fades the notice too: a game playing in a play page is never covered by it.

/** Seconds a shown notice stays before it fades out. */
export const NOTICE_FADE_MS = 15_000;

type Listener = (reload: (() => void) | undefined) => void;
let reload: (() => void) | undefined;
const listeners = new Set<Listener>();

/** An update is waiting; `doReload` brings it in (it asks the waiting version to take over, then reloads). */
export function setPendingUpdate(doReload: (() => void) | undefined): void {
  reload = doReload;
  listeners.forEach((l) => l(reload));
}

/** Calls `l` now and whenever an update starts waiting. */
export function watchPendingUpdate(l: Listener): void {
  listeners.add(l);
  l(reload);
}

/** play.html, play-<game>.html and dos.html: a page whose whole job is a game playing. */
export function isPlayPage(path: string): boolean {
  return /(^|\/)(play|play-[^/]+|dos)\.html$/.test(path);
}

/**
 * Fades `el` out and removes it after `ms`; waits while it has keyboard focus or the pointer is over
 * it, so nobody loses the buttons mid-press. Returns a function that cancels.
 */
export function fadeOutLater(el: HTMLElement, ms = NOTICE_FADE_MS): () => void {
  let timer = 0;
  const arm = (after: number) => {
    timer = window.setTimeout(() => {
      if (!el.isConnected) return;
      if (el.contains(document.activeElement) || el.matches(':hover')) return arm(2000);
      el.style.transition = 'opacity .6s';
      el.style.opacity = '0';
      timer = window.setTimeout(() => el.remove(), 650);
    }, after);
  };
  arm(ms);
  return () => window.clearTimeout(timer);
}
