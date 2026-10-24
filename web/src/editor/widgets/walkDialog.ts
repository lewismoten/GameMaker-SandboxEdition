// "Make a walkthrough": the walkthrough bot (editor/check/walk) plays the project's game scene by
// scene in a Web Worker, with progress and Stop, and says which bot style got through each
// scene, or where it stopped. The walkthrough is kept in the project's companion file (never
// in the game's files) and opens in the walkthrough player, which can save it as an MP4. A scene
// the author has played (Level check's Record my play, check/walk/mine.ts) can use that play
// ("Mine") or the bot's ("Bot"); a play that no longer reaches an exit is said so, and the bot
// plays that scene.
import { h, clear, modal, selectField, toast } from '../core/ui';
import type { Project } from '../core/project';
import type { CatalogEntry } from '../../project/files';
import type { Walkthrough } from '../../walkthrough/format';
import { MINE, STRATEGIES, type SceneOutcome } from '../check/walk/autoWalk';
import { dropPlay, myPlays, playsToUse, usePlay } from '../check/walk/mine';
import { startWalk, type RunningWalk } from '../check/walk/walkClient';
import { unlockAchievement } from '../../achievements';
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
const styleName = (id?: string) => (id === MINE.id ? MINE.name : (STRATEGIES.find((s) => s.id === id)?.name ?? 'none got through'));

export async function walkDialog(project: Project): Promise<void> {
  let saved = project.extras<SavedWalk | undefined>(project.gam, SECTION, undefined);
  let budget = 60;
  let running: RunningWalk | undefined;
  const status = h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' });
  const list = h('ol', { class: 'wd-list', 'aria-label': 'Scenes the bot played' });
  const playsBox = h('div', { class: 'wd-plays' });
  /** The author's kept plays: each scene's Mine or Bot. */
  const renderPlays = () => {
    const plays = Object.values(myPlays(project)).sort((a, b) => a.scene - b.scene);
    clear(
      playsBox,
      ...(plays.length
        ? [
            h('h3', null, 'Your plays'),
            h('p', { class: 'meta' }, 'Scenes you played and kept (Level check 🩺, Record my play). Mine plays your keys there; Bot lets the bot play it.'),
            h(
              'ul',
              { class: 'wd-list wd-mine' },
              ...plays.map((p) =>
                h(
                  'li',
                  null,
                  h('strong', null, project.game().scenes[p.scene]?.desc.trim() || `Scene ${p.scene}`),
                  ` — ${(p.ticks / 18.2).toFixed(0)} s, kept ${new Date(p.when).toLocaleDateString()} `,
                  selectField(
                    'Play',
                    [
                      ['mine', 'Mine'],
                      ['bot', 'Bot'],
                    ],
                    () => p.use,
                    (v) => usePlay(project, p.scene, v),
                    `Who plays ${project.game().scenes[p.scene]?.desc.trim() || `scene ${p.scene}`} in the walkthrough`,
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      title: 'Forget this play',
                      onclick: () => {
                        dropPlay(project, p.scene);
                        renderPlays();
                      },
                    },
                    '🗑 Forget',
                  ),
                ),
              ),
            ),
          ]
        : []),
    );
  };
  const watchBtn = h('button', { type: 'button', onclick: () => void watch() }, '▶ Watch');
  let stoppedMap: string | undefined;
  const mapLink = h('a', { class: 'wd-map', hidden: true }, '🗺 See where the bot got to on the map (Level check 🩺)');
  const runBtn = h('button', { type: 'button', class: 'primary', onclick: () => (running ? running.cancel() : void run()) }, '🤖 Make it');

  const render = () => {
    watchBtn.hidden = !saved?.walk?.timeline.frames;
    mapLink.hidden = !stoppedMap;
    if (stoppedMap) mapLink.href = `#/p/${project.id}/${encodeURIComponent(stoppedMap)}`;
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
          s.mine === 'broke'
            ? h(
                'small',
                { class: 'wd-broke' },
                ' Your play no longer reaches an exit from here (the map or what the hero carries in has changed), so the bot played it.',
              )
            : null,
        ),
      ),
    );
  };

  async function run(): Promise<void> {
    runBtn.textContent = '■ Stop';
    status.textContent = 'Starting the bot…';
    running = startWalk(
      project.files,
      { gam: project.gam, id: project.id, budgetMs: budget * 1000, mine: playsToUse(project) },
      (what) => (status.textContent = what),
    );
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
      if (result.walk?.timeline.frames) unlockAchievement('make-walk');
      // where the bot stopped, on that scene's map: the Level check panel shows its heat map
      const stuck = result.scenes.find((x) => x.heat);
      const mapName = stuck && project.game().scenes[stuck.scene]?.files[1];
      if (stuck?.heat && mapName && project.files.has(mapName)) {
        const { keepBotHeat } = await import('../editors/map/check/checkPanel');
        keepBotHeat(
          project,
          project.files.resolve(mapName) ?? mapName,
          stuck.scene,
          stuck.heat,
          `The walkthrough bot got this far in ${stuck.name} and found no way on`,
        );
        stoppedMap = project.files.resolve(mapName) ?? mapName;
      }
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
  renderPlays();
  await modal<void>('Make a walkthrough', (close) => {
    // going to the map closes this
    mapLink.onclick = () => close(undefined);
    return h(
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
      playsBox,
      status,
      list,
      mapLink,
    );
  });
  running?.cancel();
}
