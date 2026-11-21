// The map editor's Level check panel: runs the level check (editor/check) on this map's scene
// in a Web Worker, shows where the bot went as a heat map over the map, marks stuck areas,
// deaths and each finding's cells, and lists the findings: a click goes to the place, a link
// opens the guide's chapter, and a fix button offers the matching generator. A warning from a
// design-preference check (CheckInfo.taste) is shown as a suggestion. A finding meant to
// be can be marked as checked (check/accepted.ts): it leaves the list and the counts, and the
// "accepted" toggle shows it again. The last check of this map is kept in the project's
// companion file (editor-only), so it is there next time. While the check runs, the heat map and
// deaths fill in as the bot plays (check/live.ts), under a bar that says when it will be done.
// Resting the pointer on a mark tells what it means (markInfo.ts); the legend lists each mark,
// and its buttons step through them from the keyboard. The author can also play the scene and
// keep a heat map of their own (myHeatControls.ts), shown instead of, with, or against the bot's.
// checkExtras.ts adds the report (a dialog, a CSV and a printable checklist), Play and record
// (the author's heat map and a play for the walkthrough, in one session), and watching the
// bot's route or the author's play.
import './checkPanel.css';
import { levelCheckNote } from '../../integrator/sceneRole';
import { h, clear, checkField, numberField, selectField, toast } from '../../../core/ui';
import type { Project } from '../../../core/project';
import type { MapSelection } from '../tools/selection';
import type { OverlayState } from '../tools/overlay';
import { HEAT_COLORS } from '../tools/overlay';
import { STEADY_MS, at } from '../../../check/findings';
import { mazeFor } from '../../../check/generators/mazeFor';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { MARKS, describeCell, heatWords, type HeatView } from './markInfo';
import { COMPARE_COLORS, combineSteps, compareSteps } from './myHeat';
import { myHeatControls } from './myHeatControls';
import { checkExtras } from './checkExtras';
import { checkRun, heatSteps, unpack } from './checkRun';
import { checkFindings } from './checkFindings';
export { keepBotHeat, secondsText, liveText } from './checkRun';

interface CheckHost {
  project: Project;
  /** The map file being edited. */
  file: string;
  /** The scene this map is played in (undefined when no scene uses it). */
  scene: number | undefined;
  overlay: OverlayState;
  redraw(): void;
  /** Scrolls the map to a cell and shows it. */
  goTo(cell: number): void;
  /** A fix changed these files: read them again. */
  reload(files: string[]): void;
  /** The cells selected with the Select tool, if any. */
  selection(): MapSelection | undefined;
  /** Paints [cell, block] pairs as one step of the map's own Undo. */
  paint(cells: [number, number][]): void;
}

