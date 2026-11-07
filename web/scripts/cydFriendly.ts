// Public games and Starters only: write a packer-readable CYD advisory and a maintainer report.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import type { Walkthrough } from '../src/walkthrough/format';
import { measureCyd } from './cydReplay';
import { scoreCyd } from './cydScore';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2).filter((arg) => arg !== '--');
const option = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`${name} needs a value`);
  return resolve(args[i + 1]);
};
const out = option('--out', join(root, '.for-lewis/research/pocket/cyd-friendly.json'));
const report = option('--report', join(root, '.for-lewis/research/pocket/cyd-friendly.md'));
const rows = [];
for (const id of readdirSync(join(root, 'games')).sort()) {
  const dir = join(root, 'games', id);
  if (!existsSync(join(dir, 'about.json'))) continue;
  const about = JSON.parse(readFileSync(join(dir, 'about.json'), 'utf8')) as { title: string; secret?: boolean; series?: string; version: string };
  if (about.secret) continue;
  const row = { id, title: about.title, version: about.version, starter: about.series === 'starter' };
  try {
    const controls = JSON.parse(readFileSync(join(dir, 'controls.json'), 'utf8')) as { keys: Record<string, { short: string; long?: string }> };
    const jumpKeys = new Set(
      Object.entries(controls.keys)
        .filter(([, label]) => /\b(jump|hop|leap)\b/i.test(label.short))
        .map(([key]) => Number(key)),
    );
    const walk = JSON.parse(readFileSync(join(dir, 'walkthrough.json'), 'utf8')) as Walkthrough;
    const pathsFile = join(dir, 'walkPaths.json');
    const paths = existsSync(pathsFile) ? (JSON.parse(readFileSync(pathsFile, 'utf8')) as Record<string, number[]>) : {};
    const measured = await measureCyd(readDisk(join(dir, 'disk')), walk, jumpKeys, paths);
    const scored = scoreCyd(measured.metrics);
    const routes = existsSync(join(dir, 'tools')) ? readdirSync(join(dir, 'tools')).filter((n) => /route|play|walkthrough/.test(n)) : [];
    rows.push({
      ...row,
      status: measured.warnings.length ? 'provisional' : 'measured',
      ...scored,
      ...measured,
      sources: { walkthrough: `games/${id}/walkthrough.json`, controls: `games/${id}/controls.json`, routes, walkPathSets: Object.keys(paths).length },
    });
    console.log(`${id.padEnd(26)} ${String(scored.score).padStart(3)}  ${scored.reasons.join('; ') || 'Simple recorded inputs'}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    rows.push({ ...row, status: 'unrated', score: null, reasons: [reason] });
    console.log(`${id.padEnd(26)}   ?  ${reason}`);
  }
}
const methodology = [
  'Advisory estimates from one recorded route, not a claim of required actions or a board playtest. Unrated rows must not be treated as friendly.',
  'Space/Enter and extra shares count key-down events only; number-pad diagonals and arrows are movement. Changes count distinct input-event ticks, including releases; the peak uses a rolling one-second window. Idle and sign-reading ticks can lower the mean.',
  'Engine-backed GameSim replay must win without a death. Controls short labels identify jump keys. Each completed local flight is replayed with its press/release shifted earlier and later by 1–6 engine ticks; other inputs stay fixed. The first failed shift in each direction ends contiguous slack. Failure means death, scene exit, no landing within 90 ticks, or landing over one block from the recorded landing or on another row. This is local route sensitivity, not proof a jump is mandatory.',
  'Narrow means less than 3 ticks of combined early/late slack (under 165 ms at 18.2 Hz); 6 ticks is a lower bound, not an exact window. Frames here are engine ticks, not 60 Hz video frames. Early shifts are limited by the available segment prefix; a start near a scene boundary has less early evidence. Flights crossing scene boundaries are unknown.',
  'Landing width counts contiguous solid support blocks on the landing row; at most 2 blocks is a narrow ledge suggestion. WalkPaths are authored walking-road preferences, not solid-platform geometry; on/off-path tick counts, source availability and route tool names are recorded for review, not substituted for collision measurements.',
  'Score = clamp(100 − 35×Space/Enter share − 35×extra share − min(15,5×mean changes/s) − min(5,max(0,peak changes/s−3)) − min(25,5×narrow starts) − min(20,2×narrow landings), 0,100), rounded. Unresolved jumps are listed as warnings; scores with warnings are provisional. Scores do not measure touch latency, readability, combat judgment, alternate routes, or hardware differences.',
];
const data = { schemaVersion: 1, generatedAt: new Date().toISOString(), engineTicksPerSecond: 18.2, methodology, games: rows };
for (const file of [out, report]) mkdirSync(dirname(file), { recursive: true });
writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
const escape = (s: string) => s.replaceAll('|', '\\|').replaceAll('\n', ' ');
writeFileSync(
  report,
  `# CYD friendliness\n\n${methodology.join('\n\n')}\n\n| Game | Score | Reasons |\n| --- | ---: | --- |\n${rows.map((r) => `| ${escape(r.title)}${r.starter ? ' (Starter)' : ''} | ${r.score ?? '?'} | ${escape(r.reasons.join('; ') || 'Simple recorded inputs')}${'warnings' in r && r.warnings.length ? `; ${escape(r.warnings.join('; '))}` : ''} |`).join('\n')}\n`,
);
console.log(`JSON: ${out}\nReport: ${report}`);
