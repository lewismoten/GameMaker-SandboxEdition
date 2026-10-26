// The start scene's "🎬 Opening sting…": adds an opening (an intro from openingIntros.ts, and
// a "<name> PRESENTS" card) to a game that has none, swaps it for another, or takes it out again.
// The integrator saves the scene afterwards; the cards' own files are written here.
import { h, modal, toast } from '../../core/ui';
import type { Project } from '../../core/project';
import type { Scene } from '../../../formats/game';
import { openingFields } from './openingFields';
import { openingOf, removeOpening } from './openingWire';
import { unlockAchievement } from '../../../achievements';

/** Resolves true when the game's opening changed. */
export async function openingDialog(project: Project, start: Scene, scenes: Scene[]): Promise<boolean> {
  const had = openingOf(project, start);
  const fields = openingFields(had ? { style: had.style, name: had.name } : undefined);
  const action = await modal<'apply' | 'remove'>(had ? 'Opening sting' : 'Add an opening sting', (close) =>
    h(
      'form',
      {
        class: 'stack opening-dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (fields.value()) close('apply');
        },
      },
      h(
        'p',
        { class: 'hint' },
        had
          ? `This game opens with ${had.files.map((f) => f.toUpperCase()).join(' and ')}, first in its title list ${had.list.toUpperCase()}.`
          : 'Plays first in the title screen’s slide show, as the game’s own files, so it is in every copy and export.',
      ),
      fields.el,
      h(
        'div',
        { class: 'buttons' },
        had ? h('button', { type: 'button', class: 'danger', onclick: () => close('remove') }, 'Remove the opening') : null,
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, had ? 'Change it' : 'Add it'),
      ),
    ),
  );
  if (action === 'remove') {
    removeOpening(project, start, scenes);
    toast('The opening is gone.');
    return true;
  }
  const v = action === 'apply' ? fields.value() : undefined;
  if (!v) return false;
  const { applyOpening } = await import('./openingCards');
  const { noSting } = await applyOpening(project, start, scenes, v.style, v.name);
  if (noSting) toast('The opening could not be loaded (offline?).', 'error');
  else if (!project.readOnly) unlockAchievement('make-opening');
  return true;
}