/** "Gray level" is a way of looking, not part of the game, so it is kept per viewer (all maps). */
const GRAY_KEY = 'gm-map-gray';
function readGray(): boolean {
  try {
    return localStorage.getItem(GRAY_KEY) === '1';
  } catch {
    return false;
  }
}
function writeGray(on: boolean): void {
  try {
    localStorage.setItem(GRAY_KEY, on ? '1' : '0');
  } catch {
    /* remembered for this visit only */
  }
}
export function checkPanel(host: CheckHost): {
  el: HTMLElement;
  shown(): boolean;
  toggle(on?: boolean): void;
  /** What the Level check draws at a cell, as tooltip lines (none while the panel is closed): the
   * nearest mark within `near` cells (zoomed out, a mark is a dot), and the heat at the cell. */
  describe(cell: number, near?: number): string[];
} {
  const { project, file } = host;
  let showHeat = true;
  let gray = readGray();
  let soon = false;
  let showMarks = true;

  const status = h('p', { class: 'meta lc-status', role: 'status', 'aria-live': 'polite' });
  const bar = h('progress', { class: 'lc-progress', max: 1, value: 0, 'aria-label': 'Level check progress', hidden: true });
  // while a check runs this line changes every second; the status above is told only every few
  const progressLine = h('p', { class: 'meta lc-status lc-live', hidden: true });
  // a mark picked from the legend or the list, read out
  const said = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  const runBtn = h('button', { type: 'button', class: 'primary', onclick: () => (state.running ? runner.stop() : void runner.run()) }, '▶ Run check');
  const runner = checkRun(host, {
    runBtn,
    bar,
    status,
    progressLine,
    clearFocus: () => {
      focus = undefined;
    },
    showToggles: () => {
      toggles.hidden = false;
    },
    hidden: () => el.hidden,
    paint,
    render,
  });
  const { state } = runner;
  const findings = checkFindings(host, state, {
    said,
    focus: (cell) => {
      focus = cell;
    },
    paint,
    describe,
    render,
    save: runner.save,
  });
  const { undoBtn, list, acceptedBox, counts } = findings;
  const heatLegend = h(
    'div',
    { class: 'lc-legend' },
    h('span', { class: 'lc-legend-label' }),
    h('span', { class: 'lc-ramp', 'aria-hidden': 'true' }, ...HEAT_COLORS.map((c) => h('i', { style: `background:${c}` }))),
    h('span', { class: 'lc-legend-ends' }),
  );
  /** A legend entry for each kind of mark: a button that shows the next one on the map. */
  const markKinds = ['death', 'stuck', 'finding'] as const;
  const markBtns = Object.fromEntries(
    markKinds.map((k) => [
      k,
      h(
        'button',
        { type: 'button', class: 'lc-mark-btn', title: `Show the next ${MARKS[k].label.toLowerCase()} on the map`, onclick: () => nextMark(k) },
        h('i', { class: `lc-sw lc-sw-${k}`, 'aria-hidden': 'true' }),
        h('span', null),
      ),
    ]),
  ) as Record<(typeof markKinds)[number], HTMLButtonElement>;
  const focusKey = h('span', { class: 'lc-mark-key' }, h('i', { class: 'lc-sw lc-sw-focus', 'aria-hidden': 'true' }), ' Picked from the list');
  const markLegend = h(
    'div',
    { class: 'lc-legend lc-marks', role: 'group', 'aria-label': 'Marks on the map' },
    ...markKinds.map((k) => markBtns[k]),
    focusKey,
    h('span', { class: 'lc-legend-hint' }, 'Rest the pointer on a mark to see what it is.'),
  );
  const cmpLegend = h(
    'div',
    { class: 'lc-legend' },
    ...['Only the bot', 'Only you', 'Both'].map((t, i) =>
      h('span', { class: 'lc-mark-key' }, h('i', { class: 'lc-sw', style: `background:${COMPARE_COLORS[i]}`, 'aria-hidden': 'true' }), t),
    ),
  );
  const legend = h('div', { class: 'lc-legends' }, heatLegend, cmpLegend, markLegend);
  const legendText = (view: HeatView) => {
    const who = view === 'mine' ? ' (you)' : view === 'both' ? ' (either)' : '';
    heatLegend.querySelector('.lc-legend-label')!.textContent = soon ? `Reached${who}:` : `Time spent${who}:`;
    heatLegend.querySelector('.lc-legend-ends')!.textContent = soon ? 'late → early' : 'a moment → a lot';
  };
  const grayToggle = toggle(
    'Gray level',
    () => gray,
    (v) => ((gray = v), writeGray(v), paint()),
    'Draws the map in its palette’s lightness only, so the heat map’s colors stand out. The map’s files are not changed.',
  );
  const grayBox = grayToggle.querySelector('input')!;
  const toggles = h(
    'div',
    { class: 'lc-toggles' },
    toggle(
      'Heat map',
      () => showHeat,
      (v) => ((showHeat = v), (grayBox.disabled = !v), paint()),
    ),
    grayToggle,
    selectField(
      'Color by',
      [
        ['often', 'How long the bot spent there'],
        ['soon', 'How soon it got there'],
      ],
      () => (soon ? 'soon' : 'often'),
      (v) => ((soon = v === 'soon'), paint()),
    ),
    toggle(
      'Stuck spots, deaths and findings',
      () => showMarks,
      (v) => ((showMarks = v), paint()),
    ),
  );
  /** The bot's heat steps as shown, and the author's. */
  const botSteps = () => (state.live ? heatSteps(state.live, soon) : state.saved ? unpack(soon ? state.saved.soon : state.saved.heat) : undefined);
  const mineUi = myHeatControls({
    project,
    file,
    botSteps,
    mySteps: (m) => heatSteps(m, soon),
    changed: () => paint(),
    goTo: (c) => host.goTo(c),
    say: (t) => (said.textContent = t),
  });
  const el = h(
    'section',
    { class: 'stack lc-panel', 'aria-labelledby': 'lc-title', hidden: true },
    h('h2', { id: 'lc-title', class: 'lc-title' }, 'Level check'),
    h(
      'p',
      { class: 'hint' },
      'Plays this scene on the real engine, trying every move from every place the hero can stand: where it can go, where it gets stuck, and what players would mind.',
    ),
    h(
      'div',
      { class: 'toolbar' },
      selectField(
        'Time',
        [
          [15, 'Quick (15 s)'],
          [60, 'Thorough (1 min)'],
          [240, 'Exhaustive (4 min)'],
        ],
        () => state.budget,
        (v) => (state.budget = v),
        'How long the bot may play this scene',
      ),
      runBtn,
      undoBtn,
      checkField(
        'Slower hands',
        () => state.steady,
        (v) => (state.steady = v),
        'Play the scene again the way a person might: one key at a time, with a pause between key changes, and say where that can’t get through',
      ),
      numberField(
        'ms between keys',
        () => state.steadyMs,
        (v) => (state.steadyMs = Math.max(50, Math.min(2000, v || STEADY_MS))),
        { min: 50, max: 2000, step: 50, title: 'The slower-hands pace: the least time between two key changes' },
      ),
      h(
        'button',
        {
          type: 'button',
          onclick: () => void import('../../../widgets/uploadChecklist').then((m) => m.uploadChecklist(project)),
          title: 'The guide’s Appendix B, ticked where the checks can tell',
        },
        '☑ Before you upload…',
      ),
    ),
    bar,
    status,
    progressLine,
    said,
    checkExtras({
      project,
      file,
      scene: host.scene,
      findings: () => state.saved?.findings ?? [],
      item: findings.item,
      render,
      filter: () => findings.filter(),
      addedHeat: (ticks) => mineUi.added(ticks),
    }),
    mineUi.el,
    h(
      'details',
      { class: 'lc-gen' },
      h('summary', null, 'Make…'),
      h('p', { class: 'lc-why' }, 'Select an area with the Select tool (S) first. The map’s Undo takes it back.'),
      h(
        'button',
        {
          type: 'button',
          onclick: () => {
            const r = host.selection();
            if (r?.cells) return toast('Choose a rectangular selection for the maze generator.', 'error');
            if (!r || r.w < 7 || r.h < 7) return toast('Select an area at least 7 blocks each way first.', 'error');
            const cells = mazeFor(project, file, r);
            if (!cells) return toast('This map needs a wall block and a floor block to build a maze from.', 'error');
            host.paint(cells);
            toast('A maze, with landmarks at its crossroads and prizes in some dead ends. Run the check to try it.');
          },
        },
        '▦ A maze with landmarks',
      ),
    ),
    toggles,
    legend,
    counts,
    list,
    acceptedBox,
  );

  function toggle(label: string, get: () => boolean, set: (v: boolean) => void, title?: string): HTMLLabelElement {
    const input = h('input', { type: 'checkbox', checked: get() });
    input.addEventListener('change', () => set(input.checked));
    return h('label', { class: 'check', title }, input, h('span', null, label));
  }

  let focus: number | undefined;
  /** What paint() last drew, for the tooltips: deaths (tries by cell), stuck cells, findings' titles by cell. */
  const drawn = {
    deaths: new Map<number, number>(),
    stuck: new Set<number>(),
    findings: new Map<number, string[]>(),
    heat: undefined as Uint8Array | undefined,
    myDeaths: new Map<number, number>(),
    view: 'bot' as HeatView,
  };
  const cursor: Record<(typeof markKinds)[number], number> = { death: -1, stuck: -1, finding: -1 };
  function paint(): void {
    const ov = host.overlay;
    // while the bot plays, its heat map shows; after, whichever the author chose
    const mine = mineUi.mine();
    const view: HeatView = state.live || !mine ? 'bot' : mineUi.view();
    const bot = botSteps();
    const my = mine && heatSteps(mine, soon);
    ov.heatColors = undefined;
    if (view === 'bot') ov.heat = bot;
    else if (view === 'mine' || !my) ov.heat = my;
    else if (view === 'both') ov.heat = bot ? combineSteps(bot, my) : my;
    else {
      ov.heat = compareSteps(bot ?? new Uint8Array(my.length), my);
      ov.heatColors = COMPARE_COLORS;
    }
    if (!showHeat) ov.heat = undefined;
    ov.gray = !!ov.heat && gray;
    drawn.deaths = new Map();
    drawn.myDeaths = view !== 'bot' && showMarks && mine ? mine.deaths : new Map();
    drawn.stuck = new Set();
    drawn.findings = new Map();
    drawn.heat = ov.heat;
    drawn.view = view;
    if (showMarks && state.live) drawn.deaths = state.live.deaths;
    else if (showMarks && state.saved && view !== 'mine') {
      state.saved.deaths.forEach((c, i) => drawn.deaths.set(c, state.saved?.deathTimes?.[i] ?? -1));
      drawn.stuck = new Set(state.saved.stuck);
      for (const f of findings.split().open)
        for (const c of (f.where.cells ?? (f.where.cell !== undefined ? [f.where.cell] : [])).slice(0, 40)) {
          const at = drawn.findings.get(c) ?? [];
          if (!at.includes(f.title)) at.push(f.title);
          drawn.findings.set(c, at);
        }
    }
    const marks: NonNullable<OverlayState['marks']> = [];
    for (const c of drawn.stuck) marks.push({ cell: c, kind: 'stuck' });
    for (const c of new Set([...drawn.deaths.keys(), ...drawn.myDeaths.keys()])) marks.push({ cell: c, kind: 'death' });
    for (const c of drawn.findings.keys()) marks.push({ cell: c, kind: 'finding' });
    if (focus !== undefined) marks.push({ cell: focus, kind: 'focus' });
    ov.marks = marks;
    heatLegend.hidden = !ov.heat || view === 'compare';
    cmpLegend.hidden = !ov.heat || view !== 'compare';
    const n = { death: new Set([...drawn.deaths.keys(), ...drawn.myDeaths.keys()]).size, stuck: drawn.stuck.size, finding: drawn.findings.size };
    for (const k of markKinds) {
      markBtns[k].hidden = !n[k];
      markBtns[k].querySelector('span')!.textContent = `${MARKS[k].label} ${k === 'stuck' ? 'cells' : 'spots'}: ${n[k]}`;
    }
    focusKey.hidden = focus === undefined;
    markLegend.hidden = !n.death && !n.stuck && !n.finding && focus === undefined;
    legend.hidden = heatLegend.hidden && cmpLegend.hidden && markLegend.hidden;
    legendText(view);
    mineUi.refresh();
    host.redraw();
  }

  const marked = (c: number) => drawn.stuck.has(c) || drawn.deaths.has(c) || drawn.myDeaths.has(c) || drawn.findings.has(c) || focus === c;
  function describe(cell: number, near = 0): string[] {
    if (el.hidden) return [];
    let at = cell;
    if (near > 0 && !marked(cell)) {
      const cx = cell % MLEN;
      const cy = Math.floor(cell / MLEN);
      let best = Infinity;
      for (let y = Math.max(0, cy - near); y <= Math.min(MWID - 1, cy + near); y++)
        for (let x = Math.max(0, cx - near); x <= Math.min(MLEN - 1, cx + near); x++) {
          const d = (x - cx) ** 2 + (y - cy) ** 2;
          if (d < best && d <= near * near && marked(y * MLEN + x)) ((best = d), (at = y * MLEN + x));
        }
    }
    const lines = describeCell({
      stuck: drawn.stuck.has(at),
      deaths: drawn.deaths.get(at) ?? 0,
      myDeaths: drawn.myDeaths.get(at) ?? 0,
      findings: drawn.findings.get(at) ?? [],
      focus: focus === at,
      soon,
    });
    const heat = heatWords(drawn.heat?.[cell], soon, drawn.view);
    return heat ? [...lines, heat] : lines;
  }

  /** Shows the next mark of a kind on the map, and reads out what it is. */
  function nextMark(k: (typeof markKinds)[number]): void {
    const cells = [...(k === 'death' ? new Set([...drawn.deaths.keys(), ...drawn.myDeaths.keys()]) : k === 'stuck' ? drawn.stuck : drawn.findings.keys())].sort(
      (a, b) => a - b,
    );
    if (!cells.length) return;
    cursor[k] = (cursor[k] + 1) % cells.length;
    const c = cells[cursor[k]];
    host.goTo(c);
    said.textContent = `${at(c)}: ${describe(c).join('. ')}.`;
  }

  /** A scene the hero leaves at once (a talk page or a fade) has no level to check: say so beside the status. */
  const passNote = (): string => {
    if (host.scene === undefined) return '';
    try {
      return levelCheckNote(project.game(), host.scene);
    } catch {
      return '';
    }
  };

  function render(): void {
    if (!state.saved) {
      status.textContent = host.scene === undefined ? 'No scene plays this map yet, so only its files can be checked.' : `Not checked yet.${passNote()}`;
      clear(list);
      clear(counts);
      clear(acceptedBox);
      toggles.hidden = true;
      legend.hidden = true;
      return;
    }
    toggles.hidden = false;
    const when = new Date(state.saved.when);
    status.textContent = `Checked ${when.toLocaleString()}: ${state.saved.places} places tried in ${(state.saved.ms / 1000).toFixed(0)} s${state.saved.complete ? ', every move from every one' : ', then the time ran out'}.${passNote()}`;
    findings.render();
    paint();
  }

  render();
  return {
    el,
    describe,
    shown: () => !el.hidden,
    toggle(on = el.hidden) {
      el.hidden = !on;
      if (on) paint();
      else {
        host.overlay.heat = undefined;
        host.overlay.gray = undefined;
        host.overlay.marks = undefined;
        host.redraw();
      }
    },
  };
}
