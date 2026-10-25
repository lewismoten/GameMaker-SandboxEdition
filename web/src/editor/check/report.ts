// The level check, start to finish: the static checks on every level scene, then (unless
// asked not to) the playtest of the game or of one scene, all gathered into one report the
// worker can post back (plain data: heat maps as typed arrays, no engine objects).
import type { GameFiles } from '../../project/files';
import { blockChecks, counterSources, counters } from './checks/blockChecks';
import { characterChecks, controls, endingChecks, jumps, mechanics, soundChecks, variety } from './checks/gameChecks';
import { monsterChecks, startThreat } from './checks/monsterChecks';
import { sealed } from './checks/sealed';
import { facing } from './checks/facing';
import { fliCheck } from './checks/fliCheck';
import { lookalike, tapTwice, teachFirst } from './checks/playerChecks';
import { keyReach } from './checks/keyReach';
import { landings } from './checks/landings';
import { curve, playFindings } from './checks/playChecks';
import { sortFindings, type Finding } from './findings';
import type { ExploreLive } from './explore';
import { gameOf, playtestGame, playtestScene, type SceneRun } from './playtest';
import { scenesOf } from './sceneData';
import { LiveFeed, type LiveProgress } from './live';

/** What the map panel shows of one scene's playtest. */
export interface RunSummary {
  scene: number;
  name: string;
  map?: string;
  heat: Uint32Array;
  first: Int32Array;
  /** Cells of the stuck areas. */
  stuck: number[];
  deaths: number[];
  /** How many tries ended in a death, by cell: [cell, tries] × n. */
  deathCounts: number[];
  exits: { link: number; toScene: number; tick: number; hp: number }[];
  complete: boolean;
  places: number;
  ticks: number;
  ms: number;
}

export interface Report {
  findings: Finding[];
  runs: RunSummary[];
  /** The hero reached the won scene (whole-game runs only). */
  won?: boolean;
  /** Level scenes play never got to. */
  unreached: number[];
  cancelled: boolean;
  ms: number;
}

export interface CheckOptions {
  /** Check only this scene (its static checks, and a playtest of it alone). */
  scene?: number;
  /** Play the game (or scene); off, only the checks that read the files run. */
  play?: boolean;
  budgetMs?: number;
  progress?: (what: string, done: number, total: number) => boolean | void;
  /** Told about once a second, while a scene is played, what the bot has found so far (live.ts). */
  live?: (p: LiveProgress) => void;
  now?: () => number;
  /** Heroes and monsters marked as looking the same from every side (facing.ts sameKey). */
  sameEverySide?: string[];
}

export function summarize(r: SceneRun, map?: string): RunSummary {
  return {
    scene: r.scene,
    name: r.name,
    map,
    heat: r.ex.heat,
    first: r.ex.first,
    stuck: r.stuck.flatMap((a) => a.cells),
    deaths: r.ex.incidents.filter((i) => i.kind === 'death').map((i) => i.cell),
    deathCounts: [...r.ex.deaths].flat(),
    exits: r.ex.exits.map((e) => ({ link: e.link, toScene: e.toScene, tick: e.tick, hp: e.hp })),
    complete: r.ex.complete,
    places: r.ex.places.length,
    ticks: r.ex.ticks,
    ms: r.ex.ms,
  };
}

export async function runChecks(files: GameFiles, opt: CheckOptions = {}): Promise<Report> {
  const now = opt.now ?? (() => performance.now());
  const t0 = now();
  const game = gameOf(files);
  const all = scenesOf(game, files);
  const scenes = opt.scene === undefined ? all : all.filter((s) => s.scene === opt.scene);
  const findings: Finding[] = [];
  const gives = counterSources(all);
  const same = new Set(opt.sameEverySide);
  for (const d of scenes) {
    findings.push(...counters(d, gives));
    for (const c of [...blockChecks, ...monsterChecks]) findings.push(...c(d));
    findings.push(
      ...startThreat(d, game),
      ...sealed(d, game, all),
      ...characterChecks(d),
      ...facing(d, all, same),
      ...jumps(d),
      ...soundChecks(d, files),
      ...tapTwice(d),
      ...lookalike(d),
    );
    findings.push(...(await landings(d, game, files)));
  }
  if (opt.scene === undefined)
    findings.push(
      ...controls(files),
      ...keyReach(files),
      ...endingChecks(game),
      ...variety(all),
      ...mechanics(all),
      ...fliCheck(files),
      ...teachFirst(game, files, all),
    );
  const report: Report = { findings, runs: [], unreached: [], cancelled: false, ms: 0 };
  if (opt.play !== false) {
    const feed = new LiveFeed(now);
    const budgetMs = opt.budgetMs ?? 10_000;
    const progress = (scene: number, done: number, total: number, places: number, queued: number, live: ExploreLive) => {
      if (opt.live) {
        const p = feed.update({ scene, index: done, total, nodes: places, queued, budgetMs }, live);
        if (p) opt.live(p);
      }
      return opt.progress?.(`${game.scenes[scene]?.desc.trim() || `Scene ${scene}`}: ${places} places tried`, done, total);
    };
    const runs: SceneRun[] = [];
    if (opt.scene !== undefined) {
      const r = await playtestScene(game, files, opt.scene, { budgetMs: opt.budgetMs, progress });
      if (r) runs.push(r);
      else report.cancelled = true;
    } else {
      const p = await playtestGame(game, files, { budgetMs: opt.budgetMs, progress });
      runs.push(...p.runs);
      report.won = p.won;
      report.unreached = p.unreached;
      report.cancelled = p.cancelled;
      findings.push(...curve(runs));
    }
    for (const r of runs) {
      const d = all.find((s) => s.scene === r.scene);
      findings.push(...playFindings(r, d));
      report.runs.push(summarize(r, d?.names.map));
    }
  }
  // a character, sound or block set shared by several scenes gives the same finding once
  const seen = new Set<string>();
  report.findings = sortFindings(
    findings.filter((f) => {
      const k = `${f.check}|${f.title}|${f.where.map ?? f.where.file ?? f.where.sound?.file ?? ''}`;
      return !seen.has(k) && !!seen.add(k);
    }),
  );
  report.ms = now() - t0;
  return report;
}
