// The Assistant's read-only switch, shared by the bridge panel and the chat: kept in this
// browser, and heard by both, so ticking it in one keeps every AI to looking.
const KEY = 'gm-assistant-read-only';

let on = (() => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();
const listeners = new Set<(on: boolean) => void>();

export function assistantReadOnly(): boolean {
  return on;
}

export function setAssistantReadOnly(v: boolean): void {
  on = v;
  try {
    localStorage.setItem(KEY, v ? '1' : '');
  } catch {
    /* private mode: not remembered */
  }
  for (const l of listeners) l(v);
}

export function onAssistantReadOnly(fn: (on: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
