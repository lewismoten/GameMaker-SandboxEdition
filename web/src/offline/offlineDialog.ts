// Today's web: choose offline tiers, download or resume, and remove a prepared copy.
import './offline.css';
import { inArchiveReplay } from './replay';
import { h, clear, modal } from '../editor/core/ui';
import { progressAnnouncements } from '../editor/core/progressAnnouncements';
import { hasRoom, makeOffline, offlineStatus, removeOffline, sizeText, type OfflineStatus } from './offlineCopy';
import { offlineTiers, type OfflineTier } from './tiers';

export async function openOfflineDialog(): Promise<void> {
  if (inArchiveReplay()) return;
  let stop = new AbortController();
  let generation = 0;
  await modal<void>('Play offline', (close) => {
    const body = h('div', { class: 'offline-copy' });
    const status = h('p', { role: 'status', 'aria-live': 'polite' }, 'Checking what is here already…');
    const content = h('div');
    body.append(status, content);
    const closeButton = () => h('button', { type: 'button', onclick: () => close(undefined) }, 'Close');
    const show = (s: OfflineStatus, note = '', checking = false) => {
      status.className = '';
      if (!s.supported) {
        status.textContent = s.reason ?? 'An offline copy cannot be made here.';
        clear(content, closeButton());
        return;
      }
      status.textContent =
        note ||
        (s.ready
          ? '✓ Ready offline. Your selected tiers are kept in this browser.'
          : s.copy === 'outdated'
            ? 'An update is available. The previous complete copy stays until this selection is ready.'
            : 'Choose what to keep. Verified files are reused when you update or resume.');
      const choices = h('fieldset', { class: 'offline-tiers' });
      choices.append(h('legend', null, 'Keep in this browser'));
      for (const [tier, label] of Object.entries(offlineTiers) as [OfflineTier, string][]) {
        const input = h('input', { type: 'checkbox', checked: s.tiers.includes(tier), disabled: checking || tier === 'core' });
        input.addEventListener('change', () => {
          const tiers = input.checked ? [...s.tiers, tier] : s.tiers.filter((t) => t !== tier);
          for (const control of choices.querySelectorAll('input')) control.disabled = true;
          go.disabled = true;
          remove.disabled = true;
          const request = ++generation;
          status.textContent = 'Checking selected files…';
          void offlineStatus(tiers)
            .then((next) => {
              if (request === generation) show(next);
            })
            .catch((e: unknown) => {
              if (request === generation) show(s, `Could not check the selection: ${String(e)}`);
            });
        });
        const bytes = s.tierFiles.filter((f) => f.tier === tier).reduce((n, f) => n + f.stored, 0);
        choices.append(h('label', null, input, ` ${label} (${sizeText(bytes)})`));
      }
      const room = hasRoom(s, s.storedMissing);
      const go = h(
        'button',
        { type: 'button', class: 'primary', disabled: checking || !room, onclick: () => void download(s) },
        checking ? 'Checking…' : `Download ${sizeText(s.wireMissing)}`,
      );
      const remove = h(
        'button',
        {
          type: 'button',
          disabled: checking,
          onclick: async () => {
            remove.disabled = true;
            try {
              await removeOffline(s);
              show(await offlineStatus(), 'Removed the prepared copy.');
            } catch (e) {
              show(s, `Could not remove the offline copy: ${String(e)}`);
            }
          },
        },
        'Remove offline copies',
      );
      clear(
        content,
        choices,
        h(
          'p',
          { class: 'meta' },
          checking
            ? 'Download and storage estimates follow the check.'
            : `${sizeText(s.wireMissing)} still needed; about ${sizeText(s.storedMissing)} free space needed for a safe replacement.${room ? '' : ' There is not enough room.'}`,
        ),
        h('p', { class: 'meta' }, 'Video playback needs the internet. You can change tiers later.'),
        h('div', { class: 'buttons' }, closeButton(), !s.ready && go, s.removable && remove),
      );
    };
    const download = async (s: OfflineStatus) => {
      ++generation;
      stop = new AbortController();
      const bar = h('progress', { max: String(s.wireTotal || 1), value: '0', 'aria-label': 'Verified files' });
      const start = 'Preparing the offline copy…';
      const line = h('p', { class: 'meta' }, start);
      clear(content, bar, line, h('button', { type: 'button', onclick: () => stop.abort() }, 'Cancel'));
      status.className = 'sr-only';
      const speech = progressAnnouncements((text) => (status.textContent = text));
      speech.progress(start);
      try {
        const result = await makeOffline(
          s,
          (p) => {
            bar.value = p.bytes;
            const verified = `${p.done} of ${p.total} files verified`;
            line.textContent = `${verified} · ${sizeText(p.bytes)} of ${sizeText(p.totalBytes)}`;
            speech.progress(verified);
          },
          stop.signal,
        );
        show(await offlineStatus(s.tiers), result.ok ? '' : result.message);
      } catch (e) {
        show(s, `The offline copy could not finish: ${(e as Error).message}`);
      }
    };
    void offlineStatus(undefined, (s) => show(s, 'Checking saved files…', true))
      .then((s) => show(s))
      .catch((e: unknown) => {
        status.textContent = String(e);
        clear(content, closeButton());
      });
    return body;
  });
  ++generation;
  stop.abort();
}
