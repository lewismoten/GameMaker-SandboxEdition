// Small words and a yes-or-no question shared by the parts of the Saves & scores panel.
import { h, modal } from '../editor/core/ui';
import type { SaveField } from '../project/saveData';

export const fmt = (n: number) => n.toLocaleString('en-US');

/** "0 to 32,767; the game handles up to 9,999 well." */
export const rangeText = (f: SaveField, lower = false) =>
  `${lower ? 'from' : 'From'} ${fmt(f.min)} to ${fmt(f.max)}${f.safeMax < f.max ? `; the game handles up to ${fmt(f.safeMax)} well` : ''}.`;

export const kb = (n: number) => `${fmt(Math.max(1, Math.round(n / 1024)))} KB`;

export async function confirmDialog(title: string, text: string, ok: string, danger = false): Promise<boolean> {
  return !!(await modal<boolean>(title, (close) => [
    h('p', { class: 'sv-confirm' }, text),
    h(
      'div',
      { class: 'buttons' },
      h('button', { type: 'button', onclick: () => close(false) }, 'Cancel'),
      h('button', { type: 'button', class: danger ? 'danger' : 'primary', autofocus: true, onclick: () => close(true) }, ok),
    ),
  ]));
}
