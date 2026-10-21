// High score tables (.HIS).
import { registerEditor } from './index';
import { h, clear, numberField } from '../ui';
import { parseHighScores, serializeHighScores } from '../../formats/highscore';

registerEditor(['his'], (host, project, file) => {
  const scores = parseHighScores(project.files.get(file)!);
  const save = () => project.files.set(file, serializeHighScores(scores));
  const body = h('tbody');
  const render = () =>
    clear(
      body,
      ...scores.map((s, i) =>
        h(
          'tr',
          null,
          h('td', null, i + 1),
          h(
            'td',
            null,
            numberField(
              '',
              () => s.score,
              (v) => ((s.score = v), save()),
              { min: 0, title: `Score ${i + 1}` },
            ),
          ),
          h(
            'td',
            null,
            (() => {
              const input = h('input', { type: 'text', value: s.name, maxLength: 22, 'aria-label': `Name ${i + 1}` });
              input.addEventListener('change', () => ((s.name = input.value), save()));
              return input;
            })(),
          ),
        ),
      ),
    );
  render();
  clear(
    host,
    h('p', { class: 'hint' }, 'The top ten scores shipped with the game.'),
    h('table', { class: 'data' }, h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Score'), h('th', null, 'Name'))), body),
    h(
      'div',
      { class: 'toolbar', style: 'margin-top:8px' },
      h('button', { onclick: () => (scores.forEach((s) => ((s.score = 0), (s.name = ''))), save(), render()) }, 'Clear all'),
    ),
  );
});
