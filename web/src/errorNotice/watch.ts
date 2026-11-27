// Catches window error and unhandledrejection on the site, play.html and dos.html. The listener
// is tiny; the notice itself (notice.ts) loads only when something breaks. Nothing is sent
// anywhere. Call watchErrors() once at start.
//
// A part of the site that fails to load has its own notice (offline/loadFailure.ts: "Reload", or
// "Not in your offline copy"), which this box must not cover. The rule is exact: skipped is only
// the very error Vite handed to "vite:preloadError" (the event that notice answers), when it comes
// back as an unhandled rejection. Anything else, a TypeError after the failed import included,
// still shows the box.
import { ReadOnlyError } from '../project/readOnlyError';
import { messageOf, type ErrorInfo } from './details';

/** Errors that are not the player's trouble (a resize loop, a cancelled fetch). */
export function ignorable(message: string): boolean {
  return /ResizeObserver loop|AbortError|Script error\.?$/.test(message);
}

/**
 * A look-only game refusing a change (editor/core/readOnly.ts): its own dialog already says what
 * happened.
 */
export function refusedChange(reason: unknown): boolean {
  return reason instanceof ReadOnlyError;
}

/** The errors Vite reported in "vite:preloadError", which the load-failure notice already shows. */
const loadFailures = new WeakSet<object>();

/** Notes the failure in a "vite:preloadError" event (its `payload` is what Vite then rethrows). */
function noteLoadFailure(event: Event): void {
  const payload: unknown = (event as Event & { payload?: unknown }).payload;
  if (typeof payload === 'object' && payload !== null) loadFailures.add(payload);
}

/** A part of the site that failed to load, already shown by the load-failure notice. */
function shownAsLoadFailure(reason: unknown): boolean {
  return typeof reason === 'object' && reason !== null && loadFailures.has(reason);
}

function report(info: ErrorInfo): void {
  if (ignorable(info.message)) return;
  void import('./notice').then((m) => m.showError(info));
}

let started = false;

export function watchErrors(): void {
  if (started) return;
  started = true;
  addEventListener('vite:preloadError', noteLoadFailure);
  addEventListener('error', (e) => {
    if (refusedChange(e.error)) return;
    const file = e.filename ? e.filename.split('/').pop() : '';
    report({ message: e.message || messageOf(e.error), at: file ? `${file}:${e.lineno}:${e.colno}` : undefined });
  });
  addEventListener('unhandledrejection', (e) => {
    if (refusedChange(e.reason) || shownAsLoadFailure(e.reason)) return;
    report({ message: messageOf(e.reason) });
  });
}
