// The joystick button picker; the game-wide button descriptions are written in Overview › Controls.
import type { Project } from '../../core/project';
import { gameControls } from '../../core/gameControls';
import { joystickButtonOptions } from '../../core/joystickButtons';
import { h, selectField } from '../../core/ui';
import { overviewLink } from '../../shell/overviewLink';

export function joystickControls(project: Project, get: () => number, set: (value: number) => void): HTMLElement {
  const buttons = () => gameControls(project).joystick;
  const description = h('p', { class: 'chr-help', 'aria-live': 'polite' });
  const choice = selectField('Joystick button', joystickButtonOptions(buttons()), get, (value) => {
    set(value);
    refresh();
  });
  function refresh(): void {
    const b = buttons();
    description.textContent = ([1, 2] as const)
      .filter((index) => get() === index || get() === 3)
      .map((index) => (b[index]?.long ? `Button ${index}: ${b[index].long}` : ''))
      .filter(Boolean)
      .join(' ');
    description.hidden = !description.textContent;
  }
  refresh();
  return h(
    'div',
    { class: 'stack', style: 'min-width:0;width:100%;overflow-wrap:anywhere' },
    choice,
    description,
    overviewLink(project, 'controls', 'Describe the joystick buttons in Overview › Controls'),
  );
}
