// Today's web: the Offline dialog (the header's "Offline" button and ⋯ menu). Says what a
// copy of the whole site costs, downloads it with a progress bar that can be stopped, then
// says it is ready, with a way to remove it again (offlineCopy.ts does the work).
import './offline.css';
import { inArchiveReplay } from './replay';
import { h, clear, modal } from '../editor/core/ui';
import { gameCount, hasRoom, makeOffline, offlineStatus, removeOffline, sizeText, type OfflineStatus } from './offlineCopy';

function storageLine(s: OfflineStatus): string | null {
  if (s.quota === undefined || s.usage === undefined) return null;
  return `This browser lets the site use about ${sizeText(s.quota)}; ${sizeText(s.usage)} is in use now.`;
}

export async function openOfflineDialog(): Promise<void> {
  if (inArchiveReplay()) return; // an archived copy cannot be kept offline from
  let stop = new AbortController();
  let busy = false;
  await modal<void>('Play offline', (close) => {
    const body = h('div', { class: 'offline-copy' });
    const status = h('p', { class: 'offline-status', role: 'status', 'aria-live': 'polite' }, 'Checking what is here already…');
    const content = h('div');
    body.append(status, content);

    const buttons = (...list: (HTMLElement | null)[]) => h('div', { class: 'buttons' }, ...list);
    const closeButton = (label = 'Close') => h('button', { type: 'button', onclick: () => close(undefined) }, label);

    const show = (s: OfflineStatus, note?: string) => {
      if (!s.supported) {
        status.textContent = s.reason ?? 'An offline copy cannot be made here.';
        clear(content, buttons(closeButton()));
        return;
      }
      const n = gameCount(s);
      if (s.ready) {
        status.textContent = `✓ Ready offline. All ${n} games, the 1994 desk, the editors, the manuals and the boxes are kept in this browser (${sizeText(s.wireTotal)}), so the whole site works with no connection.`;
        const remove = h(
          'button',
          {
            type: 'button',
            onclick: async () => {
              remove.setAttribute('disabled', '');
              status.textContent = 'Removing the offline copy…';
              try {
                await removeOffline(s);
                show(await offlineStatus(), 'Removed. Parts you use are kept for offline use again as you use them.');
              } catch (e) {
                status.textContent = `The offline copy could not be removed: ${(e as Error).message}. Try again.`;
                remove.removeAttribute('disabled');
              }
            },
          },
          'Remove offline copies',
        );
        if (note) status.textContent = `${note} ${status.textContent}`;
        clear(content, h('p', { class: 'meta' }, storageLine(s)), buttons(remove, closeButton()));
        return;
      }
      const lead =
        s.copy === 'outdated'
          ? `Your offline copy needs an update. Download one replacement archive (${sizeText(s.wireMissing)}); the previous complete copy stays until it is ready.`
          : s.copy === 'unfinished'
            ? `Your offline copy is not finished. Download the archive again (${sizeText(s.wireMissing)}).`
            : `Download one archive, and the whole site works with no connection: all ${n} games, the 1994 desk, the editors, the manuals and the boxes.`;
      status.textContent = note ? `${note} ${lead}` : lead;
      const room = hasRoom(s, s.storedMissing);
      const go = h('button', { type: 'button', class: 'primary', onclick: () => void download(s) }, `Download ${sizeText(s.wireMissing)}`);
      if (!room) go.setAttribute('disabled', '');
      clear(
        content,
        h(
          'p',
          { class: 'meta' },
          `${sizeText(s.wireMissing)} to download, about ${sizeText(s.storedMissing)} of free space needed for the replacement. `,
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
      const bar = h('progress', { max: String(s.wireMissing || 1), value: '0', 'aria-label': 'Download progress' });
      const line = h('p', { class: 'meta', 'aria-live': 'off' });
      const cancel = h('button', { type: 'button', onclick: () => stop.abort() }, 'Cancel');
      status.textContent = 'Downloading the offline copy…';
      clear(content, bar, line, buttons(cancel));
      cancel.focus();
      try {
        const result = await makeOffline(
          s,
          (p) => {
            status.textContent = p.phase === 'extract' ? 'Unpacking the offline copy…' : 'Downloading the offline copy…';
            bar.value = p.bytes;
            line.textContent = `${sizeText(p.bytes)} of ${sizeText(p.totalBytes)} · ${p.done} of ${p.total} files`;
          },
          stop.signal,
        );
        const next = await offlineStatus();
        show(next, result.ok ? undefined : result.message);
      } catch (e) {
        show(s, `The offline copy could not be downloaded: ${(e as Error).message}. Try again.`);
      } finally {
        busy = false;
      }
    };

    void offlineStatus()
      .then((s) => show(s))
      .catch((e: unknown) => {
        status.textContent = `The offline copy could not be checked: ${(e as Error).message}. Close and try again.`;
        clear(content, buttons(closeButton()));
      });
    return body;
  });
  // Closed (Esc too): stop staging; the previous complete copy is kept.
  if (busy) stop.abort();
}
