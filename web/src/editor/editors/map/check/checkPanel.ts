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
import { h, clear, selectField, toast } from '../../../core/ui';
import type { Project } from '../../../core/project';
import type { OverlayState } from '../tools/overlay';
import { HEAT_COLORS } from '../tools/overlay';
import { startCheck, type RunningCheck } from '../../../check/client';
import { CHECKS, at, kindOf, type Finding, type Kind } from '../../../check/findings';
import type { Report, RunSummary } from '../../../check/report';
import { guideLink } from '../../../widgets/guideLink';
import { fixFor } from '../../../check/generators/fixes';
import { uploadChecklist } from '../../../widgets/uploadChecklist';
import { unlockAchievement } from '../../../../achievements';
import { mazeFor } from '../../../check/generators/mazeFor';
import { markSame, sameEverySide, sameKeyOf } from '../../../check/sameEverySide';
import { acceptedFindings, findingKey, setAccepted, splitAccepted } from '../../../check/accepted';
import type { LiveProgress } from '../../../check/live';
import { MLEN, MWID } from '../../../../formats/map';
import { MARKS, describeCell, heatWords, type HeatView } from './markInfo';
import { COMPARE_COLORS, combineSteps, compareSteps } from './myHeat';
import { myHeatControls } from './myHeatControls';
import { checkExtras } from './checkExtras';

export interface CheckHost {
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
  selection(): { x: number; y: number; w: number; h: number } | undefined;
  /** Paints [cell, block] pairs as one step of the map's own Undo. */
  paint(cells: [number, number][]): void;
}

/** What the companion keeps of the last check of a map. */
interface Saved {
  when: string;
  budget: number;
  /** The heat map, one character per cell: '0' never reached, '1'..'6' rising (HEAT_COLORS). */
  heat: string;
  soon: string;
  stuck: number[];
  deaths: number[];
  /** Tries that ended in each of `deaths` (older checks didn't keep them). */
  deathTimes?: number[];
  findings: Finding[];
  places: number;
  complete: boolean;
  ms: number;
}

const SECTION = 'levelCheck';
const LABEL: Record<Kind, string> = { error: 'Problem', warning: 'Warning', suggestion: 'Suggestion', info: 'Note' };
const ICON: Record<Kind, string> = { error: '⛔', warning: '⚠', suggestion: '💡', info: 'ℹ' };

/** Heat as steps: how often (log of ticks spent) or how soon (first tick reached). */
export function heatSteps(run: Pick<RunSummary, 'heat' | 'first'>, soon: boolean): Uint8Array {
  const out = new Uint8Array(run.heat.length);
  const n = HEAT_COLORS.length;
  if (soon) {
    let max = 0;
    for (const t of run.first) max = Math.max(max, t);
    // reached early is bright: the first steps of a level stand out
    run.first.forEach((t, i) => t >= 0 && (out[i] = n - Math.min(n - 1, Math.floor((t / (max + 1)) * n))));
  } else {
    let max = 1;
    for (const v of run.heat) max = Math.max(max, v);
    run.heat.forEach((v, i) => v && (out[i] = 1 + Math.min(n - 1, Math.floor((Math.log(v) / Math.log(max + 1)) * n))));
  }
  return out;
}

const pack = (a: Uint8Array) => String.fromCharCode(...[...a].map((v) => 48 + v));

/** Keeps a heat map that the walkthrough bot made as this map's last check, with a note saying so. */
export function keepBotHeat(project: Project, map: string, scene: number, heat: Uint32Array, note: string): void {
  const run = { heat, first: Int32Array.from(heat, (h) => (h ? 0 : -1)) };
  const saved: Saved = {
    when: new Date().toISOString(),
    budget: 0,
    heat: pack(heatSteps(run, false)),
    soon: pack(heatSteps(run, false)),
    stuck: [],
    deaths: [],
    findings: [{ check: 'coverage', severity: 'warning', title: note, where: { scene, map } }],
    places: 0,
    complete: false,
    ms: 0,
  };
  project.setExtras(map, SECTION, saved);
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
/** The deaths kept of a run: the cells, and how many tries ended at each. */
function deathsOf(run: RunSummary | undefined): Pick<Saved, 'deaths' | 'deathTimes'> {
  const times = new Map<number, number>();
  const c = run?.deathCounts ?? [];
  for (let i = 0; i < c.length; i += 2) times.set(c[i], c[i + 1]);
  const deaths = [...new Set([...(run?.deaths ?? []), ...times.keys()])].slice(0, 300);
  return { deaths, deathTimes: deaths.map((d) => times.get(d) ?? 1) };
}
const unpack = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0) - 48);

