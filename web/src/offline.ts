// Registers the site's service worker (production builds only; see export/serviceWorker.ts).
// It installs only the app shell; once it is running, this hands it the files the page
// already loaded (the chunks for the interface shown, the games looked at) so they work
// offline too. Later downloads pass through the worker and are cached as they happen.

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  navigator.serviceWorker
    .register('./sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then((reg) => {
      const urls = performance
        .getEntriesByType('resource')
        .map((e) => e.name)
        .filter((u) => u.startsWith(location.origin));
      reg.active?.postMessage({ cacheUrls: [...new Set(urls)] });
    })
    .catch(() => undefined);
}
