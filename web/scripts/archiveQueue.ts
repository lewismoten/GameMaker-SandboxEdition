// A priority queue of archive builds for the dev server: a request moves its archive to the front.
// Pure scheduling; the building itself is a function passed in (a worker process in cdGames.ts).

export interface ArchiveQueue {
  /** The built archive, or undefined while it is still queued or building (and then it jumps the queue). */
  request(key: string): Uint8Array | undefined;
  /** Queue keys (at the back, or the front in the given order); built or queued ones are left alone. */
  enqueue(keys: readonly string[], front?: boolean): void;
  /** Forget everything (sources changed); builds already running finish but are dropped. */
  clear(): void;
  /** Resolves when nothing is queued or running. */
  idle(): Promise<void>;
}

export function createArchiveQueue(build: (key: string) => Promise<Uint8Array>, concurrency = 1): ArchiveQueue {
  let ready = new Map<string, Uint8Array>();
  let queued: string[] = [];
  const running = new Set<string>();
  let generation = 0;
  const waiters: (() => void)[] = [];
  const settle = () => {
    if (!queued.length && !running.size) for (const w of waiters.splice(0)) w();
  };
  const pump = () => {
    while (running.size < concurrency && queued.length) {
      const key = queued.shift()!;
      const mine = generation;
      running.add(key);
      build(key)
        .then(
          (bytes) => {
            if (mine === generation) ready.set(key, bytes);
          },
          () => undefined, // not ready; a later request queues it again
        )
        .finally(() => {
          running.delete(key);
          pump();
          settle();
        });
    }
  };
  const enqueue = (keys: readonly string[], front = false) => {
    const fresh = keys.filter((k) => !ready.has(k) && !running.has(k));
    queued = front ? [...fresh, ...queued.filter((k) => !fresh.includes(k))] : [...queued, ...fresh.filter((k) => !queued.includes(k))];
    pump();
  };
  return {
    request(key) {
      const bytes = ready.get(key);
      if (!bytes) enqueue([key], true);
      return bytes;
    },
    enqueue,
    clear() {
      generation++;
      ready = new Map();
      queued = [];
      settle();
    },
    idle: () => (queued.length || running.size ? new Promise<void>((r) => waiters.push(r)) : Promise.resolve()),
  };
}
