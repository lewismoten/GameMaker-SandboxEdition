// Asked on the desk when you play a game (or change disks) while a Game-Maker designer has
// changes that aren't saved: save them first, leave them, or go back to designing.
import './saveFirst.css';
import { h } from '../../editor/core/ui';
import type { OpenDesigner } from '../../retro/host';

const DOS_NAME = /^[a-z0-9_$~!#%&-]{1,8}$/i;
const noExt = (name: string) => name.replace(/\.[^.]*$/, '');

/** Where the designer's files go: C:\GM\SAMPLE. */
export const folderText = (d: OpenDesigner) => `${d.work.folder.drive}:\\${d.work.folder.parts.join('\\')}`;

/**
 * Resolves with the name to save the work under (no extension), '' to leave it unsaved,
 * or null to keep designing.
 */
export function askSaveFirst(d: OpenDesigner, readOnly = false): Promise<string | null> {
  return new Promise((resolve) => {
    const exts = d.contents().map((c) => `.${c.ext.toUpperCase()}`);
    const current = noExt(d.work.curfile);
    const input = h('input', {
      class: 'sf-name',
      value: current.toUpperCase() || 'UNTITLED',
      maxlength: '8',
      spellcheck: 'false',
      'aria-label': 'File name',
    }) as HTMLInputElement;
    const error = h('p', { class: 'sf-error', role: 'alert' });
    const done = (answer: string | null) => {
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      resolve(answer);
    };
    const save = () => {
      const name = (current || input.value.trim()).toLowerCase();
      if (!DOS_NAME.test(name)) {
        error.textContent = 'Up to 8 letters, digits or _ (a DOS file name).';
        input.focus();
        return;
      }
      done(name);
    };
    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation(); // not for the PC underneath
      if (e.key === 'Escape') done(null);
      else if (e.key === 'Enter' && (e.target === input || e.target === document.body)) save();
      else return;
      e.preventDefault();
    };
    const where = folderText(d);
    const overlay = h(
      'div',
      { class: 'desk-overlay save-first', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sf-title' },
      h(
        'div',
        { class: 'sf-box' },
        h('h2', { id: 'sf-title' }, 'Save your changes first?'),
        h('p', null, `The ${d.title} has changes that aren’t saved. Game-Maker will close to play the game.`),
        readOnly ? h('p', null, `${where} can’t be changed, so they’ll go into a copy of the game on the hard disk (C:\\GM).`) : null,
        current
          ? h('p', null, 'They’ll be saved to ', h('b', null, exts.map((x) => current.toUpperCase() + x).join(' and ')), readOnly ? '.' : ` in ${where}.`)
          : h('label', { class: 'sf-label' }, readOnly ? 'Save as ' : `Save in ${where} as `, input, h('span', null, exts.join(' / '))),
        error,
        h(
          'div',
          { class: 'sf-buttons' },
          h('button', { class: 'primary', onclick: save }, 'Save'),
          h('button', { onclick: () => done('') }, 'Don’t save'),
          h('button', { onclick: () => done(null) }, 'Keep designing'),
        ),
      ),
    );
    overlay.addEventListener('click', (e) => e.target === overlay && done(null));
    window.addEventListener('keydown', onKey, true);
    document.body.append(overlay);
    (current ? overlay.querySelector<HTMLButtonElement>('button.primary') : input)?.focus();
    if (!current) input.select();
  });
}
