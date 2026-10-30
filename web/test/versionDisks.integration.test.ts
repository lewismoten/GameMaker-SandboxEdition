// Local-only historical source rebuild: no committed disk files or repository-relative SDK imports.
import { expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VersionDisks } from '../../games/kit/versionDisks';
it('rebuilds historical source with that revision’s own workspace package', async () => {
  const root = mkdtempSync(join(tmpdir(), 'version-fixture-'));
  const put = (file: string, data: string) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), data);
  };
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  let disks: VersionDisks | undefined;
  try {
    put(
      'games/example/build.ts',
      `import {mkdirSync,writeFileSync} from 'node:fs';import {value} from '@lewismoten/gamemaker-sandbox-engine';const out=process.env.GAME_DISK_OUT!;mkdirSync(out,{recursive:true});writeFileSync(out+'/hello.gam',value);`,
    );
    put('web/package.json', '{"type":"module"}');
    put('web/vite.config.ts', "export default {resolve:{conditions:['gamemaker-source']},ssr:{noExternal:true,resolve:{conditions:['gamemaker-source']}}};");
    put(
      'web/packages/engine/package.json',
      '{"name":"@lewismoten/gamemaker-sandbox-engine","type":"module","exports":{".":{"gamemaker-source":"./src/index.ts","import":"./missing.js"}}}',
    );
    put('web/packages/engine/src/index.ts', "export const value='historical';");
    git('init', '--quiet');
    git('add', 'games', 'web');
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--quiet', '-m', 'fixture');
    const base = git('rev-parse', 'HEAD');
    symlinkSync(join(dirname(fileURLToPath(import.meta.url)), '../../node_modules'), join(root, 'node_modules'), 'junction');
    put('games/example/disk/hello.gam', 'historical');
    disks = new VersionDisks(root, base);
    expect(await disks.changed('example')).toBe(false);
    put('games/example/disk/hello.gam', 'changed');
    expect(await disks.changed('example')).toBe(true);
  } finally {
    disks?.dispose();
    rmSync(root, { recursive: true, force: true });
  }
}, 20_000);
