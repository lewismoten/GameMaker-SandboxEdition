// Starts the archive child process on first use and turns its messages into build(key) promises.
import { fork, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ArchiveWorker = ((key: string) => Promise<Uint8Array>) & { restart(): void };

export function archiveWorker(cdRoot: string): ArchiveWorker {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const viteNode = createRequire(import.meta.url).resolve('vite-node/vite-node.mjs');
  let child: ChildProcess | undefined;
  let next = 0;
  const pending = new Map<number, { owner?: ChildProcess; ok: (b: Uint8Array) => void; fail: (e: Error) => void }>();
  const start = () => {
    const c = fork(viteNode, ['scripts/gameArchiveWorker.ts', cdRoot], {
      cwd: dirname(here),
      execArgv: [], // not the parent's flags (a test runner's hooks trip the config loader)
      serialization: 'advanced',
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });
    c.on('message', (m: { id?: number; bytes?: Uint8Array; error?: string }) => {
      const p = m.id === undefined ? undefined : pending.get(m.id);
      if (!p || m.id === undefined) return;
      pending.delete(m.id);
      if (m.bytes) p.ok(m.bytes);
      else p.fail(new Error(m.error));
    });
    c.on('exit', () => {
      if (child === c) child = undefined;
      for (const [id, p] of pending) if (p.owner === c) (pending.delete(id), p.fail(new Error('Archive worker stopped')));
    });
    return c;
  };
  process.once('exit', () => child?.kill());
  const build = (key: string) =>
    new Promise<Uint8Array>((ok, fail) => {
      const id = next++;
      const owner = (child ??= start());
      pending.set(id, { owner, ok, fail });
      owner.send({ id, key });
    });
  /** Sources changed: the child scanned them at start, so replace it. */
  return Object.assign(build, {
    restart: () => {
      child?.kill();
      child = undefined;
    },
  });
}
