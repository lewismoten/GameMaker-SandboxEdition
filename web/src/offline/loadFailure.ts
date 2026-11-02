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
