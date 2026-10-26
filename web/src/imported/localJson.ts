// One JSON value kept in this browser's localStorage, for the imported games' ratings, notes
// and removed-game records: read whole, written whole, and an empty value when storage is
// refused (a private window) or the text is damaged. Editor-only, never in a game's files.

export interface LocalJson<T> {
  read(): T;
  write(value: T): void;
}

export function localJson<T>(key: string, empty: () => T): LocalJson<T> {
  return {
    read() {
      try {
        const text = localStorage.getItem(key);
        return text ? (JSON.parse(text) as T) : empty();
      } catch {
        return empty();
      }
    },
    write(value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* not remembered this time */
      }
    },
  };
}
