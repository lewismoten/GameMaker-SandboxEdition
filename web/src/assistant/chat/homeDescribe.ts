// The home page's "Describe a game…": the description, AI setup if there is none yet, then a new
// game from the starter (editor/shell/starter.ts) that the chat builds as soon as its editor
// opens (panel.ts buildWhenOpened). Loaded when the button is pressed.
import { h, modal } from '../../editor/core/ui';
import { Project } from '../../editor/core/project';
import { starterProject } from '../../editor/shell/starter';
import { buildWhenOpened, readySettings } from './panel';

export async function describeGame(nav: { openProject(id: string): void }): Promise<void> {
  const text = await modal<string>('Describe a game', (close) => {
    const area = h('textarea', {
      id: 'home-describe',
      rows: 4,
      maxLength: 1000,
      required: true,
      autofocus: true,
      placeholder: 'A friendly robot collects lost socks in a laundromat maze…',
    });
    return h(
      'form',
      {
        class: 'stack home-describe',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (area.reportValidity()) close(area.value.trim());
        },
      },
      h('label', { for: 'home-describe' }, 'What should the game be?', area),
      h(
        'p',
        { class: 'meta' },
        'Your own AI (set it up next, if you haven’t) builds a small first level from the starter, play-tests it, and says what to add next. The game’s contents are sent to that AI while it works.',
      ),
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, 'Build it'),
      ),
    );
  });
  if (!text) return;
  if (!(await readySettings())) return;
  const p = await starterProject('My Game').catch(() => Project.create('My Game'));
  await p.saveNow();
  buildWhenOpened(p.id, text);
  nav.openProject(p.id);
}
