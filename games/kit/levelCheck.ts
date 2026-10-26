// The editor's Level check (web/src/editor/check), static part only (no playtest), on a game's
// built disk, against a baseline of findings already looked at: only an error or warning that
// is not in levelCheck.baseline.json fails, so known false alarms don't. Infos are not checked.
// A game's about.json "sameEverySide" lists heroes and monsters meant to look the same from
// every side ("ship.chr", "hive.mon#0"), which the facing check leaves alone, as the editor's
// own list does. Its "acceptedFindings" lists findings the designer looked at and kept on
// purpose, by the editor's stable key (check, scene and title, web/src/editor/check/accepted.ts), e.g.
// "hurt-lock s2 Monster 9 holds the hero while it hurts": they never fail, as in the editor.
// The game's DOS player look (its player.json, kit/player.ts) goes in as a project's would, so the
// menu's text contrast and the color 0 check judge the words and colors it ships with.
//
//   cd web && npx vite-node ../games/kit/levelCheck.ts <id>            new findings exit 1
//   cd web && npx vite-node ../games/kit/levelCheck.ts <id> --update   write <id>'s baseline
//   cd web && npx vite-node ../games/kit/levelCheck.ts <id> --play [--steady <ms>] [--budget <s>]
// --play plays the whole game too (twice: once as it comes, once leaving behind all it can) and,
// with --steady (300 ms unless given; 0 for none), each scene again with steady hands, and lists
// the play findings (one-way spots, things left behind, steady hands, stuck spots…) and how tight
// the walkthrough's key changes are (web/src/editor/check/walk/pace.ts). It only reports: it
// always exits 0, since play findings depend on the time the bot has.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameFiles } from '../../web/src/project/files';
import { runChecks } from '../../web/src/editor/check/report';
import { gameOf, levelScenes } from '../../web/src/editor/check/playtest';
import { findingKey, splitAccepted } from '../../web/src/editor/check/accepted';
import { readDisk } from './gameSim';
import { readPlayer } from './player';
import { measurePace } from '../../web/src/editor/check/walk/pace';
import { STEADY_MS } from '../../web/src/editor/check/findings';
import type { Walkthrough } from '../../web/src/walkthrough/format';

const here = dirname(fileURLToPath(import.meta.url));
const baselinePath = join(here, 'levelCheck.baseline.json');

interface About {
  sameEverySide?: string[];
  acceptedFindings?: string[];
}

/** Each finding not accepted as a baseline line (severity, check, scene and title), and accepted keys no finding has now. */
async function staticFindings(id: string): Promise<{ lines: string[]; stale: string[] }> {
  const path = join(here, '..', id, 'about.json');
  const about = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as About) : {};
  const r = await runChecks(new GameFiles(readDisk(join(here, '..', id, 'disk'))), {
    play: false,
    sameEverySide: about.sameEverySide ?? [],
    player: readPlayer(id),
  });
  const accepted = about.acceptedFindings ?? [];
  const { open } = splitAccepted(r.findings, accepted);
  const keys = new Set(r.findings.map(findingKey));
  const lines = open.filter((f) => f.severity !== 'info').map((f) => `${f.severity} ${f.check} s${f.where.scene ?? '-'} ${f.title}`);
  // a play finding (one-way, softlock…) is only found by --play, so it is never stale here
  return { lines: [...new Set(lines)].sort(), stale: accepted.filter((k) => !keys.has(k) && !PLAY_CHECKS.has(k.split(' ')[0])) };
}

function readBaseline(): Record<string, string[]> {
  return existsSync(baselinePath) ? (JSON.parse(readFileSync(baselinePath, 'utf8')) as Record<string, string[]>) : {};
}

/** Checks found only by playing. */
const PLAY_CHECKS = new Set(['stuck', 'softlock', 'one-way', 'steady']);

