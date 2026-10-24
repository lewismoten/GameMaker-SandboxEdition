// The map editor's Level check panel: runs the level check (editor/check) on this map's scene
// in a Web Worker, shows where the bot went as a heat map over the map, marks stuck areas,
// deaths and each finding's cells, and lists the findings: a click goes to the place, a link
// opens the guide's chapter, and a fix button offers the matching generator. The last check of
// this map is kept in the project's companion file (editor-only), so it is there next time.
import './checkPanel.css';
import { h, clear, selectField, toast } from '../../../core/ui';
import type { Project } from '../../../core/project';
import type { OverlayState } from '../tools/overlay';
import { HEAT_COLORS } from '../tools/overlay';
import { startCheck, type RunningCheck } from '../../../check/client';
import { CHECKS, at, type Finding, type Severity } from '../../../check/findings';
import type { Report, RunSummary } from '../../../check/report';
import { guideLink } from '../../../widgets/guideLink';
import { fixFor } from '../../../check/generators/fixes';
import { uploadChecklist } from '../../../widgets/uploadChecklist';
import { unlockAchievement } from '../../../../achievements';
import { mazeFor } from '../../../check/generators/mazeFor';
import { markSame, sameEverySide, sameKeyOf } from '../../../check/sameEverySide';

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
  findings: Finding[];
  places: number;
  complete: boolean;
  ms: number;
}

const SECTION = 'levelCheck';
const SEVERITY: Record<Severity, string> = { error: 'Problem', warning: 'Warning', info: 'Note' };
const ICON: Record<Severity, string> = { error: '⛔', warning: '⚠', info: 'ℹ' };

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
const unpack = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0) - 48);

