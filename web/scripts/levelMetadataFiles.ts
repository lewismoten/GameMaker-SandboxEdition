// Node-side per-game JSON storage for the Level Maps scans. Writes only changed files.
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function readMetadata<T>(dir: string): Record<string, T> {
  if (!existsSync(dir)) return {};
  return Object.fromEntries(
    readdirSync(dir)
      .filter((n) => n.endsWith('.json'))
      .sort()
      .map((n) => [n.slice(0, -5), JSON.parse(readFileSync(join(dir, n), 'utf8')) as T]),
  );
}

export function writeMetadata<T>(dir: string, data: Record<string, T>): void {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json'))) if (!Object.hasOwn(data, name.slice(0, -5))) unlinkSync(join(dir, name));
  for (const id of Object.keys(data).sort()) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`Invalid game id: ${id}`);
    const path = join(dir, `${id}.json`);
    const text = `${JSON.stringify(data[id])}\n`;
    if (!existsSync(path) || readFileSync(path, 'utf8') !== text) writeFileSync(path, text);
  }
}