/** Seconds, for "About 12 s left": whole seconds, or minutes and seconds past a minute. */
export function secondsText(ms: number): string {
  const s = Math.max(1, Math.ceil(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
}

/** The running check's progress in words: time left (honest when it can only be the budget), places tried, and the scene. */
export function liveText(p: Pick<LiveProgress, 'leftMs' | 'sure' | 'tried' | 'queued' | 'index' | 'total'>, sceneName?: string): string {
  const left = `${p.sure ? 'About' : 'Up to'} ${secondsText(p.leftMs)} left`;
  const scene = p.total > 1 ? ` · scene ${p.index + 1} of up to ${p.total}${sceneName ? ` (${sceneName})` : ''}` : '';
  return `${left} · ${p.tried} place${p.tried === 1 ? '' : 's'} tried, ${p.queued} waiting${scene}`;
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
  let saved = project.extras<Saved | undefined>(file, SECTION, undefined);
  let budget = saved?.budget ?? 15;
  let running: RunningCheck | undefined;
  let showHeat = true;
  let gray = readGray();
  let soon = false;
  let showMarks = true;
  let filter: Kind | 'all' = 'all';
  let showAccepted = false;
  /** What the bot has found so far in the check that is running. */
  let live: { heat: Uint32Array; first: Int32Array; deaths: Map<number, number> } | undefined;
  const undo: { files: [string, Uint8Array | undefined][]; what: string }[] = [];

  const status = h('p', { class: 'meta lc-status', role: 'status', 'aria-live': 'polite' });
  const bar = h('progress', { class: 'lc-progress', max: 1, value: 0, 'aria-label': 'Level check progress', hidden: true });
  // while a check runs this line changes every second; the status above is told only every few
  const progressLine = h('p', { class: 'meta lc-status lc-live', hidden: true });
  // a mark picked from the legend or the list, read out
  const said = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  const runBtn = h('button', { type: 'button', class: 'primary', onclick: () => (running ? stop() : void run()) }, '▶ Run check');
  const undoBtn = h('button', { type: 'button', hidden: true, onclick: () => undoFix() }, '↶ Undo fix');
  const list = h('ol', { class: 'lc-list', 'aria-label': 'Findings' });
  const acceptedBox = h('div', { class: 'lc-accepted' });
  const counts = h('div', { class: 'lc-counts', role: 'group', 'aria-label': 'Show findings' });
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
  const botSteps = () => (live ? heatSteps(live, soon) : saved ? unpack(soon ? saved.soon : saved.heat) : undefined);
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
        () => budget,
        (v) => (budget = v),
        'How long the bot may play this scene',
      ),
      runBtn,
      undoBtn,
      h(
        'button',
        { type: 'button', onclick: () => void uploadChecklist(project), title: 'The guide’s Appendix B, ticked where the checks can tell' },
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
      findings: () => saved?.findings ?? [],
      item: (f, acc) => item(f, acc),
      filter: () => filter,
      addedHeat: (ticks) => mineUi.added(ticks),
    }),
    mineUi.el,
    h(
      'details',
      { class: 'lc-gen' },
      h('summary', null, 'Make…'),
      h('p', { class: 'meta' }, 'Select an area with the Select tool (S) first. The map’s Undo takes it back.'),
      h(
        'button',
        {
          type: 'button',
          onclick: () => {
            const r = host.selection();
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
    const view: HeatView = live || !mine ? 'bot' : mineUi.view();
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
    if (showMarks && live) drawn.deaths = live.deaths;
    else if (showMarks && saved && view !== 'mine') {
      saved.deaths.forEach((c, i) => drawn.deaths.set(c, saved?.deathTimes?.[i] ?? -1));
      drawn.stuck = new Set(saved.stuck);
      for (const f of split().open)
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

  /** The saved findings, those still open and those accepted as meant to be. */
  const split = () => splitAccepted(saved?.findings ?? [], acceptedFindings(project));

  function render(): void {
    if (!saved) {
      status.textContent = host.scene === undefined ? 'No scene plays this map yet, so only its files can be checked.' : 'Not checked yet.';
      clear(list);
      clear(counts);
      clear(acceptedBox);
      toggles.hidden = true;
      legend.hidden = true;
      return;
    }
    toggles.hidden = false;
    const when = new Date(saved.when);
    status.textContent = `Checked ${when.toLocaleString()}: ${saved.places} places tried in ${(saved.ms / 1000).toFixed(0)} s${saved.complete ? ', every move from every one' : ', then the time ran out'}.`;
    const { open, accepted } = split();
    const by = (s: Kind) => open.filter((f) => kindOf(f) === s).length;
    clear(
      counts,
      ...(['all', 'error', 'warning', 'suggestion', 'info'] as const).map((s) =>
        h(
          'button',
          { type: 'button', class: 'lc-count', 'aria-pressed': String(filter === s), onclick: () => ((filter = s), render()) },
          s === 'all' ? `All ${open.length}` : `${ICON[s]} ${by(s)} ${LABEL[s].toLowerCase()}${by(s) === 1 ? '' : 's'}`,
        ),
      ),
    );
    const shown = open.filter((f) => filter === 'all' || kindOf(f) === filter);
    clear(list, ...(shown.length ? shown.map((f) => item(f)) : [h('li', { class: 'meta' }, open.length ? 'None of these.' : 'Nothing to report.')]));
    if (!accepted.length) showAccepted = false;
    clear(
      acceptedBox,
      ...(accepted.length
        ? [
            h(
              'button',
              {
                type: 'button',
                class: 'lc-accepted-toggle',
                'aria-expanded': String(showAccepted),
                'aria-controls': 'lc-accepted-list',
                title: 'Findings marked as checked: they are meant to be',
                onclick: () => ((showAccepted = !showAccepted), render()),
              },
              `${accepted.length} accepted · ${showAccepted ? 'hide' : 'show'}`,
            ),
            h(
              'ol',
              { class: 'lc-list', id: 'lc-accepted-list', 'aria-label': 'Accepted findings', hidden: !showAccepted },
              ...accepted.map((f) => item(f, true)),
            ),
          ]
        : []),
    );
    paint();
  }

  /** Accepts a finding as meant to be, or (with `on` false) brings it back to the list. */
  function accept(f: Finding, on: boolean): void {
    setAccepted(project, findingKey(f), on);
    render();
    toast(
      on
        ? `${'taste' in CHECKS[f.check] ? 'Kept as you chose it' : 'Marked as checked'}: the finding is kept under “accepted”.`
        : 'The finding is back in the list.',
    );
  }

  function item(f: Finding, accepted = false): HTMLElement {
    const info = CHECKS[f.check];
    const cell = f.where.cell ?? f.where.cells?.[0];
    const fix = fixFor(f, project);
    const same = sameKeyOf(f);
    const kind = kindOf(f);
    const taste = 'taste' in info;
    return h(
      'li',
      { class: `lc-item lc-${kind}${accepted ? ' lc-is-accepted' : ''}` },
      h(
        'button',
        {
          type: 'button',
          class: 'lc-go',
          disabled: cell === undefined,
          title: cell === undefined ? undefined : `Show ${at(cell)} on the map`,
          onclick: () => {
            if (cell === undefined) return;
            focus = cell;
            paint();
            host.goTo(cell);
            said.textContent = `${at(cell)}: ${describe(cell).join('. ')}.`;
          },
        },
        h('span', { class: 'lc-sev' }, h('span', { 'aria-hidden': 'true' }, ICON[kind]), ` ${LABEL[kind]}: `),
        h('span', { class: 'lc-what' }, f.title),
      ),
      f.detail ? h('p', { class: 'lc-detail' }, f.detail) : null,
      h('p', { class: 'lc-why' }, h('strong', null, `${info.name}. `), info.why, ' ', guideLink(info.guide)),
      fix && !accepted
        ? h(
            'button',
            {
              type: 'button',
              class: 'lc-fix',
              title: fix.detail,
              onclick: () => {
                const before = fix.files.map((n): [string, Uint8Array | undefined] => [n, project.files.get(n)?.slice()]);
                const changed = fix.apply();
                if (!changed.length) return toast('Nothing to change there.');
                undo.push({ files: before.filter(([n]) => changed.includes(n)), what: fix.label });
                undoBtn.hidden = false;
                host.reload(changed);
                unlockAchievement('check-fix');
                toast(`${fix.label}: done. Run the check again to see the difference.`);
              },
            },
            `✨ ${fix.label}`,
          )
        : null,
      same && !accepted
        ? h(
            'button',
            {
              type: 'button',
              class: 'lc-fix',
              title: 'For a ball, a word or anything drawn to look the same from every side: the check stops asking about it.',
              onclick: () => {
                markSame(project, same);
                if (saved) saved.findings = saved.findings.filter((x) => sameKeyOf(x) !== same);
                if (saved) project.setExtras(file, SECTION, saved);
                render();
                toast(`${same} is marked as the same from every side.`);
              },
            },
            'Looks the same from every side',
          )
        : null,
      h(
        'button',
        {
          type: 'button',
          class: 'lc-fix lc-accept',
          title: accepted
            ? 'Puts this finding back in the list and the counts.'
            : taste
              ? 'A design suggestion, not a rule: if you chose this on purpose, the list, the counts, the badges and Before You Upload leave it out.'
              : 'You have looked at this and it is how you want it: the list, the counts, the badges and Before You Upload leave it out.',
          onclick: () => accept(f, !accepted),
        },
        accepted ? '↺ Not meant to be: list it again' : taste ? '✓ That’s on purpose' : '✓ Mark as checked: it’s meant to be',
      ),
    );
  }

  function undoFix(): void {
    const last = undo.pop();
    if (!last) return;
    for (const [n, b] of last.files) {
      if (b) project.files.set(n, b);
      else project.files.delete(n);
    }
    host.reload(last.files.map(([n]) => n));
    undoBtn.hidden = !undo.length;
    toast(`Undid: ${last.what}.`);
  }

  async function run(): Promise<void> {
    runBtn.textContent = '■ Stop';
    bar.hidden = false;
    bar.removeAttribute('value');
    bar.removeAttribute('aria-valuetext');
    status.textContent = 'Starting the bot…';
    progressLine.hidden = true;
    let told = performance.now();
    let shown = 0;
    running = startCheck(
      project.files,
      { scene: host.scene, play: host.scene !== undefined, budgetMs: budget * 1000, sameEverySide: sameEverySide(project) },
      undefined,
      (p) => {
        if (p.scene === host.scene) {
          if (!live) {
            live = { heat: new Uint32Array(MLEN * MWID), first: new Int32Array(MLEN * MWID).fill(-1), deaths: new Map() };
            focus = undefined;
            toggles.hidden = false;
          }
          for (let i = 0; i < p.cells.length; i += 3) {
            live.heat[p.cells[i]] = p.cells[i + 1];
            live.first[p.cells[i]] = p.cells[i + 2];
          }
          live.deaths = new Map();
          for (let i = 0; i < p.deaths.length; i += 2) live.deaths.set(p.deaths[i], p.deaths[i + 1]);
          if (!el.hidden) paint();
        }
        // the bar never runs backwards, even when an estimate grows
        shown = Math.max(shown, p.fraction);
        bar.value = shown;
        const text = liveText(p);
        bar.setAttribute('aria-valuetext', text);
        progressLine.hidden = false;
        progressLine.textContent = text;
        status.classList.add('sr-only');
        // the live region is told at most every five seconds
        if (performance.now() - told >= 5000 || status.textContent === 'Starting the bot…') {
          told = performance.now();
          status.textContent = `Checking: ${text}`;
        }
      },
    );
    try {
      const report = await running.done;
      keep(report);
      unlockAchievement('check-run');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast(`The level check failed: ${(e as Error).message}`, 'error');
      else status.textContent = 'Stopped.';
    } finally {
      running = undefined;
      live = undefined;
      runBtn.textContent = '▶ Run check';
      bar.hidden = true;
      progressLine.hidden = true;
      status.classList.remove('sr-only');
      paint();
    }
    if (saved) render();
  }

  function stop(): void {
    running?.cancel();
  }

  function keep(r: Report): void {
    const run = r.runs[0];
    const cells = (f: Finding): Finding => ({ ...f, where: { ...f.where, cells: f.where.cells?.slice(0, 200) } });
    saved = {
      when: new Date().toISOString(),
      budget,
      heat: run ? pack(heatSteps(run, false)) : '0'.repeat(10000),
      soon: run ? pack(heatSteps(run, true)) : '0'.repeat(10000),
      stuck: run?.stuck.slice(0, 2000) ?? [],
      ...deathsOf(run),
      findings: r.findings.filter((f) => f.where.scene === undefined || f.where.scene === host.scene).map(cells),
      places: run?.places ?? 0,
      complete: run?.complete ?? true,
      ms: r.ms,
    };
    focus = undefined;
    project.setExtras(file, SECTION, saved);
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
