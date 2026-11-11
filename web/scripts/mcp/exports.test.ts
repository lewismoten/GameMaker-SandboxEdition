// insideDir: the MCP exports' local fetch must not read a sibling folder that shares a prefix.
import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GameFiles } from '../../src/project/files';
import { buildExport, insideDir } from './exports';

describe('insideDir', () => {
  it('accepts the folder and what is in it', () => {
    expect(insideDir('/app/dist', '/app/dist')).toBe(true);
    expect(insideDir('/app/dist/a/b.js', '/app/dist')).toBe(true);
  });
  it('refuses a sibling with the same prefix and anything above', () => {
    expect(insideDir('/app/dist-old/secret', '/app/dist')).toBe(false);
    expect(insideDir('/app/other', '/app/dist')).toBe(false);
    expect(insideDir('/app', '/app/dist')).toBe(false);
  });
});

const { exporter } = vi.hoisted(() => ({ exporter: vi.fn() }));
vi.mock('../../src/export/exportSinglePage', () => ({ exportSinglePage: exporter }));

it('serializes concurrent exports and restores global fetch after success and failure', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gm-exports-'));
  const original = globalThis.fetch;
  try {
    for (const name of ['a', 'b']) {
      mkdirSync(join(dir, name));
      writeFileSync(join(dir, name, 'standalone.html'), name);
    }
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    const seen: string[] = [];
    exporter.mockImplementation(async (_files: GameFiles, options: { title: string; appBase: string }) => {
      seen.push(options.title);
      if (options.title === 'a') {
        started();
        await gate;
      }
      const html = await (await fetch(`${options.appBase}standalone.html`)).text();
      expect(html).toBe(options.title);
      if (options.title === 'b') throw new Error('export failed');
      return { name: 'game.html', html };
    });
    const job = (name: string) =>
      buildExport({ files: new GameFiles(), gam: 'game.gam', title: name, player: {}, format: 'web_page', appDir: join(dir, name) });
    const a = job('a');
    await ready;
    const b = expect(job('b')).rejects.toThrow('export failed');
    await Promise.resolve();
    expect(seen).toEqual(['a']);
    release();
    await a;
    await b;
    expect(globalThis.fetch).toBe(original);
    await job('a');
    expect(globalThis.fetch).toBe(original);
  } finally {
    exporter.mockReset();
    globalThis.fetch = original;
    rmSync(dir, { recursive: true, force: true });
  }
});
