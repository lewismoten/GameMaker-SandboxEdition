// The Level check panel's "my heat map" controls: choose whose heat map shows (the bot's, yours,
// both combined, or compared), the coverage line with a button to the next area the bot reached
// and you haven't, and Clear. The heat map is recorded by "Play and record" (checkExtras.ts,
// widgets/playScene.ts) and kept in the companion file under the map (section "myHeat"),
// growing with each session.
import { h, selectField, toast, confirmDialog } from '../../../core/ui';
import type { Project } from '../../../core/project';
import { at } from '../../../check/findings';
import { MY_HEAT, coverage, coverageText, unpackMine, type MyHeat, type MyHeatSaved } from './myHeat';
import type { HeatView } from './markInfo';

export interface MyHeatHost {
  project: Project;
  file: string;
  /** The bot's heat steps as shown (undefined before a check). */
  botSteps(): Uint8Array | undefined;
  /** The author's steps, as the panel colors them. */
  mySteps(m: MyHeat): Uint8Array;
  /** The view or the recording changed: draw again. */
  changed(): void;
  goTo(cell: number): void;
  say(text: string): void;
}

export function myHeatControls(host: MyHeatHost): {
  el: HTMLElement;
  view(): HeatView;
  mine(): MyHeat | undefined;
  refresh(): void;
  added(ticks: number): void;
} {
  const { project, file } = host;
  const load = () => project.extras<MyHeatSaved | undefined>(file, MY_HEAT, undefined);
  let kept = load();
  let mine = kept ? unpackMine(kept) : undefined;
  let view: HeatView = 'bot';
  let next = -1;
  let missed: number[] = [];

  const viewField = selectField(
    'Show',
    [
      ['bot', 'The bot’s heat map'],
      ['mine', 'My heat map'],
      ['both', 'Both combined'],
      ['compare', 'Compare: where only you or the bot went'],
    ],
    () => view,
    (v) => ((view = v), host.changed()),
  );
  const line = h('p', { class: 'meta lc-cover' });
  const nextBtn = h(
    'button',
    { type: 'button', title: 'Show the next area the bot reached that you haven’t been to', onclick: () => goNext() },
    '→ Next place you haven’t been',
  );
  const clearBtn = h('button', { type: 'button', onclick: () => void clearMine() }, 'Clear my heat map');
  const about = h('p', { class: 'meta' });
  const box = h(
    'div',
    { class: 'lc-mine', role: 'group', 'aria-label': 'My heat map' },
    viewField,
    about,
    line,
    h('div', { class: 'toolbar' }, nextBtn, clearBtn),
  );
  const el = h('div', { class: 'lc-mine-wrap' }, box);

  /** A Play and record session added `ticks` of play to the kept heat map. */
  function added(ticks: number): void {
    kept = load();
    mine = kept ? unpackMine(kept) : undefined;
    if (view === 'bot') view = host.botSteps() ? 'compare' : 'mine';
    sync();
    host.changed();
    toast(`Kept ${Math.round(ticks / 18.2)} s of play in your heat map.`);
  }

  async function clearMine(): Promise<void> {
    if (!(await confirmDialog('Clear my heat map', 'Forget everywhere you’ve been on this map? The bot’s heat map stays.', 'Clear'))) return;
    project.setExtras(file, MY_HEAT, undefined);
    kept = undefined;
    mine = undefined;
    view = 'bot';
    sync();
    host.changed();
  }

  function goNext(): void {
    if (!missed.length) return;
    next = (next + 1) % missed.length;
    const c = missed[next];
    host.goTo(c);
    host.say(`${at(c)}: only the bot got here (${next + 1} of ${missed.length}).`);
  }

  /** Shows or hides the controls and redoes the coverage line. */
  function sync(): void {
    box.hidden = !kept;
    (viewField.querySelector('select') as HTMLSelectElement).value = view;
    if (!kept) return;
    about.textContent = `Yours: ${kept.sessions} session${kept.sessions === 1 ? '' : 's'}, ${Math.round(kept.ticks / 18.2)} s of play.`;
    const bot = host.botSteps();
    const my = mine && host.mySteps(mine);
    if (!bot || !my) {
      line.textContent = 'Run the check to compare your heat map with the bot’s.';
      nextBtn.hidden = true;
      missed = [];
      return;
    }
    const c = coverage(bot, my);
    line.textContent = coverageText(c);
    missed = c.missed.map((m) => m.cell);
    nextBtn.hidden = !missed.length;
    if (next >= missed.length) next = -1;
  }

  sync();
  return { el, view: () => (kept ? view : 'bot'), mine: () => mine, refresh: sync, added };
}
