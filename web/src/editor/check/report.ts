// The level check, start to finish: the static checks on every level scene, then (unless
// asked not to) the playtest of the game or of one scene (a whole game a second time leaving
// behind all it can, and each scene again with steady hands when asked), all gathered into one
// report the worker can post back (plain data: heat maps as typed arrays, no engine objects).
import type { GameFiles } from '../../project/files';
import { blockChecks, counterSources, counters } from './checks/blockChecks';
import { characterChecks, controls, endingChecks, jumps, mechanics, soundChecks, speedCap, variety } from './checks/gameChecks';
import { cornerLinks, offMap, shadowedLinks, solidLinks, startsOnLink, wonRoute } from './checks/linkChecks';
import { missingFiles, missingVocs, outOfRange } from './checks/missingParts';
import { monsterChecks, startThreat } from './checks/monsterChecks';
import { sealed } from './checks/sealed';
import { facing } from './checks/facing';
import { fliCheck } from './checks/fliCheck';
import type { PlayerPatches } from '../../dosPlayer/patchRules';
import { lookalike, tapTwice, teachFirst } from './checks/playerChecks';
import { keyReach } from './checks/keyReach';
import { helpKeys } from './checks/helpKeys';
import { textContrast } from './checks/textContrast';
import { colorZero } from './checks/colorZero';
import { dosChars } from './checks/dosChars';
import { blankIdle, startValues } from './checks/heroStart';
import { shotPrize } from './checks/shotPrize';
import { changingKeys, keyHabits } from './checks/keyHabits';
import { screenText } from './checks/screenText';
import { fakeExits, music, noWayOut } from './checks/levelExits';
import { flashing } from './checks/flashing';
import { stakes } from './checks/stakes';
import { landings } from './checks/landings';
import { solidPushChecks } from './checks/solidPush';
import { curve, playFindings } from './checks/playChecks';
import { sortFindings, type Finding } from './findings';
import type { ExploreLive } from './explore';
import { gameOf, playtestGame, playtestScene, replayScene, type SceneRun } from './playtest';
import { oneWay, softlocks, steadyFindings } from './checks/wayBack';
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
  /** Also play each scene with steady hands: one key at a time, at least this many ms between changes. */
  steadyMs?: number;
  /** A whole game is played again carrying the least it can into each scene (off: only once). */
  leaveBehind?: boolean;
  /** Head for the scene's links first (playtest.ts towardExits): a way through sooner, less of the rest. */
  towardExits?: boolean;
  /** The project's DOS player patches (dosPlayer/), for the menu's words in the text-contrast check and the words the color 0 check matches. */
  player?: PlayerPatches;
}

/** A scene the bot couldn't load or play: said, rather than stopping the whole check. */
const couldNotPlay = (scene: number, name: string, error: string): Finding => ({
  check: 'coverage',
  severity: 'warning',
  title: `The bot couldn’t play ${name}`,
  detail: `${error}. Nothing in it was played, so its play checks didn’t run.`,
  where: { scene },
});

