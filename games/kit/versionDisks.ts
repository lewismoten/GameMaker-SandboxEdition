// Compare generated disks with a Git revision, rebuilding historical sources when outputs are untracked.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives';

export class VersionDisks {
  private snapshot?: string;
  constructor(
    private root: string,
    private base: string,
  ) {}

  private git(...args: string[]): Buffer {
    return execFileSync('git', args, { cwd: this.root, maxBuffer: 512 << 20 });
  }

  private async sources(): Promise<string> {
    if (this.snapshot) return this.snapshot;
    this.snapshot = mkdtempSync(join(tmpdir(), 'gm-version-'));
    const files = await readZip(this.git('archive', '--format=zip', this.base, 'games', 'web'), { maxBytes: 512 << 20, maxEntries: 32768 });
    for (const file of files) {
      const target = join(this.snapshot, file.name);
      if (file.name.endsWith('/')) mkdirSync(target, { recursive: true });
      else {
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, file.data);
      }
    }
    // Reuse installed third-party dependencies, but resolve workspace source from this revision.
    const modules = join(this.snapshot, 'node_modules');
    mkdirSync(modules, { recursive: true });
    for (const entry of readdirSync(join(this.root, 'node_modules'), { withFileTypes: true }))
      if (entry.isDirectory() && entry.name !== '@lewismoten') symlinkSync(join(this.root, 'node_modules', entry.name), join(modules, entry.name), 'junction');
    mkdirSync(join(modules, '@lewismoten'), { recursive: true });
    for (const name of ['engine', 'tools', 'archives']) {
      const pkg = join(this.snapshot, 'web/packages', name);
      if (existsSync(pkg)) symlinkSync(pkg, join(modules, '@lewismoten', `gamemaker-sandbox-${name}`), 'junction');
    }
    return this.snapshot;
  }

  async changed(id: string): Promise<boolean> {
    const prefix = `games/${id}/disk/`;
    const stored = this.git('ls-tree', '-r', '--format=%(objectname) %(path)', this.base, '--', prefix).toString().trim();
    const current = join(this.root, prefix);
    if (!existsSync(current)) throw new Error('Build game outputs before checking versions.');
    if (stored) {
      const blobs = new Map(stored.split('\n').map((line) => [line.slice(41 + prefix.length), line.slice(0, 40)]));
      const names = readdirSync(current);
      return (
        names.length !== blobs.size ||
        names.some((name) => {
          const data = readFileSync(join(current, name));
          const blob = createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
          return blob !== blobs.get(name);
        })
      );
    }
    const snapshot = await this.sources();
    const out = join(snapshot, 'comparison-disk');
    execFileSync(process.execPath, [join(this.root, 'node_modules/vite-node/vite-node.mjs'), `../games/${id}/build.ts`], {
      cwd: join(snapshot, 'web'),
      env: { ...process.env, GAME_DISK_OUT: out, TEXT_BOUNDS: '' },
      stdio: 'pipe',
      maxBuffer: 64 << 20,
      timeout: 240_000,
    });
    const names = readdirSync(current);
    return (
      names.length !== readdirSync(out).length ||
      names.some((name) => !existsSync(join(out, name)) || !readFileSync(join(current, name)).equals(readFileSync(join(out, name))))
    );
  }

  dispose(): void {
    if (this.snapshot) rmSync(this.snapshot, { recursive: true, force: true });
  }
}
