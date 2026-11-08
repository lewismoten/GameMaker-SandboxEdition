// A part of the site that cannot be loaded (Vite's "vite:preloadError": a chunk missing from the
// cache with no connection, or a deploy that replaced it): say so, rather than leave a blank page.

/** What to tell the visitor; `online` is navigator.onLine. */
export function loadFailureText(online: boolean): string {
  return online
    ? 'Part of the page could not be loaded. Reload to try again.'
    : 'This part of the site has not been saved for offline use yet. Reconnect to open it, or choose Settings, then Play offline, once to keep everything.';
}

/** Shows `show(text)` when a lazily loaded part of the site fails to load. */
export function watchLoadFailures(show: (text: string) => void): void {
  window.addEventListener('vite:preloadError', () => show(loadFailureText(navigator.onLine !== false)));
}

/**
 * "Reload" on a notice: a new version waiting in the wings takes over first (reloading alone would
 * be served the old version again, whose parts the deploy may have removed); otherwise just reload.
 * Returns true when the page should reload by itself once the new version has taken over.
 */
export function reloadForNewest(waiting: Pick<ServiceWorker, 'postMessage'> | undefined, reload: () => void): boolean {
  if (!waiting) {
    reload();
    return false;
  }
  waiting.postMessage({ type: 'skip-waiting' });
  return true;
}
