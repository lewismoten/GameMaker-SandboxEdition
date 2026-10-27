// New game's "✦ Describe it to your AI…" (editor/shell/homeImport.ts): the description, then AI
// setup if there is none yet. The new game, made from the starter, is built by the chat as soon
// as its editor opens (panel.ts buildWhenOpened). Loaded when that choice is made.
import { h, modal } from '../../editor/core/ui';
import { readySettings } from './panel';

export { buildWhenOpened } from './panel';

/** Asks what the game should be, then sets up the AI if needed; undefined when either is canceled. */
export async function askDescription(): Promise<string | undefined> {
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
  if (!text || !(await readySettings())) return undefined;
  return text;
}
