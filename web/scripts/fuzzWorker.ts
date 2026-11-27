// Bound the malformed-file worker's startup handshake, including replacement workers.
import type { ChildProcess } from 'node:child_process';

export function waitForReady(worker: ChildProcess, timeout: number) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => fail(`no ready message in ${timeout} ms`), timeout);
    function cleanup() {
      clearTimeout(timer);
      worker.off('message', onMessage);
      worker.off('error', onError);
      worker.off('exit', onExit);
    }
    function fail(reason: string) {
      cleanup();
      worker.kill('SIGKILL');
      reject(new Error(`Worker startup failed: ${reason}`));
    }
    function onMessage(message: { ready?: boolean }) {
      if (message.ready) {
        cleanup();
        resolve();
      }
    }
    function onError(error: Error) {
      fail(error.message);
    }
    function onExit(code: number | null, signal: NodeJS.Signals | null) {
      fail(`exited before ready (${signal ?? code})`);
    }
    worker.on('message', onMessage);
    worker.once('error', onError);
    worker.once('exit', onExit);
  });
}
