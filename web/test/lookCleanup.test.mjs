// Exercise OCR failure and cleanup in the CLI process with a synthetic snapshot.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it.each([
  [['--ocr'], 0],
  [['--expect', 'text'], 1],
])('cleans up after a failed OCR child with %j', (args, status) => {
  const dir = mkdtempSync(join(tmpdir(), 'look-test-'));
  try {
    const temp = join(dir, 'temp');
    mkdirSync(temp);
    const config = join(dir, '.config', 'ghostjack');
    mkdirSync(config, { recursive: true });
    writeFileSync(join(config, 'token'), 'test');
    const preload = join(dir, 'bridge.cjs');
    writeFileSync(
      preload,
      `
      globalThis.fetch = async () => new Response('synthetic image');
      const child = require('node:child_process');
      const run = child.execFileSync;
      child.execFileSync = (tool, args) => {
        if (tool === 'ffmpeg') return require('node:fs').writeFileSync(args.at(-1), 'processed');
        if (tool === 'tesseract') return run(process.execPath, ['-e', 'process.exit(1)']);
        throw new Error('unexpected tool ' + tool);
      };
      require('node:module').syncBuiltinESMExports();
    `,
    );
    const cli = fileURLToPath(new URL('../../scripts/look.mjs', import.meta.url));
    const result = spawnSync(process.execPath, ['--require', preload, cli, '--out', join(dir, 'image.jpg'), ...args], {
      env: { ...process.env, HOME: dir, USERPROFILE: dir, TMPDIR: temp, TEMP: temp, TMP: temp },
      encoding: 'utf8',
    });
    expect(result.stderr).toContain('tesseract is not installed (or failed)');
    expect(result.status).toBe(status);
    expect(readdirSync(temp)).toEqual([]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
