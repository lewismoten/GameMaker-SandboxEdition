// The Saves & scores panel's high-score table: ten scores and names to change, sort or clear, with
// a warning where the game would show or order them oddly.
import { h, clear } from '../editor/core/ui';
import { highScoreFileName, HIGH_SCORE_NAME_MAX, highScoreWarnings, SCORE_MAX, SCORE_MIN, sortHighScores, writeHighScores } from '../project/saveData';
import { tip } from './tip';
import type { Panel } from './panelState';

export function renderScores(p: Panel): void {
  const { main, target } = p;
  const saves = p.saves!;
  p.scores ??= saves.highScores.entries.map((e) => ({ ...e }));
  const list = p.scores;
  const status = h('p', { class: 'sv-status', role: 'status' });
  const saveBtn = h('button', { type: 'button', class: 'primary', onclick: () => void commitScores(p) }, 'Save changes');
  const undoBtn = h('button', { type: 'button', onclick: () => ((p.scores = undefined), p.render()) }, 'Undo changes');
  const refreshState = () => {
    const dirty = p.dirtyScores();
    saveBtn.disabled = undoBtn.disabled = !dirty;
    const order = list.some((e, i) => i > 0 && e.score > list[i - 1].score)
      ? ' ⚠ Not highest first: the game puts a new score above the first lower one it finds, so use Sort by score.'
      : '';
    status.textContent = (dirty ? 'Not saved yet.' : p.saves!.highScoresFromDisk ? 'The table this game came with.' : '') + order;
    p.renderNav();
  };
  const rows = list.map((e, i) => {
    const warn = h('td', { class: 'sv-warn-cell', id: `sv-hs-${i}-warn` });
    const showWarn = () => {
      const w = highScoreWarnings(e);
      clear(warn, ...w.map((x) => h('span', null, '⚠ ', x)));
    };
    showWarn();
    return h(
      'tr',
      null,
      h('th', { scope: 'row' }, String(i + 1)),
      h(
        'td',
        null,
        h('input', {
          type: 'number',
          inputmode: 'numeric',
          min: SCORE_MIN,
          max: SCORE_MAX,
          step: 1,
          value: String(e.score),
          'aria-label': `Score, place ${i + 1}`,
          'aria-describedby': `sv-hs-${i}-warn`,
          onchange: (ev: Event) => {
            const t = ev.target as HTMLInputElement;
            const n = Math.trunc(Math.min(SCORE_MAX, Math.max(SCORE_MIN, Number(t.value) || 0)));
            e.score = n;
            t.value = String(n);
            showWarn();
            refreshState();
          },
        }),
      ),
      h(
        'td',
        null,
        h('input', {
          type: 'text',
          value: e.name,
          maxlength: 29,
          spellcheck: false,
          'aria-label': `Name, place ${i + 1}`,
          'aria-describedby': `sv-hs-${i}-warn`,
          oninput: (ev: Event) => {
            e.name = (ev.target as HTMLInputElement).value;
            showWarn();
            refreshState();
          },
        }),
      ),
      warn,
    );
  });
  clear(
    main,
    h(
      'header',
      { class: 'sv-head' },
      h(
        'div',
        { class: 'sv-label-row' },
        h('h3', { class: 'sv-title', tabindex: -1 }, 'High scores'),
        tip(
          'the high scores',
          `The Top Ten screen shows a score in 10 columns and hides a score of 0. Players type up to ${HIGH_SCORE_NAME_MAX} letters; a new score goes in above every lower one, so keep the table highest first.`,
        ).el,
      ),
      h('p', { class: 'sv-where' }, saves.highScoreFile ?? highScoreFileName(target.gam ?? 'game')),
    ),
    h(
      'div',
      { class: 'sv-tools', role: 'toolbar', 'aria-label': 'High scores' },
      saveBtn,
      undoBtn,
      h('button', { type: 'button', onclick: () => ((p.scores = sortHighScores(list)), p.render(), refreshState()) }, 'Sort by score'),
      h('button', { type: 'button', class: 'danger', onclick: () => ((p.scores = list.map(() => ({ score: 0, name: '' }))), p.render()) }, 'Clear table'),
    ),
    status,
    h(
      'div',
      { class: 'sv-table-wrap' },
      h(
        'table',
        { class: 'sv-scores' },
        h('caption', { class: 'sv-sr' }, 'Top ten scores'),
        h(
          'thead',
          null,
          h(
            'tr',
            null,
            h('th', { scope: 'col' }, '#'),
            h('th', { scope: 'col' }, 'Score'),
            h('th', { scope: 'col' }, 'Name'),
            h('th', { scope: 'col' }, h('span', { class: 'sv-sr' }, 'Warnings')),
          ),
        ),
        h('tbody', null, rows),
      ),
    ),
  );
  refreshState();
}

async function commitScores(p: Panel): Promise<void> {
  const { target } = p;
  if (!p.scores || !p.saves) return;
  await p.safety();
  const saves = p.saves;
  await writeHighScores(target.saveId, saves.highScoreFile ?? highScoreFileName(target.gam ?? 'game'), { entries: p.scores, raw: saves.highScores.raw });
  p.scores = undefined;
  await p.reload();
  p.toast('High scores saved.');
  p.render();
}
