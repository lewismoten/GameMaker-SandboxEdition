// "Make a walkthrough": the walkthrough bot (editor/check/walk) plays the game scene by scene in
// a Web Worker, with progress and Stop, and says which bot style got through each scene, or
// where it stopped. It opens from the Integrator and, for any game, from the home page's panel
// (homeWalk.ts). What it made is kept (check/walk/keptWalk.ts) in the project's companion file,
// never in the game's files; a look-only game keeps it in this browser apart from the game.
// A walkthrough the bot made only partway still plays, as far as it got, and ends on a card that
// says so. Stop keeps the scenes it got through. Any scene it played or stopped in can be played
// by the person ("Play it myself": Play and record, playScene.ts, check/walk/mine.ts), and each
// scene with such a play is "Mine" or "Bot"; making it again plays the scenes before as it did
// (autoWalk's `reuse`), then the person's, then goes on. A play that no longer reaches an exit is
// said so, and the bot plays that scene. In a scene with walking paths (marked in the block
// editor, check/walk/walkPaths.ts) it says how much of the route keeps to them.
import { h, clear, modal, selectField, toast } from '../core/ui';
import type { Project } from '../core/project';
import type { CatalogEntry } from '../../project/files';
import type { Walkthrough } from '../../walkthrough/format';
import { MINE, STRATEGIES, type SceneOutcome } from '../check/walk/autoWalk';
import { dropPlay, myPlays, playsToUse, usePlay } from '../check/walk/mine';
import { startWalk, type RunningWalk } from '../check/walk/walkClient';
import { allWalkPaths } from '../check/walk/walkPaths';
import { howFar, lookOnlyKept, reuseFrom, savedFrom, WALK_SECTION, type SavedWalk } from '../check/walk/keptWalk';
import { unlockAchievement } from '../../achievements';
import './walkDialog.css';

export interface WalkDialogOptions {
  /** Opened from the home page, not the editor. */
  home?: boolean;
  /** A CD game open to look at only: its catalog entry (the player's address and DOS player look). */
  entry?: CatalogEntry;
  /** A look-only game: whether this browser keeps its walkthrough (keptWalk.ts keepLookOnly); false, it lasts until the page closes. */
  keeps?: () => boolean;
  /** Heard when the kept walkthrough changes. */
  onChange?: () => void;
}

const styleName = (id?: string) => (id === MINE.id ? MINE.name : (STRATEGIES.find((s) => s.id === id)?.name ?? 'none got through'));
const secs = (ticks?: number) => ((ticks ?? 0) / 18.2).toFixed(0);

/** Opens a walkthrough the bot made in the walkthrough player (a CD game's `entry`: its own address and DOS player look). */
export async function watchMade(project: Project, walk: Walkthrough, entry?: CatalogEntry): Promise<void> {
  const [{ watchWalkthrough }, { companionPatches }] = await Promise.all([import('../../walkthrough/player'), import('../../dosPlayer/playerRecord')]);
  if (entry) return watchWalkthrough(entry, () => Promise.resolve(project.files), undefined, walk);
  const title = project.game().scenes[0]?.desc.trim() || project.name;
  const mine = { id: `project:${project.id}`, title, gam: project.gam, kind: 'mine', path: '', files: [] } as unknown as CatalogEntry;
  return watchWalkthrough(mine, () => Promise.resolve(project.files), undefined, walk, undefined, companionPatches(project.companion, project.gam));
}

