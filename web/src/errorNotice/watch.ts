// Catches window error and unhandledrejection on the site, play.html and dos.html. The listener
// is tiny; the notice itself (notice.ts) loads only when something breaks. Nothing is sent
// anywhere. Call watchErrors() once at start.
import { messageOf, type ErrorInfo } from './details';

/** Errors that are not the player's trouble (a resize loop, a cancelled fetch). */
export function ignorable(message: string): boolean {
  return /ResizeObserver loop|AbortError|Script error\.?$/.test(message);
}

export function report(info: ErrorInfo): void {
  if (ignorable(info.message)) return;
  void import('./notice').then((m) => m.showError(info));
}

let started = false;

export function watchErrors(): void {
  if (started) return;
  started = true;
  addEventListener('error', (e) => {
    const file = e.filename ? e.filename.split('/').pop() : '';
    report({ message: e.message || messageOf(e.error), at: file ? `${file}:${e.lineno}:${e.colno}` : undefined });
  });
  addEventListener('unhandledrejection', (e) => {
    report({ message: messageOf(e.reason) });
  });
}
