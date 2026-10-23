// Today's web: the Offline dialog (the header's "Offline" button and ⋯ menu). Says what a
// copy of the whole site costs, downloads it with a progress bar that can be stopped, then
// says it is ready, with a way to remove it again (offlineCopy.ts does the work).
import './offline.css';
import { h, clear, modal } from '../editor/core/ui';
import { hasRoom, makeOffline, offlineStatus, removeOffline, sizeText, type OfflineStatus } from './offlineCopy';

const games = (s: OfflineStatus) => s.files.filter((f) => f.path.endsWith('.gmpak')).length;

function storageLine(s: OfflineStatus): string | null {
  if (s.quota === undefined || s.usage === undefined) return null;
  return `This browser lets the site use about ${sizeText(s.quota)}; ${sizeText(s.usage)} is in use now.`;
}

export async function openOfflineDialog(): Promise<void> {
  let stop = new AbortController();
  let busy = false;
  await modal<void>('Play offline', (close) => {
    const body = h('div', { class: 'offline-copy' });
    const status = h('p', { class: 'offline-status', role: 'status', 'aria-live': 'polite' }, 'Checking what is here already…');
    clear(body, status);

    const buttons = (...list: (HTMLElement | null)[]) => h('div', { class: 'buttons' }, ...list);
    const closeButton = (label = 'Close') => h('button', { type: 'button', onclick: () => close(undefined) }, label);

    const show = (s: OfflineStatus, note?: string) => {
      if (!s.supported) {
        status.textContent = s.reason ?? 'An offline copy cannot be made here.';
        clear(body, status, buttons(closeButton()));
        return;
      }
      const n = games(s);
      if (s.ready) {
        status.textContent = `✓ Ready offline. All ${n} games, the 1994 desk, the editors, the manuals and the boxes are kept in this browser (${sizeText(s.wireTotal)}), so the whole site works with no connection.`;
        const remove = h(
          'button',
          {
            type: 'button',
            onclick: async () => {
              remove.setAttribute('disabled', '');
              status.textContent = 'Removing the offline copy…';
              await removeOffline(s).catch(() => undefined);
              show(await offlineStatus(), 'Removed. Parts you use are kept for offline use again as you use them.');
            },
          },
          'Remove offline copies',
        );
        clear(body, status, note ? h('p', null, note) : null, h('p', { class: 'meta' }, storageLine(s)), buttons(remove, closeButton()));
        return;
      }
      const partial = s.missing.length < s.files.length;
      const lead =
        s.copy === 'outdated' && partial
          ? `Your offline copy needs an update: ${s.missing.length} files have changed or are new since you made it (${sizeText(s.wireMissing)}).`
          : s.copy === 'unfinished' && partial
            ? `Your offline copy is not finished: ${s.missing.length} files (${sizeText(s.wireMissing)}) still to come.`
            : `Download everything once, and the whole site works with no connection: all ${n} games, the 1994 desk, the editors, the manuals and the boxes.`;
      status.textContent = lead;
      const room = hasRoom(s, s.storedMissing);
      const go = h(
        'button',
        { type: 'button', class: 'primary', onclick: () => void download(s) },
        s.copy !== 'none' && partial ? `Download the rest (${sizeText(s.wireMissing)})` : `Download ${sizeText(s.wireMissing)}`,
      );
      if (!room) go.setAttribute('disabled', '');
      clear(
        body,
        status,
        note ? h('p', { class: 'offline-note' }, note) : null,
        h(
          'p',
          { class: 'meta' },
          `${sizeText(s.wireMissing)} to download${partial ? ` (${sizeText(s.wireTotal - s.wireMissing)} of it is here already)` : ''}, about ${sizeText(s.storedMissing)} kept on this device. `,
          storageLine(s),
          room ? null : h('strong', null, ' There is not enough room left for it.'),
        ),
        h('p', { class: 'meta' }, 'Without it, each part is kept for offline use the first time you open it.'),
        buttons(closeButton('Not now'), go),
      );
      go.focus();
    };

    const download = async (s: OfflineStatus) => {
      busy = true;
      stop = new AbortController();
      const bar = h('progress', { max: String(s.wireMissing || 1), value: '0', 'aria-label': 'Download progress' }) as HTMLProgressElement;
      const line = h('p', { class: 'meta', 'aria-live': 'off' });
      const cancel = h('button', { type: 'button', onclick: () => stop.abort() }, 'Cancel');
      status.textContent = 'Downloading the offline copy…';
      clear(body, status, bar, line, buttons(cancel));
      cancel.focus();
      const result = await makeOffline(
        s,
        (p) => {
          bar.value = p.bytes;
          line.textContent = `${sizeText(p.bytes)} of ${sizeText(p.totalBytes)} · ${p.done} of ${p.total} files`;
        },
        stop.signal,
      );
      busy = false;
      const next = await offlineStatus();
      show(next, result.ok ? undefined : result.message);
    };

    void offlineStatus().then((s) => show(s));
    return body;
  });
  // closed (Esc too): a download still going stops; what came in is kept
  if (busy) stop.abort();
}
