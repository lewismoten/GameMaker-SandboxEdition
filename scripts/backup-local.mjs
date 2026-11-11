// Back up the work Git doesn't keep (.for-lewis, .narrate's results, dosbox-saves, .claude/agents,
// Claude's memory folder, as memory/) into one dated, encrypted archive, and restore one for a drill.
//   npm run backup:local -- <folder>            writes <folder>/gamemaker-local-<date>.tgz.enc
//   npm run backup:restore -- <file> <folder>   unpacks it into <folder> (which must be empty or new)
// The passphrase comes from BACKUP_PASSPHRASE, or is asked for. AES-256-GCM, key from scrypt;
// node:crypto and the system tar only. Keep the passphrase somewhere other than the backup.
import { spawn } from 'node:child_process';
import { createCipheriv, randomBytes, scryptSync } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { pipeline } from 'node:stream/promises';
import { root } from './game-build-inputs.mjs';
import { restoreBackup } from './backup-restore.mjs';

const MAGIC = Buffer.from('GMLBK1\0\0');
const memory = join(homedir(), '.claude/projects/-Users-lewismoten-dev-GameMaker/memory');
// paths are relative to the repo root; the memory folder goes in as memory/
const include = ['.for-lewis', '.narrate', 'dosbox-saves', '.claude/agents'];
const exclude = ['.narrate/node_modules', '.narrate/models', '.DS_Store'];

async function passphrase() {
  if (process.env.BACKUP_PASSPHRASE) return process.env.BACKUP_PASSPHRASE;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Backup passphrase: ');
  rl.close();
  if (answer.length < 12) throw new Error('Use a passphrase of at least 12 characters.');
  return answer;
}

function tarArgs() {
  const args = ['-czf', '-', ...exclude.flatMap((p) => ['--exclude', p]), '-C', root];
  args.push(...include.filter((p) => existsSync(join(root, p))));
  if (existsSync(memory)) args.push('-C', join(memory, '..'), 'memory');
  return args;
}

async function backup(folder) {
  const pass = await passphrase();
  // refresh the session transcripts in .for-lewis first, so the backup has today's
  const chats = join(root, '.for-lewis/tools/extract-all-chats.sh');
  if (existsSync(chats)) await new Promise((ok) => spawn('zsh', [chats], { stdio: 'ignore' }).on('close', ok));
  mkdirSync(folder, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const file = join(folder, `gamemaker-local-${stamp}.tgz.enc`);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', scryptSync(pass, salt, 32), iv);
  const out = createWriteStream(file);
  out.write(Buffer.concat([MAGIC, salt, iv]));
  const tar = spawn('tar', tarArgs(), { stdio: ['ignore', 'pipe', 'inherit'] });
  const done = new Promise((ok, fail) => tar.on('close', (code) => (code ? fail(new Error(`tar exited ${code}`)) : ok())));
  await pipeline(tar.stdout, cipher, out, { end: false });
  await done;
  out.end(cipher.getAuthTag());
  await new Promise((ok) => out.on('finish', ok));
  console.log(`Backed up to ${file} (${(statSync(file).size / 1e6).toFixed(1)} MB).`);
}

async function restore(file, folder) {
  const pass = await passphrase();
  await restoreBackup(file, folder, pass);
  console.log(`Restored into ${folder}.`);
}

const [command, a, b] = process.argv.slice(2);
if (command === 'backup' && a) await backup(resolve(a));
else if (command === 'restore' && a && b) await restore(resolve(a), resolve(b));
else {
  console.error('Usage: backup-local.mjs backup <folder> | restore <file> <folder>');
  process.exit(1);
}
