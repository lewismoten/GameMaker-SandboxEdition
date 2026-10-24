// "Make a walkthrough": the walkthrough bot (editor/check/walk) plays the project's game scene by
// scene in a Web Worker, with progress and Stop, and says which bot style got through each
// scene, or where it stopped. The walkthrough is kept in the project's companion file (never
// in the game's files) and opens in the walkthrough player, which can save it as an MP4.
import { h, clear, modal, selectField, toast } from '../core/ui';
import type { Project } from '../core/project';
import type { CatalogEntry } from '../../project/files';
import type { Walkthrough } from '../../walkthrough/format';
import { STRATEGIES, type SceneOutcome } from '../check/walk/autoWalk';
import { startWalk, type RunningWalk } from '../check/walk/walkClient';
import './walkDialog.css';

/** What the companion keeps: the walkthrough and how each scene went. */
export interface SavedWalk {
  when: string;
  walk?: Walkthrough;
  won: boolean;
  verifiedWon?: boolean;
  stopped?: string;
  scenes: Omit<SceneOutcome, 'heat'>[];
}

const SECTION = 'walkthrough';
const styleName = (id?: string) => STRATEGIES.find((s) => s.id === id)?.name ?? 'none got through';

export async function walkDialog(project: Project): Promise<void> {
  let saved = project.extras<SavedWalk | undefined>(project.gam, SECTION, undefined);
  let budget = 60;
  let running: RunningWalk | undefined;
  const status = h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' });
  const list = h('ol', { class: 'wd-list', 'aria-label': 'Scenes the bot played' });
  const watchBtn = h('button', { type: 'button', onclick: () => void watch() }, '▶ Watch');
  const runBtn = h('button', { type: 'button', class: 'primary', onclick: () => (running ? running.cancel() : void run()) }, '🤖 Make it');

  const render = () => {
    watchBtn.hidden = !saved?.walk?.timeline.frames;
    if (!saved) {
      status.textContent =
        'No walkthrough yet. The bot plays every scene on the real engine, trying bot styles from quickest to most thorough until one gets through.';
      clear(list);
      return;
    }
    status.textContent = `${new Date(saved.when).toLocaleString()}: ${
      saved.won
        ? saved.verifiedWon === false
          ? 'the bot finished, but the engine’s replay didn’t: look at the last scene'
          : 'the bot played the game to the end.'
        : (saved.stopped ?? 'the bot stopped.')
    }`;
    clear(
      list,
      ...saved.scenes.map((s) =>
        h(
          'li',
          { class: s.strategy ? 'wd-ok' : 'wd-stop' },
          h('strong', null, s.name),
          ` — ${s.strategy ? `${styleName(s.strategy)}, ${((s.ticks ?? 0) / 18.2).toFixed(0)} s of play` : `stopped here (tried: ${s.tried.map(styleName).join(', ') || 'nothing'})`}`,
        ),
      ),
    );
  };

  async function run(): Promise<void> {
    runBtn.textContent = '■ Stop';
    status.textContent = 'Starting the bot…';
    running = startWalk(project.files, { gam: project.gam, id: project.id, budgetMs: budget * 1000 }, (what) => (status.textContent = what));
    try {
      const { result, verified } = await running.done;
      saved = {
        when: new Date().toISOString(),
        walk: result.walk,
        won: result.won,
        verifiedWon: verified?.won,
        stopped: result.stopped,
        scenes: result.scenes.map(({ heat: _h, ...s }) => s),
      };
      project.setExtras(project.gam, SECTION, saved);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast(`The walkthrough bot failed: ${(e as Error).message}`, 'error');
    } finally {
      running = undefined;
      runBtn.textContent = '🤖 Make it';
      render();
    }
  }

  async function watch(): Promise<void> {
    const walk = saved?.walk;
    if (!walk) return;
    const title = project.game().scenes[0]?.desc.trim() || project.name;
    const entry = { id: `project:${project.id}`, title, gam: project.gam, kind: 'mine', path: '', files: [] } as unknown as CatalogEntry;
    const { watchWalkthrough } = await import('../../walkthrough/player');
    await watchWalkthrough(entry, () => Promise.resolve(project.files), undefined, walk);
  }

  render();
  await modal<void>('Make a walkthrough', () =>
    h(
      'div',
      { class: 'stack wd' },
      h(
        'div',
        { class: 'toolbar' },
        selectField(
          'Time for each scene',
          [
            [30, '30 s'],
            [60, '1 minute'],
            [180, '3 minutes'],
            [600, '10 minutes'],
          ],
          () => budget,
          (v) => (budget = v),
        ),
        runBtn,
        watchBtn,
      ),
      status,
      list,
    ),
  );
  running?.cancel();
}
