// "Recently deleted…" on My games and Imported: the games deleted in the last 7 days, each with
// when it went, its size and the days left, a Restore button that brings it back exactly as it
// was, and Empty now to let them all go. The dialog says how much room they take in this browser.
import { confirmDialog, h, modal, toast } from '../core/ui';
import { browserShelf, daysLeft, emptyDeleted, bytesOf } from '../../project/recentlyDeleted';
import { bringBack, shelfList } from './deletedShelf';

/** "3.4 MB" */
function sizeText(n: number): string {
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Shows the shelf; `refresh` redraws the home page's lists after a game comes back or the shelf is emptied. */
export async function showRecentlyDeleted(refresh: () => unknown): Promise<void> {
  await modal<void>('Recently deleted', (close) => {
    const body = h('div', { class: 'rd-list' });
    const info = h('p', { 'aria-live': 'polite' });
    const empty = h('button', { type: 'button', class: 'danger' }, 'Empty now');
    const draw = async () => {
      const list = await shelfList();
      const total = list.reduce((sum, g) => sum + g.bytes, 0);
      info.textContent = list.length
        ? `A deleted game stays here for 7 days, with its files, notes and checkpoints, then goes for good. These ${list.length === 1 ? 'game takes' : `${list.length} games take`} ${sizeText(total)} in this browser.`
        : 'Nothing was deleted in the last 7 days.';
      empty.disabled = !list.length;
      body.replaceChildren(
        ...list.map((g) =>
          h(
            'div',
            { class: 'rd-item' },
            h(
              'div',
              { class: 'rd-what' },
              h('strong', null, g.name),
              h(
                'small',
                null,
                `Deleted ${new Date(g.deletedAt).toLocaleDateString()} · ${sizeText(bytesOf(g.record))} · ${daysLeft(g)} ${daysLeft(g) === 1 ? 'day' : 'days'} left${g.imported ? ' · was under Imported' : ''}`,
              ),
            ),
            h(
              'button',
              {
                type: 'button',
                'aria-label': `Restore ${g.name}`,
                onclick: async () => {
                  const name = await bringBack(g.id).catch(() => undefined);
                  toast(name ? `Brought back “${name}”.` : 'That game could not be brought back.', name ? 'info' : 'error');
                  await refresh();
                  await draw();
                },
              },
              'Restore',
            ),
          ),
        ),
      );
    };
    empty.onclick = async () => {
      if (!(await confirmDialog('Empty Recently deleted', 'These games will be gone for good, with their files, notes and checkpoints.', 'Empty now'))) return;
      await emptyDeleted(browserShelf);
      toast('Emptied Recently deleted.');
      await refresh(); // the page's button hides at once
      await draw();
    };
    void draw();
    return [
      info,
      body,
      h('div', { class: 'buttons' }, empty, h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close(undefined) }, 'Close')),
    ];
  });
}
