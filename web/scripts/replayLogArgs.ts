// The replay tool's command line and the parts of the log it reads (scripts/replayLog.ts).
import { decodeInput, type InputStream, type Snap } from '../src/devLog/replayCore';

export interface Args {
  file: string;
  session?: string;
  play?: number;
  out?: string;
  /** 'snaps' (a frame at each snapshot), or ticks (game clocks) to draw. */
  frames: 'snaps' | number[] | undefined;
  dir?: string;
}

export function parseArgs(argv: string[]): Args | string {
  const a: Args = { file: '', frames: undefined };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    const val = () => argv[++i];
    if (v === '--session') a.session = val();
    else if (v === '--play') a.play = Number(val());
    else if (v === '--out') a.out = val();
    else if (v === '--dir') a.dir = val();
    else if (v === '--frames') {
      const f = val();
      a.frames = f === 'snaps' ? 'snaps' : (f ?? '').split(',').map(Number);
      if (Array.isArray(a.frames) && a.frames.some((n) => !Number.isFinite(n))) return '--frames wants "snaps" or game clocks such as 40,120,300';
    } else if (v.startsWith('-')) return `Unknown option ${v}`;
    else a.file = v;
  }
  if (!a.file) return 'Usage: npm run replay:log -- <log.jsonl> [--session id] [--play n] [--out dir] [--frames snaps|clock,clock,...] [--dir game folder]';
  if (a.out && !a.frames) a.frames = 'snaps';
  return a;
}

export type Entry = Record<string, unknown> & { kind: string; session: string };

export interface Play {
  session: string;
  start: Entry;
  snaps: (Snap & { why: string; held: number[] })[];
  input: { clock: number; scan: number }[];
  notes: Entry[];
  end?: Entry;
}

/** The plays in a log (one JSON object a line), in order, each with its snapshots and keys. */
export function readPlays(text: string, session?: string): Play[] {
  const plays: Play[] = [];
  const batches = new Map<Play, InputStream[]>();
  const by = new Map<string, Play>();
  for (const line of text.split('\n')) {
    if (!line.startsWith('{')) continue;
    let e: Entry;
    try {
      e = JSON.parse(line) as Entry;
    } catch {
      continue;
    }
    if (!e.kind?.startsWith('game-') || (session && e.session !== session)) continue;
    const key = `${e.session}/${String(e.play)}`;
    if (e.kind === 'game-start') {
      const p: Play = { session: e.session, start: e, snaps: [], input: [], notes: [] };
      plays.push(p);
      by.set(key, p);
      batches.set(p, []);
      continue;
    }
    const p = by.get(key);
    if (!p) continue;
    if (e.kind === 'game-input') batches.get(p)!.push(e.ev as InputStream);
    else if (e.kind === 'game-snap') p.snaps.push(e as unknown as Play['snaps'][number]);
    else if (e.kind === 'game-note') p.notes.push(e);
    else if (e.kind === 'game-end') p.end = e;
  }
  for (const p of plays) p.input = decodeInput(batches.get(p)!);
  return plays;
}
