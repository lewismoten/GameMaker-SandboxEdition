// Supply the browser project with the exact address its Vite child bound.
import { fork } from 'node:child_process';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  interface ProvidedContext {
    appBase: string;
  }
}

export default async function setup(project: TestProject) {
  const child = fork(new URL('./appServerChild.mjs', import.meta.url), [], { execArgv: [] });
  const closed = new Promise<void>((resolve) => child.once('close', () => resolve()));
  const stop = async () => {
    if (child.connected) child.disconnect();
    await closed;
  };
  try {
    const base = await new Promise<string>((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code, signal) => reject(new Error(`Browser test server exited (${signal ?? code})`)));
      child.once('message', (url) => (typeof url === 'string' ? resolve(url) : reject(new Error('Invalid browser test server address'))));
    });
    project.provide('appBase', base);
    return stop;
  } catch (error) {
    await stop();
    throw error;
  }
}
