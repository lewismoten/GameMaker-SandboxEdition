// The Level check panel's report and play buttons: "Open as a report…" (the findings in a
// large dialog with the CSV and printable checklists, widgets/checkReport.ts), and for this
// map's scene "Watch the bot" (its route, made for this scene alone if the bot has none yet),
// "Record my play" (the author plays the scene to an exit; the keys are kept for Make a
// walkthrough) and "Watch my play" (widgets/playScene.ts, watchScene.ts). Each loads when first
// used.
import { h, confirmDialog, toast } from '../../../core/ui';
import type { Project } from '../../../core/project';
import type { Finding, Kind } from '../../../check/findings';
import { keepPlay, myPlays } from '../../../check/walk/mine';

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
  const recordBtn = h(
    'button',
    { type: 'button', title: 'Play this scene to an exit; your keys are kept for Make a walkthrough', onclick: () => void record() },
    '● Record my play',
  );
  const mineLine = h('p', { class: 'meta lc-status' });

  const refresh = () => {
    const scene = host.scene;
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

  async function record(): Promise<void> {
    if (host.scene === undefined) return;
    const { playScene } = await import('../../../widgets/playScene');
    const take = await playScene(project, host.scene);
    if (!take) return;
    keepPlay(project, take);
    refresh();
    toast('Your play is kept: Make a walkthrough plays it for this scene.');
  }

  const playing = h('div', { class: 'toolbar lc-plays', role: 'group', 'aria-label': 'Watch and play this scene' }, watchBotBtn, recordBtn, watchMineBtn);
  const el = h('div', { class: 'stack lc-extras' }, h('div', { class: 'toolbar' }, reportBtn), playing, mineLine, said);
  playing.hidden = host.scene === undefined;
  refresh();
  return el;
}
