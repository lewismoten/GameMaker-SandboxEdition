// The chat's archive: every request, reply and tool result, whole, numbered by request ("turn"),
// so compaction and Reset can take them out of the model's context and recall() can bring parts
// back as short excerpts. Kept per game in sessionStorage (this tab only, until it closes; never
// in the game's files, the companion data or backups), with the oldest entries let go past a cap.
import type { JsonSchema } from '../tools/types';

export interface ArchiveEntry {
  turn: number;
  role: 'user' | 'assistant' | 'tool' | 'summary';
  /** A tool's name. */
  name?: string;
  text: string;
}

export interface ArchiveStore {
  load(): ArchiveEntry[] | undefined;
  save(entries: ArchiveEntry[]): void;
}

const ENTRY_MAX = 6000;
const TOTAL_MAX = 400_000;

/** sessionStorage for one game; nothing is kept when it is unavailable. */
export function sessionArchive(projectId: string): ArchiveStore {
  const key = `gm-assistant-archive:${projectId}`;
  return {
    load: () => {
      try {
        const v = JSON.parse(sessionStorage.getItem(key) ?? 'null') as unknown;
        return Array.isArray(v) ? (v as ArchiveEntry[]) : undefined;
      } catch {
        return undefined;
      }
    },
    save: (entries) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(entries));
      } catch {
        /* full or private: the archive lasts in memory only */
      }
    },
  };
}

const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'what', 'was', 'are', 'you', 'did', 'from', 'about']);
const words = (q: string) =>
  q
    .toLowerCase()
    .split(/[^a-z0-9_.]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));

export class Archive {
  entries: ArchiveEntry[];

  constructor(private readonly store?: ArchiveStore) {
    this.entries = store?.load() ?? [];
  }

  /** The highest turn kept. */
  get lastTurn(): number {
    return this.entries.reduce((n, e) => Math.max(n, e.turn), 0);
  }

  add(e: ArchiveEntry): void {
    this.entries.push({ ...e, text: e.text.length > ENTRY_MAX ? `${e.text.slice(0, ENTRY_MAX)}…` : e.text });
    let total = this.entries.reduce((n, x) => n + x.text.length, 0);
    while (total > TOTAL_MAX && this.entries.length > 1) total -= this.entries.shift()!.text.length;
    this.store?.save(this.entries);
  }

  /** The entries best matching the words, newest first among equals, as short excerpts. */
  search(query: string, max = 5): string[] {
    const ws = words(query);
    if (!ws.length) return [];
    return this.entries
      .map((e, i) => {
        const t = e.text.toLowerCase();
        const score = ws.reduce((n, w) => n + (t.includes(w) ? 1 + Math.min(3, t.split(w).length - 2) * 0.1 : 0) + (e.name === w ? 1 : 0), 0);
        return { e, i, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.i - a.i)
      .slice(0, max)
      .map(({ e }) => `${label(e)} ${excerpt(e.text, ws)}`);
  }

  /** The entries of turns `from` to `to`, each cut short. */
  range(from: number, to: number, maxChars = 1800): string[] {
    const out: string[] = [];
    let used = 0;
    for (const e of this.entries.filter((x) => x.turn >= from && x.turn <= to)) {
      const line = `${label(e)} ${e.text.length > 300 ? `${e.text.slice(0, 300)}…` : e.text}`;
      if (used + line.length > maxChars) {
        out.push('… (more: ask for fewer turns)');
        break;
      }
      out.push(line);
      used += line.length;
    }
    return out;
  }

  clear(): void {
    this.entries = [];
    this.store?.save(this.entries);
  }
}

const label = (e: ArchiveEntry) => `[turn ${e.turn} ${e.role === 'tool' ? `tool ${e.name ?? ''}`.trim() : e.role}]`;

/** About 240 characters around the first word found. */
function excerpt(text: string, ws: string[]): string {
  const t = text.toLowerCase();
  const at = Math.min(...ws.map((w) => t.indexOf(w)).filter((i) => i >= 0));
  const from = Math.max(0, at - 80);
  const flat = text.slice(from, from + 240).replace(/\s+/g, ' ');
  return `${from > 0 ? '…' : ''}${flat}${from + 240 < text.length ? '…' : ''}`;
}

export const RECALL_SCHEMA: JsonSchema & { type: 'object' } = {
  type: 'object',
  properties: {
    query: { type: 'string', description: 'Words to look for.' },
    from_turn: { type: 'integer', minimum: 1 },
    to_turn: { type: 'integer', minimum: 1 },
  },
};

/** recall(): the words a search or a turn range finds, for the model. */
export function recallText(a: Archive, args: Record<string, unknown>): string {
  if (!a.entries.length) return 'The archive is empty: nothing earlier has been put away.';
  if (typeof args.query === 'string' && args.query.trim()) {
    const found = a.search(args.query);
    return found.length ? found.join('\n') : `Nothing in the archive mentions “${args.query}”. Turns 1-${a.lastTurn} are kept.`;
  }
  const to = typeof args.to_turn === 'number' ? args.to_turn : a.lastTurn;
  const from = typeof args.from_turn === 'number' ? args.from_turn : Math.max(1, to - 1);
  const lines = a.range(from, to);
  return lines.length ? lines.join('\n') : `No turns ${from}-${to}; the archive has turns 1-${a.lastTurn}.`;
}
