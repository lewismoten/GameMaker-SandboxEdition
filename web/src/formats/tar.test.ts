// kit/tar: the ustar writer and reader that the Linux download uses.
import { describe, expect, it } from 'vitest';
import { createTar, readTar } from '@lewismoten/gamemaker-sandbox-tools/kit/tar';

const enc = new TextEncoder();

describe('tar', () => {
  it('reads back what it writes, modes and long names too', async () => {
    const long = `${'folder/'.repeat(20)}file.txt`;
    const tar = createTar(
      [
        { path: 'a/', mode: 0o755 },
        { path: 'a/run', data: enc.encode('#!/bin/sh\n'), mode: 0o755 },
        { path: long, data: new Uint8Array(1000) },
      ],
      new Date(0),
    );
    expect(tar.length % 512).toBe(0);
    const entries = await readTar(tar);
    expect(entries.map((e) => [e.path, e.mode, e.data.length])).toEqual([
      ['a/', 0o755, 0],
      ['a/run', 0o755, 10],
      [long, 0o644, 1000],
    ]);
  });
});