export function checkPanel(host: CheckHost): { el: HTMLElement; shown(): boolean; toggle(on?: boolean): void } {
  const { project, file } = host;
  let saved = project.extras<Saved | undefined>(file, SECTION, undefined);
  let budget = saved?.budget ?? 15;
  let running: RunningCheck | undefined;
  let showHeat = true;
  let gray = readGray();
  let soon = false;
  let showMarks = true;
  let filter: Severity | 'all' = 'all';
  const undo: { files: [string, Uint8Array | undefined][]; what: string }[] = [];

  const status = h('p', { class: 'meta lc-status', role: 'status', 'aria-live': 'polite' });
  const bar = h('progress', { class: 'lc-progress', max: 1, value: 0, 'aria-label': 'Level check progress', hidden: true });
  const runBtn = h('button', { type: 'button', class: 'primary', onclick: () => (running ? stop() : void run()) }, '▶ Run check');
  const undoBtn = h('button', { type: 'button', hidden: true, onclick: () => undoFix() }, '↶ Undo fix');
  const list = h('ol', { class: 'lc-list', 'aria-label': 'Findings' });
  const counts = h('div', { class: 'lc-counts', role: 'group', 'aria-label': 'Show findings' });
  const legend = h(
    'div',
    { class: 'lc-legend' },
    h('span', { class: 'lc-legend-label' }),
    h('span', { class: 'lc-ramp', 'aria-hidden': 'true' }, ...HEAT_COLORS.map((c) => h('i', { style: `background:${c}` }))),
    h('span', { class: 'lc-legend-ends' }),
  );
  const legendText = () => {
    legend.querySelector('.lc-legend-label')!.textContent = soon ? 'Reached:' : 'Time spent:';
    legend.querySelector('.lc-legend-ends')!.textContent = soon ? 'late → early' : 'a moment → a lot';
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
  );

  function toggle(label: string, get: () => boolean, set: (v: boolean) => void, title?: string): HTMLLabelElement {
    const input = h('input', { type: 'checkbox', checked: get() });
    input.addEventListener('change', () => set(input.checked));
    return h('label', { class: 'check', title }, input, h('span', null, label));
  }

  let focus: number | undefined;
  function paint(): void {
    const ov = host.overlay;
    ov.heat = saved && showHeat ? unpack(soon ? saved.soon : saved.heat) : undefined;
    ov.gray = !!ov.heat && gray;
    const marks: NonNullable<OverlayState['marks']> = [];
    if (saved && showMarks) {
      for (const c of saved.stuck) marks.push({ cell: c, kind: 'stuck' });
      for (const c of saved.deaths) marks.push({ cell: c, kind: 'death' });
      for (const f of saved.findings)
        for (const c of (f.where.cells ?? (f.where.cell !== undefined ? [f.where.cell] : [])).slice(0, 40)) marks.push({ cell: c, kind: 'finding' });
    }
    if (focus !== undefined) marks.push({ cell: focus, kind: 'focus' });
    ov.marks = marks;
    legend.hidden = !ov.heat;
    legendText();
    host.redraw();
  }

  function render(): void {
    if (!saved) {
      status.textContent = host.scene === undefined ? 'No scene plays this map yet, so only its files can be checked.' : 'Not checked yet.';
      clear(list);
      clear(counts);
      toggles.hidden = true;
      legend.hidden = true;
      return;
    }
    toggles.hidden = false;
    const when = new Date(saved.when);
    status.textContent = `Checked ${when.toLocaleString()}: ${saved.places} places tried in ${(saved.ms / 1000).toFixed(0)} s${saved.complete ? ', every move from every one' : ', then the time ran out'}.`;
    const by = (s: Severity) => saved!.findings.filter((f) => f.severity === s).length;
    clear(
      counts,
      ...(['all', 'error', 'warning', 'info'] as const).map((s) =>
        h(
          'button',
          { type: 'button', class: 'lc-count', 'aria-pressed': String(filter === s), onclick: () => ((filter = s), render()) },
          s === 'all' ? `All ${saved!.findings.length}` : `${ICON[s]} ${by(s)} ${SEVERITY[s].toLowerCase()}${by(s) === 1 ? '' : 's'}`,
        ),
      ),
    );
    const shown = saved.findings.filter((f) => filter === 'all' || f.severity === filter);
    clear(list, ...(shown.length ? shown.map(item) : [h('li', { class: 'meta' }, saved.findings.length ? 'None of these.' : 'Nothing to report.')]));
    paint();
  }

  function item(f: Finding): HTMLElement {
    const info = CHECKS[f.check];
    const cell = f.where.cell ?? f.where.cells?.[0];
    const fix = fixFor(f, project);
    const same = sameKeyOf(f);
    return h(
      'li',
      { class: `lc-item lc-${f.severity}` },
      h(
        'button',
        {
          type: 'button',
          class: 'lc-go',
          disabled: cell === undefined,
          title: cell === undefined ? undefined : `Show ${at(cell)} on the map`,
          onclick: () => cell !== undefined && ((focus = cell), paint(), host.goTo(cell)),
        },
        h('span', { class: 'lc-sev' }, h('span', { 'aria-hidden': 'true' }, ICON[f.severity]), ` ${SEVERITY[f.severity]}: `),
        h('span', { class: 'lc-what' }, f.title),
      ),
      f.detail ? h('p', { class: 'lc-detail' }, f.detail) : null,
      h('p', { class: 'lc-why' }, h('strong', null, `${info.name}. `), info.why, ' ', guideLink(info.guide)),
      fix
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
      same
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
    status.textContent = 'Starting the bot…';
    const t0 = performance.now();
    running = startCheck(
      project.files,
      { scene: host.scene, play: host.scene !== undefined, budgetMs: budget * 1000, sameEverySide: sameEverySide(project) },
      (what) => {
        const s = (performance.now() - t0) / 1000;
        bar.value = Math.min(1, s / budget);
        status.textContent = `${what} (${s.toFixed(0)} of ${budget} s)`;
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
      runBtn.textContent = '▶ Run check';
      bar.hidden = true;
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
      deaths: [...new Set(run?.deaths ?? [])].slice(0, 300),
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
