// Development only: instead of reloading the page whenever a source file changes
// (which would switch off the retro PC mid-session), show a button to reload when ready.
// It says so for a second, then shrinks to a small ♻️ in the corner, out of the way; later
// changes leave it small (it already says there is newer code). It stays clickable over modal
// views, which make the rest of the page inert. The server holds back the changed modules
// (vite.config.ts manualReload) until the button is pressed, so lazy loads stay on the old code.

/** Generated disks and extras arrive in batches during a background game refresh. */
export function isGameBuildOutput(file = ''): boolean {
  return /(?:^|\/)(?:games\/(?:\.build-cache\.json$|[^/]+\/(?:disk\/|walkPaths\.json$))|web\/public\/(?:trinkets|laser)\/)/.test(file.replaceAll('\\', '/'));
}

export function watchForUpdates(): void {
  if (!import.meta.hot) return;
  let shown: HTMLButtonElement | undefined;
  let sourceChanged = false;
  let compact = false;
  import.meta.hot.on('gm:source-changed', ({ file }: { file?: string } = {}) => {
    sourceChanged ||= !isGameBuildOutput(file);
    const generated = !sourceChanged;
    const message = generated ? 'Rebuilt game files are ready' : 'Updated code is ready';
    const btn = shown ?? document.createElement('button');
    if (!compact) btn.textContent = `${message} — Reload`;
    btn.title = `${generated ? 'The background game build has newer files.' : 'The dev server has newer code.'} Reload when you are ready (this restarts the page).`;
    btn.setAttribute('aria-label', `${message}: reload the page`);
    if (shown) return;
    shown = btn;
    btn.style.cssText =
      'position:fixed;left:12px;bottom:12px;z-index:1000;padding:8px 12px;min-width:32px;min-height:32px;border-radius:8px;border:1px solid #1b318a;' +
      'background:#2342b8;color:#fff;font:600 13px system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.4);cursor:pointer;opacity:.9';
    btn.addEventListener('click', () => {
      // the server keeps serving the old code until told; it answers once it has invalidated the changed files
      const hot = import.meta.hot;
      hot?.on('gm:updates-applied', () => location.reload());
      hot?.send('gm:apply-updates');
      setTimeout(() => location.reload(), 3000); // server gone or silent: reload anyway
    });
    document.body.append(btn);
    // a modal view (the magazine, say) makes the rest of the page inert; this button stays usable
    new MutationObserver(() => {
      if (btn.inert) btn.inert = false;
    }).observe(btn, { attributes: true, attributeFilter: ['inert'] });
    setTimeout(() => {
      compact = true;
      btn.textContent = '♻️';
      btn.style.padding = '4px 6px';
      btn.style.fontSize = '18px';
      btn.style.lineHeight = '1';
    }, 1000);
  });
}
