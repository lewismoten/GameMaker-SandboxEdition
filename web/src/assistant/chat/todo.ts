// A game's running to-do list and its assistant credits, kept in the project's companion data
// (project/companion.ts: editor-only, never in the DOS files or the exports' game files), as
// sections of the .gam file's extras. The coach's newest list takes the place of its older
// items still open; ticked items, the person's own and the ones the assistant added stay.
import { getSection, type Companion } from '../../project/companion';

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  /** Being worked on now (the "Doing" group); kept only while true, and never with done. */
  doing?: boolean;
  /** Who added it: the coach (the model), the Level check (no AI set up), the person, or the assistant as it worked (todoTool.ts). */
  from: 'coach' | 'check' | 'you' | 'ai';
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
  return Array.isArray(v) ? v.filter(isItem).map((x) => ({ ...x, done: !!x.done, ...(x.doing && !x.done ? { doing: true } : { doing: undefined }) })) : [];
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

/** The person's own item (or the assistant's), at the end; one already there isn't added again. */
export function addTodo(p: TodoHost, text: string, now = new Date(), from: 'you' | 'ai' = 'you'): TodoItem[] {
  const list = todos(p);
  if (!text.trim() || list.some((x) => key(x.text) === key(text))) return list;
  return save(p, [...list, item(text, from, now)]);
}

/** A new list from the coach or the Level check: its open items replace the older ones of theirs; ticked items and the person's own stay. */
export function refreshTodos(p: TodoHost, texts: string[], from: 'coach' | 'check', now = new Date()): TodoItem[] {
  const list = todos(p);
  const keep = list.filter((x) => x.done || x.from === 'you' || x.from === 'ai');
  const seen = new Set(keep.map((x) => key(x.text)));
  const fresh = texts.filter((t) => t.trim() && !seen.has(key(t)) && (seen.add(key(t)), true)).map((t) => item(t, from, now));
  return save(p, [...fresh, ...keep.filter((x) => !x.done), ...keep.filter((x) => x.done)]);
}

/** Ticks an item done (no longer doing), or back to do. */
export function setDone(p: TodoHost, id: string, done: boolean): TodoItem[] {
  return save(
    p,
    todos(p).map((x) => (x.id === id ? { ...x, done, doing: undefined } : x)),
  );
}

/** Moves an item to Doing (and out of Done), or back to To do. */
export function setDoing(p: TodoHost, id: string, doing: boolean): TodoItem[] {
  return save(
    p,
    todos(p).map((x) => (x.id === id ? { ...x, done: false, doing: doing || undefined } : x)),
  );
}

/** The list in its three groups, in order. */
export function grouped(items: TodoItem[]): { doing: TodoItem[]; todo: TodoItem[]; done: TodoItem[] } {
  return { doing: items.filter((x) => x.doing), todo: items.filter((x) => !x.doing && !x.done), done: items.filter((x) => x.done) };
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
