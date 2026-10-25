// Development only: instead of reloading the page whenever a source file changes
// (which would switch off the retro PC mid-session), show a button to reload when ready.
// It says so for a second, then shrinks to a small ♻️ in the corner, out of the way; later
// changes leave it small (it already says there is newer code).

export function watchForUpdates(): void {
  if (!import.meta.hot) return;
  let shown = false;
  import.meta.hot.on('gm:source-changed', () => {
    if (shown) return;
    shown = true;
    const btn = document.createElement('button');
    btn.textContent = 'Updated code is ready — Reload';
    btn.title = 'The dev server has newer code. Reload when you are ready (this restarts the page).';
    btn.setAttribute('aria-label', 'Updated code is ready: reload the page');
    btn.style.cssText =
      'position:fixed;left:12px;bottom:12px;z-index:1000;padding:8px 12px;min-width:32px;min-height:32px;border-radius:8px;border:1px solid #1b318a;' +
      'background:#2342b8;color:#fff;font:600 13px system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.4);cursor:pointer;opacity:.9';
    btn.addEventListener('click', () => location.reload());
    document.body.append(btn);
    setTimeout(() => {
      btn.textContent = '♻️';
      btn.style.padding = '4px 6px';
      btn.style.fontSize = '18px';
      btn.style.lineHeight = '1';
    }, 1000);
  });
}