export async function walkDialog(project: Project, given: WalkDialogOptions = {}): Promise<void> {
  // a look-only game opened with Look inside keeps its walkthrough as the home page's does
  const kept = lookOnlyKept(project);
  const opt: WalkDialogOptions = { keeps: kept?.keeps, ...given };
  let saved = project.extras<SavedWalk | undefined>(project.gam, WALK_SECTION, undefined);
  let budget = 60;
  let running: RunningWalk | undefined;
  let stopping = false;
  const game = () => project.game();
  const sceneName = (n: number) => game().scenes[n]?.desc.trim() || `Scene ${n}`;
  /** The scene's map, when it has one to play on. */
  const mapOf = (n: number) => {
    const m = game().scenes[n]?.files[1];
    return m && project.files.has(m) ? (project.files.resolve(m) ?? m) : undefined;
  };
  const status = h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' });
  const far = h('p', { class: 'wd-far', hidden: true });
  const list = h('ol', { class: 'wd-list', 'aria-label': 'Scenes the bot played' });
  const playsBox = h('div', { class: 'wd-plays' });
  const watchBtn = h('button', { type: 'button', onclick: () => void watch() }, '▶ Watch');
  let stoppedMap: string | undefined;
  const mapLink = h('a', { class: 'wd-map', hidden: true }, '🗺 See where the bot got to on the map (Level check 🩺)');
  const runBtn = h('button', { type: 'button', class: 'primary', onclick: () => press() }, '🤖 Make it');

  /** Mine or Bot for a scene with a kept play, and Forget. */
  const playControls = (scene: number) => {
    const p = myPlays(project)[scene];
    if (!p) return [];
    return [
      selectField(
        'Play',
        [
          ['mine', 'Mine'],
          ['bot', 'Bot'],
        ],
        () => p.use,
        (v) => {
          usePlay(project, scene, v);
          status.textContent = `${sceneName(scene)}: ${v === 'mine' ? 'your play' : 'the bot'} plays it when you make it again.`;
        },
        `Who plays ${sceneName(scene)} in the walkthrough`,
      ),
      h(
        'button',
        {
          type: 'button',
          title: 'Forget this play',
          'aria-label': `Forget your play of ${sceneName(scene)}`,
          onclick: () => {
            dropPlay(project, scene);
            renderAll();
          },
        },
        '🗑 Forget',
      ),
    ];
  };

  /** "Play it myself": the scene on the real player, the play kept for the walkthrough. */
  const playBtn = (scene: number, stuck = false) => {
    const map = mapOf(scene);
    if (!map) return null;
    const mine = !!myPlays(project)[scene];
    return h(
      'button',
      {
        type: 'button',
        class: stuck ? 'primary wd-myself' : 'wd-myself',
        'aria-label': `${mine ? 'Play again' : 'Play'} ${sceneName(scene)} yourself and record it for the walkthrough`,
        title: 'Play this scene on the real engine; reach an exit to keep your play for the walkthrough',
        onclick: () => void playMyself(scene, map),
      },
      mine ? '🎮 Play it again' : '🎮 Play it myself',
    );
  };

  async function playMyself(scene: number, map: string): Promise<void> {
    const { playScene } = await import('./playScene');
    const r = await playScene(project, scene, map);
    renderAll();
    if (r.kept) {
      status.textContent = `Your play of ${sceneName(scene)} is kept (Mine). Make it again: the bot plays the scenes before it as it did, then yours, then goes on.`;
      runBtn.focus();
    }
  }

  /** Kept plays of scenes the walkthrough doesn't list (Level check 🩺, Play and record). */
  const renderPlays = () => {
    const listed = new Set(saved?.scenes.map((s) => s.scene));
    const plays = Object.values(myPlays(project))
      .filter((p) => !listed.has(p.scene))
      .sort((a, b) => a.scene - b.scene);
    clear(
      playsBox,
      ...(plays.length
        ? [
            h('h3', null, 'Your other plays'),
            h(
              'p',
              { class: 'meta' },
              'Scenes you played and kept that this walkthrough hasn’t reached yet. Mine plays your keys there; Bot lets the bot play it.',
            ),
            h(
              'ul',
              { class: 'wd-list wd-mine' },
              ...plays.map((p) =>
                h(
                  'li',
                  null,
                  h('strong', null, sceneName(p.scene)),
                  ` — ${secs(p.ticks)} s, kept ${new Date(p.when).toLocaleDateString()} `,
                  ...playControls(p.scene),
                ),
              ),
            ),
          ]
        : []),
    );
  };

  const sceneRow = (s: Omit<SceneOutcome, 'heat'>) =>
    h(
      'li',
      { class: s.strategy ? 'wd-ok' : 'wd-stop' },
      h(
        'span',
        { class: 'wd-what' },
        h('strong', null, s.name),
        ` — ${s.strategy ? `${styleName(s.strategy)}, ${secs(s.ticks)} s of play` : s.tried.length ? `stopped here (tried: ${s.tried.map(styleName).join(', ')})` : 'stopped here'}`,
        s.strategy && s.paths ? `, ${Math.round(s.paths.share * 100)}% on the walking paths${s.paths.kept ? ' (it kept to them)' : ''}` : '',
        s.mine === 'broke'
          ? h(
              'small',
              { class: 'wd-broke' },
              ' Your play no longer reaches an exit from here (the map or what the hero carries in has changed), so the bot played it.',
            )
          : null,
      ),
      h('span', { class: 'wd-row-tools' }, ...playControls(s.scene), playBtn(s.scene, !s.strategy)),
    );

  const render = () => {
    watchBtn.hidden = !saved?.walk?.timeline.frames;
    mapLink.hidden = !stoppedMap;
    if (stoppedMap) mapLink.href = `#/p/${project.id}/${encodeURIComponent(stoppedMap)}`;
    if (!running) runBtn.textContent = saved ? '🤖 Make it again' : '🤖 Make it';
    if (!saved) {
      status.textContent =
        'No walkthrough yet. The bot plays every scene on the real engine, trying bot styles from quickest to most thorough until one gets through.';
      far.hidden = true;
      clear(list);
      return;
    }
    const { through, stoppedIn } = howFar(saved);
    status.textContent = `${new Date(saved.when).toLocaleString()}: ${
      saved.won
        ? saved.verifiedWon === false
          ? 'the bot finished, but the engine’s replay didn’t: look at the last scene'
          : 'the bot played the game to the end.'
        : saved.stopped === 'Stopped.'
          ? 'you stopped the bot.'
          : (saved.stopped ?? 'the bot stopped.')
    }`;
    far.hidden = saved.won;
    far.textContent = saved.won
      ? ''
      : `${
          through
            ? `The walkthrough plays the ${through === 1 ? 'first scene' : `first ${through} scenes`} and ends where the bot stopped${stoppedIn ? `, in ${stoppedIn.name}` : ''}, with a card that says so.`
            : 'The bot got through no scene, so there is nothing to watch yet.'
        }${stoppedIn && mapOf(stoppedIn.scene) ? ` Play ${stoppedIn.name} yourself, then make it again to go on from there.` : ''}`;
    clear(list, ...saved.scenes.map(sceneRow));
  };
  const renderAll = () => {
    render();
    renderPlays();
  };

  function press(): void {
    if (!running) return void run();
    if (stopping) return running.cancel();
    // the first press keeps what it got through; a second ends it on the spot
    stopping = true;
    running.stop();
    runBtn.textContent = '■ Stop now';
    status.textContent = 'Stopping: keeping the scenes it got through…';
  }

  async function run(): Promise<void> {
    runBtn.textContent = '■ Stop';
    status.textContent = 'Starting the bot…';
    stopping = false;
    running = startWalk(
      project.files,
      {
        gam: project.gam,
        id: project.id,
        budgetMs: budget * 1000,
        mine: playsToUse(project),
        paths: allWalkPaths(project, project.game()),
        reuse: reuseFrom(saved),
      },
      (what) => (status.textContent = stopping ? `Stopping: ${what}` : what),
    );
    try {
      const { result, verified } = await running.done;
      saved = savedFrom(result, verified);
      project.setExtras(project.gam, WALK_SECTION, saved);
      opt.onChange?.();
      // "your game": a look-only game's walkthrough is kept, but isn't one of yours
      if (result.walk?.timeline.frames && !project.readOnly) unlockAchievement('make-walk');
      // where the bot stopped, on that scene's map: the Level check panel shows its heat map
      // (from the home page, a look-only game's is gone once this closes, so no link)
      const stuck = result.scenes.find((x) => x.heat);
      const mapName = stuck && mapOf(stuck.scene);
      stoppedMap = undefined;
      if (stuck?.heat && mapName && !(opt.home && project.readOnly)) {
        const { keepBotHeat } = await import('../editors/map/check/checkPanel');
        keepBotHeat(project, mapName, stuck.scene, stuck.heat, `The walkthrough bot got this far in ${stuck.name} and found no way on`);
        stoppedMap = mapName;
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast(`The walkthrough bot failed: ${(e as Error).message}`, 'error');
    } finally {
      running = undefined;
      stopping = false;
      renderAll();
      // where it stopped: the way on is the person's play of that scene
      if (saved && !saved.won) list.querySelector<HTMLElement>('.wd-stop .wd-myself')?.focus();
    }
  }

  async function watch(): Promise<void> {
    if (saved?.walk) await watchMade(project, saved.walk, opt.entry);
  }

  /** What a look-only game's walkthrough is kept as. */
  const keptNote = () =>
    project.readOnly
      ? h(
          'p',
          { class: 'wd-kept' },
          opt.keeps?.()
            ? `${project.readOnly.title} is open to look at only. This walkthrough and your plays are kept in this browser, apart from the game’s files (they are never changed). Edit a copy to keep them with a game of yours.`
            : `${project.readOnly.title} is open to look at only. This walkthrough and your plays last only until this page closes; the game’s files are never changed. Edit a copy to keep them.`,
        )
      : null;

  renderAll();
  await modal<void>('Make a walkthrough', (close) => {
    // going to the map closes this
    mapLink.onclick = () => close(undefined);
    return h(
      'div',
      { class: 'stack wd' },
      h(
        'p',
        { class: 'hint' },
        'The bot plays each scene on the real engine. If it gets stuck, the walkthrough still plays as far as it got. You can play any scene yourself and choose Mine or Bot for it; making it again goes on from there.',
      ),
      keptNote(),
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
      far,
      list,
      playsBox,
      mapLink,
    );
  });
  running?.cancel();
}
