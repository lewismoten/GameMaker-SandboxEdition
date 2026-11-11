// Authenticate the complete local backup before tar sees plaintext; publish only a complete restore.
import { spawn } from 'node:child_process';
import { createDecipheriv, scryptSync } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, open, readdir, rename, rm, rmdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';

const MAGIC = Buffer.from('GMLBK1\0\0');

async function extractTar(file, folder) {
  const tar = spawn('tar', ['-xzf', file, '-C', folder], { stdio: ['ignore', 'inherit', 'inherit'] });
  await new Promise((ok, fail) => {
    tar.on('error', fail);
    tar.on('close', (code) => (code ? fail(new Error(`tar exited ${code}`)) : ok()));
  });
}

export async function restoreBackup(file, folder, pass, extract = extractTar) {
  const empty = async () => {
    try {
      if ((await readdir(folder)).length) throw new Error(`${folder} is not empty.`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  };
  await empty();
  await mkdir(dirname(folder), { recursive: true });
  const temp = await mkdtemp(join(dirname(folder), '.gm-restore-'));
  try {
    const size = (await stat(file)).size;
    const head = Buffer.alloc(MAGIC.length + 28);
    const tail = Buffer.alloc(16);
    if (size <= head.length + tail.length) throw new Error('Truncated backup.');
    const handle = await open(file);
    try {
      await handle.read(head, 0, head.length, 0);
      await handle.read(tail, 0, tail.length, size - tail.length);
    } finally {
      await handle.close();
    }
    if (!head.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Not a backup made by backup-local.mjs.');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      scryptSync(pass, head.subarray(MAGIC.length, MAGIC.length + 16), 32),
      head.subarray(MAGIC.length + 16),
    ).setAuthTag(tail);
    const plain = join(temp, 'archive.tgz');
    await pipeline(createReadStream(file, { start: head.length, end: size - 17 }), decipher, createWriteStream(plain, { flags: 'wx', mode: 0o600 }));
    // pipeline has now checked the GCM tag. Nothing has been extracted yet.
    const staged = join(temp, 'files');
    await mkdir(staged);
    await extract(plain, staged);
    await empty();
    try {
      await rmdir(folder);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await rename(staged, folder);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
