// Pure parts of `npm run walk:auto` (walkAuto.ts): its arguments, picking the game's .gam from a
// folder's file names, and the per-scene table. No file or engine access, so tests can run them.
import type { SceneOutcome } from '../src/editor/check/walk/autoWalk';
import type { Walkthrough } from '../src/walkthrough/format';

/** The editor's "Make a walkthrough…" default: 60 s a scene (editor/widgets/walkDialog.ts). */
export const DEFAULT_BUDGET_S = 60;

export interface WalkAutoArgs {
  source: string;
  budgetMs: number;
  game?: string;
  out?: string;
  /** Only the arrows, Space and Enter (editor/check/keyLimit.ts): a keyboard accessibility check. */
  basicKeys?: boolean;
}

/** The existing walkthrough file, with optional diagnostic evidence for a stopped keys strategy. */
export interface WalkAutoOutput extends Walkthrough {
  diagnostics?: {
    keys: { scene: number; name: string; cutoff: NonNullable<SceneOutcome['keys']>['cutoff']; rounds: NonNullable<SceneOutcome['keys']>['rounds'] }[];
  };
}

/** Keeps --out compatible with a walkthrough reader while preserving any stopped keys diagnostics. */
export function walkOutput(walk: Walkthrough, scenes: readonly Omit<SceneOutcome, 'heat'>[]): WalkAutoOutput {
  const keys = scenes.flatMap(({ scene, name, keys }) => (keys ? [{ scene, name, cutoff: keys.cutoff, rounds: keys.rounds }] : []));
  return keys.length ? { ...walk, diagnostics: { keys } } : walk;
}

export function parseArgs(argv: string[]): WalkAutoArgs | string {
  let source: string | undefined;
  let budgetMs = DEFAULT_BUDGET_S * 1000;
  let game: string | undefined;
  let out: string | undefined;
  let basicKeys = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--basic-keys') {
      basicKeys = true;
      continue;
    }
    if (a === '--budget' || a === '--game' || a === '--out') {
      const v = argv[++i];
      if (v === undefined) return `${a} needs a value.`;
      if (a === '--game') game = v;
      else if (a === '--out') out = v;
      else {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 100) return '--budget is milliseconds a scene, 100 or more.';
        budgetMs = n;
      }
    } else if (a.startsWith('--')) return `Unknown option ${a}.`;
    else if (source === undefined) source = a;
    else return `Unexpected argument ${a}.`;
  }
  if (source === undefined) return 'Usage: npm run walk:auto -- <game folder | .zip> [--budget ms] [--game NAME.GAM] [--out walkthrough.json] [--basic-keys]';
  return { source, budgetMs, game, out, ...(basicKeys ? { basicKeys } : {}) };
}

/** The .gam to use among a folder's file names: the one asked for, the only one, or an error that lists them. */
export function pickGam(names: string[], want?: string): { gam: string } | { error: string } {
  const gams = names.filter((n) => /\.gam$/i.test(n)).sort();
  if (want !== undefined) {
    const hit = gams.find((n) => n.toLowerCase() === want.toLowerCase() || n.toLowerCase() === `${want.toLowerCase()}.gam`);
    return hit ? { gam: hit } : { error: `No ${want} here. Games found: ${gams.join(', ') || 'none'}.` };
  }
  if (gams.length === 1) return { gam: gams[0] };
  if (!gams.length) return { error: 'No .gam file found.' };
  return { error: `Several games here: ${gams.join(', ')}. Pick one with --game NAME.GAM.` };
}

/** One line a scene: number, name, the style that won (or all it tried), tries, ticks of play, outcome. */
export function sceneLine(s: Omit<SceneOutcome, 'heat'>, styleName: (id: string) => string): string {
  const how = s.strategy ? styleName(s.strategy) : s.tried.map(styleName).join(' > ') || 'none';
  const ticks = s.ticks === undefined ? '-' : `${(s.ticks / 70).toFixed(1)}s`;
  const line = `${String(s.scene).padStart(3)}  ${s.name.padEnd(24).slice(0, 24)}  ${how.padEnd(36)}  ${String(s.tried.length).padStart(2)}  ${ticks.padStart(7)}  ${s.strategy ? (s.next === undefined ? 'won' : `-> ${s.next}`) : 'STOPPED'}`;
  const diagnostic = s.keys;
  if (!diagnostic?.cutoff) return line;
  const round = diagnostic.rounds.at(-1);
  const context = round ? `${round.kind}${round.source ? ` c${round.source.counter} @ ${round.source.cell}` : ''}; ${round.places} places` : 'no search round';
  return `${line}\n      keys: ${diagnostic.cutoff} (${context})`;
}