function summarize(r: SceneRun, map?: string): RunSummary {
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
    for (const c of [...blockChecks, ...monsterChecks, ...solidPushChecks]) findings.push(...c(d));
    findings.push(
      ...startThreat(d, game),
      ...sealed(d, game, all),
      ...characterChecks(d),
      ...facing(d, all, same),
      ...jumps(d),
      ...soundChecks(d, files),
      ...tapTwice(d),
      ...lookalike(d, all),
      ...blankIdle(d),
      ...shotPrize(d),
      ...keyHabits(d),
      ...fakeExits(d),
      ...noWayOut(d, game),
      ...music(d, game, files),
      ...flashing(d),
      ...shadowedLinks(game, d),
      ...startsOnLink(game, d, all),
      ...cornerLinks(game, d),
      ...solidLinks(game, d),
      ...offMap(game, d),
      ...missingVocs(d, files),
      ...outOfRange(d),
      ...speedCap(d),
    );
    findings.push(...(await landings(d, game, files)));
  }
  if (opt.scene === undefined)
    findings.push(
      ...controls(files),
      ...helpKeys(game, files),
      ...textContrast(game, files, opt.player),
      ...colorZero(game, files, opt.player),
      ...dosChars(game, files, files.mainGame()),
      ...startValues(game, all),
      ...stakes(game, all),
      ...changingKeys(files),
      ...screenText(game, files),
      ...keyReach(files),
      ...endingChecks(game, all),
      ...variety(all),
      ...mechanics(all),
      ...fliCheck(files),
      ...teachFirst(game, files, all),
      ...wonRoute(game, all),
      ...missingFiles(game, files, all),
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
    const name = (n: number) => game.scenes[n]?.desc.trim() || `scene ${n}`;
    if (opt.scene !== undefined) {
      let r: SceneRun | undefined;
      try {
        r = await playtestScene(game, files, opt.scene, { budgetMs: opt.budgetMs, progress, towardExits: opt.towardExits });
        if (!r) report.cancelled = true;
      } catch (e) {
        findings.push(couldNotPlay(opt.scene, name(opt.scene), e instanceof Error ? e.message : String(e)));
      }
      if (r) runs.push(r);
    } else {
      const p = await playtestGame(game, files, { budgetMs: opt.budgetMs, progress, towardExits: opt.towardExits });
      runs.push(...p.runs);
      report.won = p.won;
      report.unreached = p.unreached;
      report.cancelled = p.cancelled;
      findings.push(...curve(runs), ...p.failed.map((f) => couldNotPlay(f.scene, name(f.scene), f.error)));
      // and again, leaving behind everything it can: is the end still in reach?
      if (p.won && !p.cancelled && opt.leaveBehind !== false) {
        const poor = await playtestGame(game, files, { budgetMs: opt.budgetMs, progress, leaveBehind: true, towardExits: opt.towardExits });
        report.cancelled ||= poor.cancelled;
        findings.push(...softlocks(p, poor, all, name));
      }
    }
    for (const r of runs) {
      const d = all.find((s) => s.scene === r.scene);
      findings.push(...playFindings(r, d), ...oneWay(r, d));
      report.runs.push(summarize(r, d?.names.map));
    }
    if (opt.steadyMs && !report.cancelled) {
      const ticks = Math.max(1, Math.round((opt.steadyMs / 1000) * 18.2));
      for (const r of runs) {
        const steady = await replayScene(game, files, r, { budgetMs: opt.budgetMs, progress, steadyTicks: ticks, towardExits: opt.towardExits });
        if (!steady) {
          report.cancelled = true;
          break;
        }
        findings.push(
          ...steadyFindings(
            r,
            steady,
            all.find((s) => s.scene === r.scene),
            ticks,
          ),
        );
      }
    }
  }
  // a character, sound or block set shared by several scenes gives the same finding once (look-alike
  // footing once per block set, a solid hazard once per monster file)
  const seen = new Set<string>();
  // the touch probe's finding on a monster says more than the file checks' question about it
  const probed = new Set(findings.flatMap((f) => (f.check === 'hurt-lock' && f.where.monster ? [`${f.where.scene}:${f.where.monster.n}`] : [])));
  report.findings = sortFindings(
    findings.filter((f) => {
      if ((f.check === 'push-gap' || f.check === 'solid-hurt') && f.where.monster && probed.has(`${f.where.scene}:${f.where.monster.n}`)) return false;
      const k = `${f.check}|${f.title}|${(f.check === 'footing' && f.where.block?.file) || ((f.check === 'shot-prize' || f.check === 'solid-hurt') && f.where.monster?.file) || f.where.map || f.where.file || f.where.sound?.file || ''}`;
      return !seen.has(k) && !!seen.add(k);
    }),
  );
  report.ms = now() - t0;
  return report;
}
