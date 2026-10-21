// Which finished game a game of your own was copied from. Kept in this browser beside the
// projects (never in the game's own files, which stay as DOS Game-Maker wrote them), so a
// copy's health check can tell the problems you made from the ones the original already had.
import type { CatalogEntry } from '../../project/files';
import type { Issue } from '../../project/health';

const KEY = 'gm-project-origin';

function read(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function write(map: Record<string, string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* not remembered: the copy is then matched by its .gam name */
  }
}

/** Remembers that project `id` began as a copy of catalog game `catalogId`. */
export function rememberOrigin(id: string, catalogId: string | undefined): void {
  if (!catalogId) return;
  write({ ...read(), [id]: catalogId });
}

export function forgetOrigin(id: string): void {
  const map = read();
  if (!(id in map)) return;
  delete map[id];
  write(map);
}

export function originId(id: string): string | undefined {
  return read()[id];
}

/**
 * The catalog game a project came from: the one it was copied from here, or else the one
 * finished game (not shareware) whose .gam file has the same name, as a copy made before
 * origins were remembered, or one brought in from the CD, would.
 */
export function findOriginal(p: { id: string; gam: string }, catalog: CatalogEntry[]): CatalogEntry | undefined {
  const known = originId(p.id);
  if (known) return catalog.find((g) => g.id === known);
  const same = catalog.filter((g) => g.gam && g.kind !== 'shareware' && g.gam.toLowerCase() === p.gam.toLowerCase());
  return same.length === 1 ? same[0] : undefined;
}

const issueKey = (i: Issue) => `${i.kind}|${i.message.toLowerCase()}`;

/** Splits a copy's issues into those it shares with its original and those that are new. */
export function splitInherited(mine: Issue[], original: Issue[]): { own: Issue[]; inherited: Issue[] } {
  const left = new Map<string, number>();
  for (const i of original) left.set(issueKey(i), (left.get(issueKey(i)) ?? 0) + 1);
  const own: Issue[] = [];
  const inherited: Issue[] = [];
  for (const i of mine) {
    const n = left.get(issueKey(i)) ?? 0;
    if (n) {
      left.set(issueKey(i), n - 1);
      inherited.push(i);
    } else own.push(i);
  }
  return { own, inherited };
}
