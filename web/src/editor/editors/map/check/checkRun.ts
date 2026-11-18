// Worker lifecycle, progress and companion persistence for the map's Level check.
import type { Project } from '../../../core/project';
import { startCheck, type RunningCheck } from '../../../check/client';
import { STEADY_MS, type Finding } from '../../../check/findings';
import type { Report, RunSummary } from '../../../check/report';
import type { LiveProgress } from '../../../check/live';
import { sameEverySide } from '../../../check/sameEverySide';
import { companionPatches } from '../../../../dosPlayer/playerRecord';
import { paletteReservations } from '../../palette/paletteReservations';
import { unlockAchievement } from '../../../../achievements';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { HEAT_COLORS } from '../tools/overlay';
/** What the companion keeps of the last check of a map. */
export interface Saved {
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
  /** The check played again with steady hands, at this many ms between key changes (0 or none: it didn't). */
  steadyMs?: number;
}

const SECTION = 'levelCheck';

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
/** The deaths kept of a run: the cells, and how many tries ended at each. */
function deathsOf(run: RunSummary | undefined): Pick<Saved, 'deaths' | 'deathTimes'> {
  const times = new Map<number, number>();
  const c = run?.deathCounts ?? [];
  for (let i = 0; i < c.length; i += 2) times.set(c[i], c[i + 1]);
  const deaths = [...new Set([...(run?.deaths ?? []), ...times.keys()])].slice(0, 300);
  return { deaths, deathTimes: deaths.map((d) => times.get(d) ?? 1) };
}
export const unpack = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0) - 48);

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

interface RunHost {
  project: Project;
  file: string;
  scene: number | undefined;
}
interface RunUi {
  runBtn: HTMLButtonElement;
  bar: HTMLProgressElement;
  status: HTMLParagraphElement;
  progressLine: HTMLParagraphElement;
  clearFocus(): void;
  showToggles(): void;
  hidden(): boolean;
  paint(): void;
  render(): void;
}

export function checkRun(host: RunHost, ui: RunUi) {
  const { project, file } = host;
  const saved = project.extras<Saved | undefined>(file, SECTION, undefined);
  const state = {
    saved,
    budget: saved?.budget ?? 15,
    steady: !!saved?.steadyMs,
    steadyMs: saved?.steadyMs || STEADY_MS,
    running: undefined as RunningCheck | undefined,
    live: undefined as { heat: Uint32Array; first: Int32Array; deaths: Map<number, number> } | undefined,
  };
  async function run(): Promise<void> {
    let terminal = '';
    ui.runBtn.textContent = '■ Stop';
    ui.bar.hidden = false;
    ui.bar.removeAttribute('value');
    ui.bar.removeAttribute('aria-valuetext');
    ui.status.textContent = 'Starting the bot…';
    ui.progressLine.hidden = true;
    let told = performance.now();
    let shown = 0;
    state.running = startCheck(
      project.files,
      {
        scene: host.scene,
        play: host.scene !== undefined,
        budgetMs: state.budget * 1000,
        sameEverySide: sameEverySide(project),
        player: companionPatches(project.companion, project.gam),
        reservations: paletteReservations(project),
        steadyMs: state.steady ? state.steadyMs : undefined,
      },
      undefined,
      (p) => {
        if (p.scene === host.scene) {
          if (!state.live) {
            state.live = { heat: new Uint32Array(MLEN * MWID), first: new Int32Array(MLEN * MWID).fill(-1), deaths: new Map() };
            ui.clearFocus();
            ui.showToggles();
          }
          for (let i = 0; i < p.cells.length; i += 3) {
            state.live.heat[p.cells[i]] = p.cells[i + 1];
            state.live.first[p.cells[i]] = p.cells[i + 2];
          }
          state.live.deaths = new Map();
          for (let i = 0; i < p.deaths.length; i += 2) state.live.deaths.set(p.deaths[i], p.deaths[i + 1]);
          if (!ui.hidden()) ui.paint();
        }
        // the bar never runs backwards, even when an estimate grows
        shown = Math.max(shown, p.fraction);
        ui.bar.value = shown;
        const text = liveText(p);
        ui.bar.setAttribute('aria-valuetext', text);
        ui.progressLine.hidden = false;
        ui.progressLine.textContent = text;
        ui.status.classList.add('sr-only');
        // the live region is told at most every five seconds
        if (performance.now() - told >= 5000 || ui.status.textContent === 'Starting the bot…') {
          told = performance.now();
          ui.status.textContent = `Checking: ${text}`;
        }
      },
    );
    try {
      const report = await state.running.done;
      keep(report);
      unlockAchievement('check-run');
    } catch (e) {
      terminal = (e as Error).name === 'AbortError' ? 'Stopped.' : `The level check failed: ${(e as Error).message}`;
      if (state.saved) terminal += ' Showing the previous result.';
    } finally {
      state.running = undefined;
      state.live = undefined;
      ui.runBtn.textContent = '▶ Run check';
      ui.bar.hidden = true;
      ui.progressLine.hidden = true;
      ui.status.classList.remove('sr-only');
      ui.paint();
    }
    if (state.saved) ui.render();
    if (terminal) ui.status.textContent = terminal;
  }

  function stop(): void {
    state.running?.cancel();
  }

  function keep(r: Report): void {
    const run = r.runs[0];
    const cells = (f: Finding): Finding => ({ ...f, where: { ...f.where, cells: f.where.cells?.slice(0, 200) } });
    state.saved = {
      when: new Date().toISOString(),
      budget: state.budget,
      heat: run ? pack(heatSteps(run, false)) : '0'.repeat(10000),
      soon: run ? pack(heatSteps(run, true)) : '0'.repeat(10000),
      stuck: run?.stuck.slice(0, 2000) ?? [],
      ...deathsOf(run),
      findings: r.findings.filter((f) => f.where.scene === undefined || f.where.scene === host.scene).map(cells),
      places: run?.places ?? 0,
      complete: run?.complete ?? true,
      ms: r.ms,
      steadyMs: state.steady ? state.steadyMs : 0,
    };
    ui.clearFocus();
    project.setExtras(file, SECTION, state.saved);
  }

  return { state, run, stop, save: () => project.setExtras(file, SECTION, state.saved) };
}