/** Plays the game (and with steady hands) and prints its play findings and its walkthrough's pace. */
async function playReport(id: string, steadyMs: number, budgetS: number): Promise<void> {
  const path = join(here, '..', id, 'about.json');
  const about = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as About) : {};
  const t0 = Date.now();
  const files = new GameFiles(readDisk(join(here, '..', id, 'disk')));
  const opts = { budgetMs: budgetS * 1000, sameEverySide: about.sameEverySide ?? [], towardExits: true };
  // the whole game, as it comes and leaving behind all it can; then each level scene alone (as
  // the map editor's Level check plays it), again with steady hands
  const whole = await runChecks(files, opts);
  const all = [...whole.findings];
  const scenes = levelScenes(gameOf(files));
  for (const scene of scenes) {
    const r = await runChecks(files, { ...opts, scene, steadyMs: steadyMs || undefined });
    all.push(...r.findings.filter((f) => f.where.scene === scene));
  }
  const seen = new Set<string>();
  const { open } = splitAccepted(
    all.filter((f) => !seen.has(`${f.check}|${f.where.scene}|${f.title}`) && !!seen.add(`${f.check}|${f.where.scene}|${f.title}`)),
    about.acceptedFindings ?? [],
  );
  const play = open.filter((f) => PLAY_CHECKS.has(f.check) && (f.severity !== 'info' || f.check === 'steady'));
  for (const f of play)
    console.log(`${id}: ${f.severity} ${f.check} s${f.where.scene ?? '-'} ${f.title}${f.check === 'steady' || f.check === 'softlock' ? ` (${f.detail})` : ''}`);
  const cut = all.filter((f) => f.check === 'coverage').length;
  const noWay = all.filter((f) => f.check === 'link-unreached' && !f.where.cell).map((f) => `s${f.where.scene}`);
  if (noWay.length) console.log(`${id}: no way through found (so not checked for steady hands or one-way spots): ${[...new Set(noWay)].join(' ')}`);
  console.log(
    `${id}: the whole game ${whole.won ? 'won' : 'not won'} (${whole.runs.length} scenes reached); ${scenes.length} scenes alone, ${cut} cut short by the ${budgetS} s budget; ${play.length} play findings, ${Math.round((Date.now() - t0) / 1000)} s`,
  );
  const walkPath = join(here, '..', id, 'walkthrough.json');
  if (!existsSync(walkPath)) return;
  const p = measurePace(JSON.parse(readFileSync(walkPath, 'utf8')) as Walkthrough, (STEADY_MS / 1000) * 18.2);
  const ms = (t: number) => `${Math.round((t / 18.2) * 1000)} ms`;
  console.log(
    `${id}: walkthrough pace: ${p.events} key changes, ${p.sameTick} at the same tick as the one before, ${p.quick} under ${STEADY_MS} ms apart, ` +
      `${p.together} times two keys held together${p.longestTogether ? ` (longest ${ms(p.longestTogether.ticks)}, s${p.longestTogether.scene} tick ${p.longestTogether.tick})` : ''}, ` +
      `shortest press ${p.minHold ? `${ms(p.minHold.ticks)} (s${p.minHold.scene} tick ${p.minHold.tick})` : '-'}`,
  );
  for (const m of p.tightest) console.log(`${id}:   tight: s${m.scene} tick ${m.tick}: ${m.what} (${ms(m.ticks)})`);
}

const [id, flag] = process.argv.slice(2);
const opt = (name: string, def: number) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? Number(process.argv[i + 1]) : def;
};
if (id && flag === '--play') await playReport(id, opt('--steady', STEADY_MS), opt('--budget', 10));
else if (id) {
  const { lines: now, stale } = await staticFindings(id);
  for (const k of stale) console.log(`${id}: about.json accepts "${k}", which is no longer found`);
  const base = readBaseline();
  if (flag === '--update') {
    base[id] = now;
    const sorted = Object.fromEntries(
      Object.keys(base)
        .sort()
        .map((k) => [k, base[k]]),
    );
    writeFileSync(baselinePath, JSON.stringify(sorted, null, 1) + '\n');
    console.log(`${id}: ${now.length} findings in the baseline`);
  } else {
    const known = new Set(base[id] ?? []);
    const added = now.filter((l) => !known.has(l));
    const gone = (base[id] ?? []).filter((l) => !now.includes(l)).length;
    for (const l of added) console.log(`${id}: new ${l}`);
    console.log(`${id}: ${now.length} errors and warnings, ${added.length} new${gone ? `, ${gone} gone from the baseline (--update to drop them)` : ''}`);
    process.exit(added.length ? 1 : 0);
  }
}
