// "Redo…" on the walkthrough player: redo the whole walkthrough, redo one level, or open a
// walkthrough file. It only says what was chosen; the editor's walkthrough flow
// (editor/widgets/walkDialog.ts) closes the player and does it, then opens the player again.
import { h, selectField } from '../editor/core/ui';
import { redoLevels } from '../editor/check/walk/redoLevel';
import type { Walkthrough } from './format';

export type RedoChoice = { kind: 'all' } | { kind: 'level'; scene: number } | { kind: 'file' };

export interface RedoOptions {
  /** Heard after the player has closed. */
  onChoose: (choice: RedoChoice, walk: Walkthrough) => void | Promise<void>;
  /** A look-only game: what a redone walkthrough is kept as (it is kept in this browser, the game's own is not changed). */
  note?: string;
}

export function redoMenu(walk: Walkthrough, opt: RedoOptions, choose: (c: RedoChoice) => void): HTMLElement {
  const levels = redoLevels(walk);
  let scene = levels[0]?.scene ?? 0;
  const pick = levels.length
    ? selectField(
        'Level to redo',
        levels.map((l) => [l.scene, l.title] as [number, string]),
        () => scene,
        (v) => (scene = v),
      )
    : null;
  return h(
    'details',
    { class: 'wt-redo' },
    h('summary', null, 'Redo…'),
    h(
      'div',
      { class: 'wt-redo-body stack' },
      h(
        'p',
        { class: 'meta' },
        'The bot plays the game again. The whole walkthrough, or one level: the other levels keep their keys when they still work after it.',
      ),
      h('div', { class: 'toolbar' }, h('button', { type: 'button', onclick: () => choose({ kind: 'all' }) }, 'Redo the whole walkthrough…')),
      pick
        ? h(
            'div',
            { class: 'toolbar' },
            pick,
            h('button', { type: 'button', class: 'wt-redo-level', onclick: () => choose({ kind: 'level', scene }) }, 'Redo this level'),
          )
        : null,
      h('div', { class: 'toolbar' }, h('button', { type: 'button', onclick: () => choose({ kind: 'file' }) }, 'Open a walkthrough file…')),
      opt.note ? h('p', { class: 'meta wt-redo-note' }, opt.note) : null,
    ),
  );
}
