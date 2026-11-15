// Missing offline content is determined by actual cache entries, including ordinary browsing.
export async function availableOffline(url: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || navigator.onLine !== false || typeof caches === 'undefined') return true;
  const { readOfflineCopy } = await import('./archiveStore');
  const base = new URL('./', location.href).href;
  const absolute = new URL(url, base).href;
  const copy = await readOfflineCopy(base);
  for (const name of [copy?.cache, 'gm-site-v2']) {
    if (name && (await caches.has(name)) && (await (await caches.open(name)).match(absolute, { ignoreSearch: true, ignoreVary: true }))) return true;
  }
  return false;
}
export async function requireOfflineFile(url: string): Promise<void> {
  if (!(await availableOffline(url))) throw new Error('Not in your offline copy. Connect and choose Play offline to add this content.');
}
/** Marks an action before it can open absent content. Imported projects never call this. */
export function markOfflineAction(control: HTMLElement, url: string): void {
  if (typeof navigator === 'undefined' || navigator.onLine !== false) return;
  void availableOffline(url).then((available) => {
    if (available) return;
    control.setAttribute('aria-disabled', 'true');
    control.title = 'Not in your offline copy';
    control.setAttribute('aria-label', `${control.getAttribute('aria-label') ?? control.textContent} · Not in your offline copy`);
    control.append(document.createTextNode(' · Not in your offline copy'));
    control.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      { capture: true },
    );
  });
}
