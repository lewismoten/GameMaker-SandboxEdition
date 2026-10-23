// High score tables (.HIS).
import { registerEditor } from '../registry';
import { h, clear } from '../../core/ui';
import { fileUndo } from '../../core/fileUndo';
import { parseHighScores, serializeHighScores } from '../../../formats/highscore';

registerEditor(['his'], (host, project, file) => {
  let scores = parseHighScores(project.files.get(file)!);
  const undo = fileUndo(project.files, () => {
    const now = project.files.get(file);
    if (now) scores = parseHighScores(now);
    render();
  });
  const stopKeys = undo.listenKeys();
  const save = () => {
    undo.before(file);
    project.files.set(file, serializeHighScores(scores));
  };
  const body = h('tbody');
  const render = () =>
    clear(
      body,
      ...scores.map((s, i) => {
        const score = h('input', { type: 'number', value: String(s.score), min: 0, step: 1, 'aria-label': `Score ${i + 1}` });
        score.addEventListener('change', () => {
          s.score = Math.max(0, Math.round(Number(score.value) || 0));
          score.value = String(s.score);
          save();
        });
        const name = h('input', { type: 'text', value: s.name, maxLength: 22, 'aria-label': `Name ${i + 1}` });
        name.addEventListener('change', () => ((s.name = name.value), save()));
        return h('tr', null, h('td', null, i + 1), h('td', null, score), h('td', null, name));
      }),
    );
  render();
  clear(
    host,
    h('p', { class: 'hint' }, 'The top ten scores shipped with the game.'),
    h('table', { class: 'data his-table' }, h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Score'), h('th', null, 'Name'))), body),
    h(
      'div',
      { class: 'toolbar', style: 'margin-top:8px' },
      undo.undoBtn,
      undo.redoBtn,
      h('button', { onclick: () => (scores.forEach((s) => ((s.score = 0), (s.name = ''))), save(), render()) }, 'Clear all'),
    ),
  );
  return stopKeys;
});
