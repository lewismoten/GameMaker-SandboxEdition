// The Level check panel's report and play buttons: "Open as a report…" (the findings in a
// large dialog with the CSV and printable checklists, widgets/checkReport.ts), and for this
// map's scene "Play and record" (the author plays the scene: where they go is added to their
// heat map, and a try that reaches an exit can be kept for Make a walkthrough;
// widgets/playScene.ts), "Watch the bot" (its route, made for this scene alone if the bot has
// none yet), with "Make the bot's route again" when the map changed since that route was made
// (check/walk/botRoutes.ts), and "Watch my play" (widgets/watchScene.ts). Each loads when first
// used.
import { h, confirmDialog, toast } from '../../../core/ui';
import type { Project } from '../../../core/project';
import type { Finding, Kind } from '../../../check/findings';
import { myPlays } from '../../../check/walk/mine';
import { routeState } from '../../../check/walk/botRoutes';

export interface ExtrasHost {
  project: Project;
  file: string;
  scene: number | undefined;
  /** The findings the panel holds (its last check's). */
  findings: () => Finding[];
  /** The panel's list item for a finding, with its go, fix and accept buttons. */
  item: (f: Finding, accepted: boolean) => HTMLElement;
  /** The kind the panel shows now. */
  filter: () => Kind | 'all';
  /** A Play and record session added `ticks` of play to this map's heat map. */
  addedHeat: (ticks: number) => void;
}

export function checkExtras(host: ExtrasHost): HTMLElement {
  const { project } = host;
  const said = h('p', { class: 'meta lc-status', role: 'status', 'aria-live': 'polite' });
  const say = (what: string) => (said.textContent = what);
  let busy: AbortController | undefined;
  const reportBtn = h(
    'button',
    {
      type: 'button',
      title: 'Every finding in a large window, by kind, with a CSV file and a printable checklist to fix from',
      onclick: () =>
        void import('../../../widgets/checkReport').then((m) =>
          m.openReport({ project, map: host.file, findings: host.findings, item: host.item, filter: host.filter() }),
        ),
    },
    '📋 Open as a report…',
  );
  const watchBotBtn = h('button', { type: 'button', onclick: () => void watchBot() }, '▶ Watch the bot');
  const watchMineBtn = h('button', { type: 'button', onclick: () => void watchMine() }, '▶ Watch my play');
  const remakeBtn = h(
    'button',
    { type: 'button', title: 'Let the bot look for a route through this scene again (up to a minute)', onclick: () => void remake() },
    '↻ Make the bot’s route again',
  );
  const playBtn = h(
    'button',
    {
      type: 'button',
      class: 'primary',
      title: 'Play this scene yourself: where you go is added to your heat map, and a try that reaches an exit can be kept for Make a walkthrough',
      onclick: () => void playAndRecord(),
    },
    '▶ Play and record',
  );
  const routeLine = h('p', { class: 'meta lc-status' });
  const mineLine = h('p', { class: 'meta lc-status' });

  const refresh = () => {
    const scene = host.scene;
    const route = scene === undefined ? undefined : routeState(project, scene);
    remakeBtn.hidden = route?.from !== 'scene';
    routeLine.hidden = !(route?.from === 'scene' && route.stale);
    routeLine.textContent = 'The map changed since the bot’s route was made.';
    const mine = scene === undefined ? undefined : myPlays(project)[scene];
    watchMineBtn.hidden = !mine;
    mineLine.hidden = !mine;
    if (mine)
      mineLine.textContent = `Your play: ${Math.round(mine.ticks / 18.2)} s, kept ${new Date(mine.when).toLocaleDateString()}; Make a walkthrough plays ${mine.use === 'mine' ? 'it' : 'the bot’s instead'}.`;
  };

  /** Runs one job at a time; while it runs its button stops it. */
  const job = async (btn: HTMLButtonElement, label: string, fn: (signal: AbortSignal) => Promise<void>) => {
    if (busy) return busy.abort();
    busy = new AbortController();
    btn.textContent = '■ Stop';
    try {
      await fn(busy.signal);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') say(`That didn’t work: ${(e as Error).message}`);
      else say('Stopped.');
    } finally {
      busy = undefined;
      btn.textContent = label;
      refresh();
    }
  };

  const watchBot = () =>
    job(watchBotBtn, '▶ Watch the bot', async (signal) => {
      if (host.scene === undefined) return;
      const m = await import('../../../widgets/watchScene');
      await m.watchBot(
        project,
        host.scene,
        say,
        () => confirmDialog('Watch the bot', 'The bot has no route through this scene yet. Let it look for one now (up to a minute)?', 'Make one'),
        signal,
      );
    });

  const watchMine = () =>
    job(watchMineBtn, '▶ Watch my play', async (signal) => {
      if (host.scene === undefined) return;
      const m = await import('../../../widgets/watchScene');
      await m.watchMine(project, host.scene, say, signal);
    });

  const remake = () =>
    job(remakeBtn, '↻ Make the bot’s route again', async (signal) => {
      if (host.scene === undefined) return;
      const m = await import('../../../widgets/watchScene');
      await m.makeBotRoute(project, host.scene, say, signal);
    });

  async function playAndRecord(): Promise<void> {
    if (host.scene === undefined) return;
    const { playScene } = await import('../../../widgets/playScene');
    const r = await playScene(project, host.scene, host.file);
    if (r.heatTicks) host.addedHeat(r.heatTicks);
    refresh();
    if (r.kept) toast('Your play is kept: Make a walkthrough plays it for this scene.');
  }

  const playing = h(
    'div',
    { class: 'toolbar lc-plays', role: 'group', 'aria-label': 'Play and watch this scene' },
    playBtn,
    watchBotBtn,
    remakeBtn,
    watchMineBtn,
  );
  const el = h('div', { class: 'stack lc-extras' }, h('div', { class: 'toolbar' }, reportBtn), playing, routeLine, mineLine, said);
  playing.hidden = host.scene === undefined;
  refresh();
  // a map edit can leave the bot's route behind: look again once the edits pause
  let later: ReturnType<typeof setTimeout> | undefined;
  const off = project.onChange(() => {
    clearTimeout(later);
    later = setTimeout(() => (el.isConnected ? refresh() : off()), 500);
  });
  return el;
}
