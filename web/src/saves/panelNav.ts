// The Saves & scores panel's list on the left: the ten slots, the high scores, the backups and the
// game's tin heart, each with a line on what it holds and a dot for unsaved changes.
import { h, clear } from '../editor/core/ui';
import { HIGH_SCORES } from '../project/saveData';
import { FOUND_FILE, heartOf, parseFound } from '../tinHearts/tinHearts';
import type { Panel, View } from './panelState';
import { fmt } from './panelText';

export function renderNav(p: Panel, nav: HTMLElement): void {
  const saves = p.saves;
  if (!saves) return;
  const item = (v: View, title: string, sub: string, extra?: string) => {
    const on = v === p.view;
    return h(
      'button',
      {
        type: 'button',
        class: `sv-nav-item${on ? ' on' : ''}`,
        'aria-current': on ? 'true' : undefined,
        onclick: () => p.go(v),
      },
      h(
        'span',
        { class: 'sv-nav-title' },
        title,
        extra ? h('span', { class: 'sv-dot', title: 'Unsaved changes', 'aria-label': '(unsaved changes)' }, '●') : null,
      ),
      h('span', { class: 'sv-nav-sub' }, sub),
    );
  };
  clear(
    nav,
    h('h3', { class: 'sv-nav-head' }, 'Saved games'),
    // none yet: how a game gets one
    saves.slots.every((s) => !s.save && !s.error && !p.work.get(s.slot)?.save)
      ? h('p', { class: 'sv-nav-empty' }, 'None yet: press F5 while playing to save, and F6 to load.')
      : null,
    ...saves.slots.map((s) => {
      const save = p.work.get(s.slot)?.save ?? s.save;
      const sub = s.error ? 'Damaged' : save ? `${fmt(save.world.ci.score)} pts · ${p.labels?.sceneName(save.doscene) ?? `level ${save.doscene}`}` : 'Empty';
      return item(s.slot, `${s.slot + 1}. ${(p.work.get(s.slot)?.name ?? s.name) || (save ? 'Unnamed' : '—')}`, sub, p.dirtySlot(s.slot) ? '●' : undefined);
    }),
    h('h3', { class: 'sv-nav-head' }, 'More'),
    item('scores', 'High scores', `${saves.highScores.entries.filter((e) => e.score !== 0).length} of ${HIGH_SCORES}`, p.dirtyScores() ? '●' : undefined),
    item('backups', 'Backups', p.backups.length ? `${p.backups.length} · last ${new Date(p.backups[0].when).toLocaleDateString('en-US')}` : 'None yet'),
    heartNote(p),
  );
}

/** The game's tin heart, once found (or still to find, in a game that hides one): kept with its saves. */
function heartNote(p: Panel) {
  const found = parseFound(p.saves?.files[FOUND_FILE]);
  if (!found && !heartOf(p.target.saveId.replace(/^game:/, ''))) return null;
  const when = new Date(found?.found ?? '');
  const sub = found ? (isNaN(+when) ? 'Found' : `Found ${when.toLocaleDateString('en-US', { dateStyle: 'medium' })}`) : 'Not found yet';
  return h('div', { class: 'sv-nav-item sv-nav-note' }, h('span', { class: 'sv-nav-title' }, 'Tin heart'), h('span', { class: 'sv-nav-sub' }, sub));
}
