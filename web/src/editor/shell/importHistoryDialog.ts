// "Import history…" on the Imported tab: the last 20 imports (when, from where, how many came in,
// how many were left out as already held, which failed and why), with a way to clear them.
// The dialog stays until closed, so a failure can be read after the import's own dialog is gone.
import { h, modal } from '../core/ui';
import { clearImportHistory, importHistory, recordText } from '../../imported/importHistory';

export async function showImportHistory(): Promise<void> {
  await modal<void>('Import history', (close) => {
    const list = importHistory();
    const body = h('div', { class: 'ih-list' });
    const draw = () => {
      const now = importHistory();
      body.replaceChildren(
        ...(now.length
          ? now.map((r) =>
              h(
                'section',
                { class: 'ih-item' },
                h('h3', null, new Date(r.at).toLocaleString()),
                h('p', null, `${recordText(r)}. From ${r.source}.`),
                r.failed.length
                  ? h(
                      'details',
                      { class: 'ic-notes' },
                      h('summary', null, `Not imported (${r.failed.length})`),
                      h('ul', null, ...r.failed.map((f) => h('li', null, f))),
                    )
                  : null,
              ),
            )
          : [h('p', null, 'No imports are remembered.')]),
      );
    };
    draw();
    const clear = h(
      'button',
      {
        type: 'button',
        class: 'danger',
        disabled: !list.length,
        onclick: () => {
          clearImportHistory();
          draw();
          clear.disabled = true;
        },
      },
      'Clear history',
    );
    return [
      h('p', null, 'The last 20 imports, kept in this browser. Clearing this list does not remove any game.'),
      body,
      h('div', { class: 'buttons' }, clear, h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close(undefined) }, 'Close')),
    ];
  });
}
