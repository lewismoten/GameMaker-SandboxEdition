// Controls share project-wide button descriptions; editing names never changes a DOS binding.
import type { Project } from '../../core/project';
import { h, clear, selectField } from '../../core/ui';
import { JOYSTICK_BUTTONS, readJoystickButtons, joystickButtonOptions, type JoystickButtons } from '../../core/joystickButtons';

export function joystickControls(project: Project, get: () => number, set: (value: number) => void, changed: (buttons: JoystickButtons) => void): HTMLElement {
  const read = () => readJoystickButtons(project.extras<unknown>(project.gam, JOYSTICK_BUTTONS, undefined));
  const description = h('p', { class: 'chr-help', 'aria-live': 'polite' });
  const choice = selectField('Joystick button', joystickButtonOptions(read()), get, (value) => {
    set(value);
    refresh();
  });
  function refresh(): void {
    const buttons = read();
    clear(choice.querySelector('select')!, ...joystickButtonOptions(buttons).map(([value, label]) => h('option', { value, selected: value === get() }, label)));
    description.textContent = ([1, 2] as const)
      .filter((index) => get() === index || get() === 3)
      .map((index) => (buttons[index]?.long ? `Button ${index}: ${buttons[index].long}` : ''))
      .filter(Boolean)
      .join(' ');
    description.hidden = !description.textContent;
  }
  const fields = ([1, 2] as const).flatMap((index) =>
    (['short', 'long'] as const).map((kind) => {
      const label = `Button ${index} ${kind} description`;
      const input = h('input', {
        type: 'text',
        maxLength: kind === 'short' ? 32 : 240,
        value: read()[index]?.[kind] ?? '',
        'aria-label': label,
        placeholder: kind === 'short' ? 'For example: Jump' : 'For example: Hold to jump higher',
      });
      input.addEventListener('change', () => {
        const before = read(),
          next = readJoystickButtons({ ...before, [index]: { ...before[index], [kind]: input.value } });
        input.value = next[index]?.[kind] ?? '';
        if (JSON.stringify(before) !== JSON.stringify(next)) changed(next);
        refresh();
      });
      return h('label', { class: 'field' }, h('span', null, label), input);
    }),
  );
  refresh();
  return h(
    'div',
    { class: 'stack', style: 'min-width:0;width:100%;overflow-wrap:anywhere' },
    choice,
    description,
    h(
      'details',
      null,
      h('summary', null, 'Project joystick buttons'),
      h(
        'p',
        { class: 'chr-help' },
        'Shared by every character in this project. Short descriptions appear in button choices; long descriptions explain the selected button.',
      ),
      ...fields,
    ),
  );
}
