// "Edit this game's credits page", beside the menu's "See Credits" wording in the DOS player
// panel: the game's own credits (the start scene's credits slot, a text page or a slide show)
// stay editable, unlike the player's About page.
import { h } from '../../../core/ui';
import type { Project } from '../../../core/project';
import { formatHash } from '../../../../urlState';

/** The start scene's credits slot (PLAYGAME.C's menu shows Game.File(0, 7)). */
const CREDITS_SLOT = 7;

export function creditsLink(project: Project): HTMLElement {
  const file = project.game().scenes[0]?.files[CREDITS_SLOT]?.trim();
  const has = !!file && project.files.has(file);
  return h(
    'p',
    { class: 'dp-credits-link' },
    has
      ? h('a', { href: formatHash(['p', project.id, file]) }, 'Edit this game’s credits page')
      : h('a', { href: formatHash(['p', project.id, project.gam]) }, 'Give this game a credits page'),
    has ? ` (${file.toUpperCase()}): it’s the game’s own, so it stays editable.` : ': the start scene’s Credits slot names none yet.',
  );
}
