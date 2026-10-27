// A game's running to-do list and its assistant credits, kept in the project's companion data
// (project/companion.ts: editor-only, never in the DOS files or the exports' game files), as
// sections of the .gam file's extras. The coach's newest list takes the place of its older
// items still open; ticked items and the person's own stay.
import { getSection, type Companion } from '../../project/companion';

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  /** Who added it: the coach (the model), the Level check (no AI set up), or the person. */
  from: 'coach' | 'check' | 'you';
  /** When, as an ISO date. */
  added: string;
}

/** The part of a Project the list needs. */
export interface TodoHost {
  readonly gam: string;
  extras<T>(file: string, section: string, fallback: T): T;
  setExtras(file: string, section: string, value: unknown): void;
}

const TODO = 'assistantTodo';
const CREDITS = 'assistantCredits';
const MAX = 40;

const key = (t: string) => t.toLowerCase().replace(/\W+/g, ' ').trim();
const isItem = (v: unknown): v is TodoItem =>
  !!v && typeof v === 'object' && typeof (v as TodoItem).text === 'string' && typeof (v as TodoItem).id === 'string';

export function todos(p: TodoHost): TodoItem[] {
  const v = p.extras<unknown>(p.gam, TODO, []);
  return Array.isArray(v) ? v.filter(isItem).map((x) => ({ ...x, done: !!x.done })) : [];
}

function save(p: TodoHost, items: TodoItem[]): TodoItem[] {
  const kept = items.slice(0, MAX);
  p.setExtras(p.gam, TODO, kept.length ? kept : undefined);
  return kept;
}

let n = 0;
const item = (text: string, from: TodoItem['from'], now: Date): TodoItem => ({
  id: `${now.getTime().toString(36)}-${(++n).toString(36)}`,
  text: text.trim().slice(0, 300),
  done: false,
  from,
  added: now.toISOString().slice(0, 10),
});

/** The person's own item, at the end. */
export function addTodo(p: TodoHost, text: string, now = new Date()): TodoItem[] {
  const list = todos(p);
  if (!text.trim() || list.some((x) => key(x.text) === key(text))) return list;
  return save(p, [...list, item(text, 'you', now)]);
}

/** A new list from the coach or the Level check: its open items replace the older ones of theirs; ticked items and the person's own stay. */
export function refreshTodos(p: TodoHost, texts: string[], from: 'coach' | 'check', now = new Date()): TodoItem[] {
  const list = todos(p);
  const keep = list.filter((x) => x.done || x.from === 'you');
  const seen = new Set(keep.map((x) => key(x.text)));
  const fresh = texts.filter((t) => t.trim() && !seen.has(key(t)) && (seen.add(key(t)), true)).map((t) => item(t, from, now));
  return save(p, [...fresh, ...keep.filter((x) => !x.done), ...keep.filter((x) => x.done)]);
}

export function setDone(p: TodoHost, id: string, done: boolean): TodoItem[] {
  return save(
    p,
    todos(p).map((x) => (x.id === id ? { ...x, done } : x)),
  );
}

export function removeTodo(p: TodoHost, id: string): TodoItem[] {
  return save(
    p,
    todos(p).filter((x) => x.id !== id),
  );
}

export function clearDone(p: TodoHost): TodoItem[] {
  return save(
    p,
    todos(p).filter((x) => !x.done),
  );
}

// ---- credits ---------------------------------------------------------------------------------

/** "Assistant: llama3.1 via Ollama", once for each model that changed the game. */
export function addCredit(p: TodoHost, label: string): void {
  const line = `Assistant: ${label}`;
  const now = credits(p);
  if (!now.includes(line)) p.setExtras(p.gam, CREDITS, [...now, line]);
}

export function credits(p: TodoHost): string[] {
  const v = p.extras<unknown>(p.gam, CREDITS, []);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** The credit lines in a companion (for the downloads' About text), or none. */
export function companionCredits(c: Companion | undefined, gam: string): string[] {
  const v = c ? getSection<unknown>(c, gam, CREDITS, []) : [];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
