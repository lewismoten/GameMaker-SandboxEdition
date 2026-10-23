// Registers the site's service worker (production builds only; see siteWorker.ts).
// It installs only the app shell; once it is running, this hands it the files the page
// already loaded (the chunks for the interface shown, the games looked at) so they work
// offline too. Later downloads pass through the worker and are cached as they happen.
//
// A new version of the site waits until the visitor says so: a small notice offers to
// reload (a game on the desk's PC, or one being played, is never switched off by itself).

const HOUR = 60 * 60 * 1000;

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  const sw = navigator.serviceWorker;
  // there was a worker before this one: a newer one taking over is a new version
  const hadController = !!sw.controller;
  let reloading = false;
  sw.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    // updated from this page, or from another tab of the site: then this page asks too
    if (!asked) return offerUpdate(undefined);
    reloading = true;
    location.reload();
  });
  sw.register('./sw.js')
    .then((reg) => {
      const offer = (worker: ServiceWorker | null) => worker && sw.controller && offerUpdate(worker);
      offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => worker.state === 'installed' && offer(worker));
      });
      // a page left open for hours still hears of a new version
      window.setInterval(() => void reg.update().catch(() => undefined), HOUR);
      return sw.ready;
    })
    .then((reg) => {
      const urls = performance
        .getEntriesByType('resource')
        .map((e) => e.name)
        .filter((u) => u.startsWith(location.origin));
      reg.active?.postMessage({ cacheUrls: [...new Set(urls)] });
    })
    .catch(() => undefined);
}

let asked = false;
let notice: HTMLElement | undefined;

/**
 * "A new version is ready": Reload now, or Later (it is used the next time the site opens).
 * Without a worker, another tab has already switched to it: Reload just reloads.
 */
function offerUpdate(worker: ServiceWorker | undefined): void {
  if (notice?.isConnected) notice.remove();
  const button = (label: string, primary: boolean, onclick: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = `font:inherit;padding:4px 12px;border-radius:4px;cursor:pointer;border:1px solid #fff;${primary ? 'background:#fff;color:#000080;font-weight:bold' : 'background:transparent;color:#fff'}`;
    b.addEventListener('click', onclick);
    return b;
  };
  const text = document.createElement('span');
  text.textContent = 'A new version of Game-Maker is ready.';
  notice = document.createElement('div');
  notice.className = 'gm-update';
  notice.setAttribute('role', 'status');
  notice.style.cssText =
    'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;' +
    'max-width:calc(100vw - 32px);box-sizing:border-box;padding:10px 14px;border-radius:6px;background:#000080;color:#fff;' +
    'font:14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.45)';
  notice.append(
    text,
    button('Reload', true, () => {
      asked = true;
      text.textContent = 'Updating…';
      if (worker) worker.postMessage({ type: 'skip-waiting' });
      else location.reload();
    }),
    button('Later', false, () => notice?.remove()),
  );
  document.body.append(notice);
}
